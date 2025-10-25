import { CustomTooltip } from "@/components/materials/tooltip"
import { IconButton } from "@/components/materials/icon-button"
import { Phone, Video } from "lucide-react"
import { useVoiceCall } from "@/hooks/voice-call"
import { useUser } from "@/hooks/user"
import { useEffect, useRef, useState } from "react"
import type { TDirectChat } from "@/utils/types/be-api"
import { EVoiceCallStatus } from "@/utils/enums"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { toaster } from "@/utils/toaster"
import { emitLog } from "@/utils/helpers"
import type { TEmitLogMessage } from "@/utils/types/global"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import IncomingCallModal from "@/components/voice-call/in-coming-call-modal"
import {
  resetCallSession,
  resetIncomingCallSession,
  setCallSession,
  updateIncomingCallSession,
} from "@/redux/call/layout.slice"
import { useVideoCall } from "@/hooks/video-call"
import HolderUI from "@/components/voice-call/holder"
import { TCallRequestEmitRes } from "@/utils/types/socket"
import { userService } from "@/services/user.service"

type TCallBoxProps = {
  open: boolean
  directChat: TDirectChat
  isIncoming?: boolean
  callSession: any
  onClose: () => void
}

const CallBox = ({ open, directChat, isIncoming = false, onClose, callSession }: TCallBoxProps) => {
  const { id: directChatId, creatorId, recipientId } = directChat
  const user = useUser()!
  const calleeUserId = creatorId === user.id ? recipientId : creatorId

  const dispatch = useAppDispatch()
  const {
    hangupCall,
    acceptCall,
    rejectCall,
    getRemoteStream,
    getP2pConnection,
    getLocalStream,
    toggleMic,
    toggleVideo: voiceCallToggleVideo, // Lấy từ useVoiceCall
    isVideoEnabled: voiceCallIsVideoEnabled, // Lấy từ useVoiceCall
  } = useVoiceCall()

  // ✅ States
  const [callState, setCallState] = useState<EVoiceCallStatus | undefined>(undefined)
  const [logs, setLogs] = useState<TEmitLogMessage[]>([])
  const [calleeName, setCalleeName] = useState<string>("callee")
  const [callerName, setCallerName] = useState<string>("caller")
  const [calleeAvatar, setCalleeAvatar] = useState<string>("/images/user/default-avatar-white.webp")
  const [showIncomingModal, setShowIncomingModal] = useState(false)
  const [peerRejected, setPeerRejected] = useState(false)

  const remoteAudioEleRef = useRef<HTMLAudioElement>(null!)
  const incomingCallSession = useAppSelector((state) => state["voice-call"]?.incomingCallSession)

  const { localVideoRef, remoteVideoRef, toggleVideo, isVideoEnabled, cleanupVideo } = useVideoCall(
    {
      p2pConnection: getP2pConnection(),
      localStream: getLocalStream(),
      remoteStream: getRemoteStream(),
      onRemoteStreamUpdate: (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream
        }
      },
    }
  )
  useEffect(() => {
    const localVideo = localVideoRef.current
    const localStream = getLocalStream()

    console.log(">>> [CallBox] Updating local video", {
      hasVideoElement: !!localVideo,
      hasStream: !!localStream,
      isVideoEnabled: voiceCallIsVideoEnabled,
    })

    if (localVideo && localStream) {
      localVideo.srcObject = localStream
      console.log(
        ">>> [CallBox] Local video srcObject set:",
        localStream.getVideoTracks().length,
        "video tracks"
      )
    }
  }, [localVideoRef, getLocalStream, voiceCallIsVideoEnabled])

  // **FIX: Gán remoteStream vào remoteVideoRef**
  useEffect(() => {
    const remoteVideo = remoteVideoRef.current
    const remoteStream = getRemoteStream()

    console.log(">>> [CallBox] Updating remote video", {
      hasVideoElement: !!remoteVideo,
      hasStream: !!remoteStream,
    })

    if (remoteVideo && remoteStream) {
      remoteVideo.srcObject = remoteStream
      console.log(
        ">>> [CallBox] Remote video srcObject set:",
        remoteStream.getVideoTracks().length,
        "video tracks"
      )
    }
  }, [remoteVideoRef, getRemoteStream])

  // **FIX: Listen to remote video updates từ event emitter**
  useEffect(() => {
    const handleRemoteVideoUpdate = (stream: MediaStream) => {
      console.log(">>> [CallBox] Remote video updated event:", stream)
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream
        console.log(">>> [CallBox] Remote video srcObject updated from event")
      }
    }

    eventEmitter.on(EInternalEvents.REMOTE_VIDEO_UPDATED, handleRemoteVideoUpdate)

    return () => {
      eventEmitter.off(EInternalEvents.REMOTE_VIDEO_UPDATED, handleRemoteVideoUpdate)
    }
  }, [remoteVideoRef])
  // **VIDEO: Wrapper để sync giữa useVoiceCall và useVideoCall**
  const handleToggleVideo = async () => {
    const result = await voiceCallToggleVideo()
    // Có thể sync thêm state nếu cần
    return result
  }

  useEffect(() => {
    return () => {
      console.log(">>> CallBox unmounting - resetting ALL state")
      setCallState(undefined)
      setShowIncomingModal(false)
      setPeerRejected(false)
      setCalleeName("callee")
      setCallerName("caller")
      cleanupVideo()
    }
  }, [cleanupVideo])

  useEffect(() => {
    if (!open) {
      console.log(">>> CallBox closed - resetting state")
      setCallState(undefined)
      setShowIncomingModal(false)
      setPeerRejected(false)
    }
  }, [open])

  const handleAcceptFromModal = () => {
    console.log(">>> [handleAcceptFromModal] Accepting call - current state:", callState)
    acceptCall()
    setShowIncomingModal(false)
    setCallState(EVoiceCallStatus.CONNECTED)
  }

  const handleRejectFromModal = () => {
    console.log(">>> [handleRejectFromModal] Rejecting call")
    rejectCall()

    setShowIncomingModal(false)
    setCallState(EVoiceCallStatus.REJECTED)

    eventEmitter.emit(EInternalEvents.CALL_REJECTED, directChatId)

    dispatch(resetIncomingCallSession())
    dispatch(resetCallSession())

    cleanupVideo()
    onClose()
  }

  const handleEndCall = () => {
    console.log(">>> [handleEndCall] Ending call - current state:", callState)
    hangupCall()

    setShowIncomingModal(false)
    setCallState(EVoiceCallStatus.ENDED)

    dispatch(resetCallSession())
    dispatch(resetIncomingCallSession())

    cleanupVideo()
    onClose()
  }

  const handlePeerCancelled = (data: { directChatId?: number }) => {
    if (!data.directChatId || data.directChatId === directChatId) {
      console.log(">>> [handlePeerCancelled] Peer cancelled call")

      setCallState(EVoiceCallStatus.CANCELLED)
      setShowIncomingModal(false)

      dispatch(resetCallSession())
      dispatch(resetIncomingCallSession())

      cleanupVideo()
      onClose()
    }
  }

  const handlePeerRejected = (data: { directChatId?: number }) => {
    if (!data.directChatId || data.directChatId === directChatId) {
      console.log(">>> [handlePeerRejected] Peer rejected call")
      emitLog(`Peer rejected call for chat ${directChatId}. Closing UI.`)

      setPeerRejected(true)
      setCallState(EVoiceCallStatus.REJECTED)
      setShowIncomingModal(false)

      dispatch(resetCallSession())
      dispatch(resetIncomingCallSession())

      cleanupVideo()
      onClose()
    }
  }

  const listenCallRejected = (chatId: number) => {
    if (chatId === directChatId) {
      console.log(">>> [listenCallRejected] Call rejected/cancelled for chat:", chatId)
      emitLog(`Call Rejected/Cancelled for chat ${chatId}. Closing modal.`)

      setCallState(EVoiceCallStatus.REJECTED)
      setShowIncomingModal(false)

      cleanupVideo()
      onClose()
    }
  }

  const listenCallRequestReceived = () => {
    console.log(">>> [listenCallRequestReceived] Call request received - isIncoming:", isIncoming)

    if (isIncoming) {
      dispatch(updateIncomingCallSession({ status: EVoiceCallStatus.RINGING }))
      setCallState(EVoiceCallStatus.RINGING)
      setShowIncomingModal(true)
    }
  }

  const listenInitRemoteStream = () => {
    const remoteStream = getRemoteStream()
    if (remoteStream) {
      const audioEle = remoteAudioEleRef.current
      if (audioEle) {
        audioEle.srcObject = remoteStream
      }
    }
  }

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const currentUserId = user?.id
        if (!currentUserId) {
          console.error(">>> [CallBox] Error: Current user ID not found")
          return
        }

        const targetUserId =
          directChat.creatorId === currentUserId ? directChat.recipientId : directChat.creatorId

        const targetUser = await userService.getUserById(targetUserId)

        if (isIncoming && incomingCallSession) {
          setCalleeName(targetUser.Profile?.fullName || "Unknown")
          setCalleeAvatar(targetUser.Profile?.avatar || "/images/user/default-avatar-white.webp")
        } else {
          setCallerName(targetUser.Profile?.fullName || "Unknown")
        }
      } catch (error) {
        console.error(">>> [CallBox] Failed to fetch user info:", error)
        toaster.error("Failed to load user information")
      }
    }

    if (open) {
      fetchUserInfo()
    }
  }, [open, isIncoming, incomingCallSession, directChat, user])

  useEffect(() => {
    if (!open) return

    console.log(">>> [CallBox] Initializing - isIncoming:", isIncoming, "open:", open)

    if (isIncoming) {
      console.log(">>> [CallBox] Setting RINGING for incoming call")
      setCallState(EVoiceCallStatus.RINGING)
      setShowIncomingModal(true)
      dispatch(updateIncomingCallSession({ status: EVoiceCallStatus.RINGING }))
    } else {
      console.log(">>> [CallBox] Setting RINGING for outgoing call")
      setCallState(EVoiceCallStatus.RINGING)
      setShowIncomingModal(false)
    }
  }, [open, isIncoming, dispatch])

  useEffect(() => {
    console.log(">>> [CallBox] Registering event listeners")

    eventEmitter.on(EInternalEvents.INIT_REMOTE_STREAM, listenInitRemoteStream)
    eventEmitter.on(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED, listenCallRequestReceived)
    eventEmitter.on(EInternalEvents.CALL_REJECTED, listenCallRejected)
    eventEmitter.on(EInternalEvents.CALL_CANCELLED_BY_PEER, handlePeerCancelled)
    eventEmitter.on(EInternalEvents.CALL_REJECTED_BY_PEER, handlePeerRejected)
    eventEmitter.on(EInternalEvents.EMIT_LOG, (messages) => {
      setLogs((prev) => [...messages, ...prev])
    })

    return () => {
      console.log(">>> [CallBox] Unregistering event listeners")
      eventEmitter.off(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED, listenCallRequestReceived)
      eventEmitter.off(EInternalEvents.INIT_REMOTE_STREAM, listenInitRemoteStream)
      eventEmitter.off(EInternalEvents.CALL_REJECTED, listenCallRejected)
      eventEmitter.off(EInternalEvents.CALL_CANCELLED_BY_PEER, handlePeerCancelled)
      eventEmitter.off(EInternalEvents.CALL_REJECTED_BY_PEER, handlePeerRejected)
      eventEmitter.off(EInternalEvents.EMIT_LOG)
    }
  }, [directChatId, onClose, cleanupVideo])

  const shouldShowIncomingModal =
    isIncoming && callState === EVoiceCallStatus.RINGING && showIncomingModal

  const shouldShowHolder =
    !shouldShowIncomingModal &&
    (callState === EVoiceCallStatus.CONNECTED ||
      (callState === EVoiceCallStatus.RINGING && !isIncoming))

  console.log(">>> [CallBox] Render decision:", {
    callState,
    isIncoming,
    showIncomingModal,
    shouldShowIncomingModal,
    shouldShowHolder,
  })

  return (
    <div className="mt-6">
      {shouldShowHolder && (
        <HolderUI
          onClose={handleEndCall}
          calleeName={callerName}
          callState={callState!}
          remoteAudioEleRef={remoteAudioEleRef}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          toggleVideo={handleToggleVideo} // **VIDEO: Dùng wrapper function**
          isVideoEnabled={voiceCallIsVideoEnabled} // **VIDEO: Dùng state từ useVoiceCall**
          toggleMic={toggleMic}
        />
      )}

      {shouldShowIncomingModal && (
        <IncomingCallModal
          open={true}
          callerName={calleeName}
          callerAvatar={calleeAvatar}
          onAccept={handleAcceptFromModal}
          onReject={handleRejectFromModal}
        />
      )}

      <audio ref={remoteAudioEleRef} autoPlay playsInline />
    </div>
  )
}

// ===== VoiceCall Component =====
type TVoiceCallProps = {
  canSend: boolean
  directChat: TDirectChat
}

export const VoiceCall = ({ canSend, directChat }: TVoiceCallProps) => {
  const [callBoxOpen, setCallBoxOpen] = useState<boolean>(false)
  const incomingCallSession = useAppSelector((state) => state["voice-call"]?.incomingCallSession)
  const callSession = useAppSelector((state) => state["voice-call"].callSession)
  const dispatch = useAppDispatch()
  const { startCall } = useVoiceCall()
  const user = useUser()!

  useEffect(() => {
    if (
      callSession?.status === EVoiceCallStatus.REJECTED ||
      callSession?.status === EVoiceCallStatus.ENDED ||
      callSession?.status === EVoiceCallStatus.CANCELLED
    ) {
      console.log(">>> [VoiceCall] Call ended/rejected/cancelled - closing CallBox")
      setCallBoxOpen(false)
    }
  }, [callSession?.status])

  useEffect(() => {
    const handleIncoming = () => {
      console.log(">>> [VoiceCall] Received incoming call event")
      setCallBoxOpen(true)
    }

    eventEmitter.on(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED, handleIncoming)

    return () => {
      eventEmitter.off(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED, handleIncoming)
    }
  }, [])

  useEffect(() => {
    if (incomingCallSession) {
      console.log(">>> [VoiceCall] IncomingCallSession detected - opening CallBox")
      setCallBoxOpen(true)
    }
  }, [incomingCallSession])

  // **VIDEO: Hàm gọi thoại (audio only)**
  const handleVoiceCall = () => {
    if (incomingCallSession) {
      console.log(">>> [VoiceCall] Cannot start call - already has incoming session")
      return
    }

    const currentUserId = user?.id
    if (!currentUserId) {
      console.error(">>> [VoiceCall] Error: Current user ID not found")
      toaster.error("Cannot start call: User not authenticated")
      return
    }

    const calleeUserId =
      directChat.creatorId === currentUserId ? directChat.recipientId : directChat.creatorId

    console.log(">>> [VoiceCall] Starting voice call", {
      currentUserId,
      calleeUserId,
      directChatId: directChat.id,
    })

    if (calleeUserId === currentUserId) {
      console.error(">>> [VoiceCall] Error: Cannot call yourself")
      toaster.error("Cannot call yourself")
      return
    }

    setCallBoxOpen(true)

    startCall(
      calleeUserId,
      directChat.id,
      (res: TCallRequestEmitRes) => {
        console.log(">>> [VoiceCall] Voice call request response:", res)
        if (res.session) {
          dispatch(setCallSession(res.session))
        }
      },
      false
    ).catch((error) => {
      // **VIDEO: isVideoCall = false**
      console.error(">>> [VoiceCall] Failed to start voice call:", error)
      toaster.error(`Failed to start call: ${error.message}`)
      setCallBoxOpen(false)
    })
  }

  // **VIDEO: Hàm gọi video - MỚI**
  const handleVideoCall = () => {
    if (incomingCallSession) {
      console.log(">>> [VideoCall] Cannot start call - already has incoming session")
      return
    }

    const currentUserId = user?.id
    if (!currentUserId) {
      console.error(">>> [VideoCall] Error: Current user ID not found")
      toaster.error("Cannot start call: User not authenticated")
      return
    }

    const calleeUserId =
      directChat.creatorId === currentUserId ? directChat.recipientId : directChat.creatorId

    console.log(">>> [VideoCall] Starting video call", {
      currentUserId,
      calleeUserId,
      directChatId: directChat.id,
    })

    if (calleeUserId === currentUserId) {
      console.error(">>> [VideoCall] Error: Cannot call yourself")
      toaster.error("Cannot call yourself")
      return
    }

    setCallBoxOpen(true)

    startCall(
      calleeUserId,
      directChat.id,
      (res: TCallRequestEmitRes) => {
        console.log(">>> [VideoCall] Video call request response:", res)
        if (res.session) {
          dispatch(setCallSession(res.session))
        }
      },
      true
    ).catch((error) => {
      // **VIDEO: isVideoCall = true**
      console.error(">>> [VideoCall] Failed to start video call:", error)
      toaster.error(`Failed to start video call: ${error.message}`)
      setCallBoxOpen(false)
    })
  }

  const handleCallBoxClose = () => {
    console.log(">>> [VoiceCall] CallBox closed by user")
    setCallBoxOpen(false)
  }

  console.log(">>> [VoiceCall] ========== RENDER ==========")
  console.log(">>> [VoiceCall] callBoxOpen:", callBoxOpen)
  console.log(">>> [VoiceCall] incomingCallSession:", incomingCallSession)
  console.log(">>> [VoiceCall] callSession:", callSession)
  console.log(">>> [VoiceCall] Will render CallBox:", callBoxOpen)
  console.log(">>> [VoiceCall] CallBox isIncoming:", !!incomingCallSession)
  console.log(">>> [VoiceCall] ======================================")

  return (
    <div className="relative flex gap-2">
      {/* **VIDEO: Nút Voice Call** */}
      <CustomTooltip title="Voice call" placement="bottom" align="end">
        <div
          className={`${
            canSend === false ? "pointer-events-none cursor-not-allowed" : ""
          } w-fit ${!!incomingCallSession ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <IconButton
            onClick={handleVoiceCall}
            className="flex justify-center items-center text-regular-icon-cl w-[40px] h-[40px]"
          >
            <Phone />
          </IconButton>
        </div>
      </CustomTooltip>

      {/* <CustomTooltip title="Video call" placement="bottom" align="end">
        <div
          className={`${canSend === false ? "pointer-events-none cursor-not-allowed" : ""
            } w-fit ${!!incomingCallSession ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <IconButton
            onClick={handleVideoCall}
            className="flex justify-center items-center text-regular-icon-cl w-[40px] h-[40px]"
          >
            <Video />
          </IconButton>
        </div>
      </CustomTooltip> */}

      {callBoxOpen && (
        <CallBox
          open={callBoxOpen}
          directChat={directChat}
          isIncoming={!!incomingCallSession}
          onClose={handleCallBoxClose}
          callSession={callSession}
        />
      )}
    </div>
  )
}
