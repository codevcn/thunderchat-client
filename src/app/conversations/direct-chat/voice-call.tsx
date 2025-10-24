import { CustomTooltip } from "@/components/materials/tooltip"
import { IconButton } from "@/components/materials/icon-button"
import {
  Phone,
  X,
  Maximize2,
  MicOff,
  Video,
  ScreenShare,
  PhoneOff,
  User,
  BellRing,
} from "lucide-react"
import { useVoiceCall } from "@/hooks/voice-call"
import { useUser } from "@/hooks/user"
import { useEffect, useMemo, useRef, useState } from "react"
import type { TDirectChat, TUserWithProfile } from "@/utils/types/be-api"
import { EVoiceCallStatus } from "@/utils/enums"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { toaster } from "@/utils/toaster"
import { emitLog, sortEmitLogs } from "@/utils/helpers"
import type { TEmitLogMessage } from "@/utils/types/global"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import IncomingCallModal from "@/components/voice-call/in-coming-call-modal"
import {
  resetCallSession,
  resetIncomingCallSession,
  setCallSession,
  setIncomingCallSession,
  updateCallSession,
  updateIncomingCallSession,
} from "@/redux/voice-call/layout.slice"
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
    startCall,
    hangupCall,
    acceptCall,
    rejectCall,
    getRemoteStream,
    getP2pConnection,
    getLocalStream,
    toggleMic,
  } = useVoiceCall() // Hook 3
  const [callState, setCallState] = useState<EVoiceCallStatus>()
  const [logs, setLogs] = useState<TEmitLogMessage[]>([])
  const [calleeName, setCalleeName] = useState<string>("callee")
  const [callerName, setCallerName] = useState<string>("caller")
  const [calleeAvatar, setCalleeAvatar] = useState<string>("/images/user/default-avatar-white.webp")
  const [showIncomingModal, setShowIncomingModal] = useState(false)
  const remoteAudioEleRef = useRef<HTMLAudioElement>(null!)
  const incomingCallSession = useAppSelector((state) => state["voice-call"]?.incomingCallSession)
  const [peerRejected, setPeerRejected] = useState(false)

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
    return () => {
      cleanupVideo()
    }
  }, [cleanupVideo])

  const voiceCallHandler = () => {
    if (!callSession) {
      setCallState(EVoiceCallStatus.RINGING)
    }
  }

  const handleAcceptFromModal = () => {
    acceptCall()
    setShowIncomingModal(false)
    setCallState(EVoiceCallStatus.CONNECTED)
    //  dispatch(updateIncomingCallSession({ status: EVoiceCallStatus.CONNECTED }));
    console.log(">>> [handleAcceptModal] Starting reject - current:", callState, callSession)
  }

  const handleRejectFromModal = () => {
    rejectCall()
    setShowIncomingModal(false)
    setCallState(EVoiceCallStatus.REJECTED)
    eventEmitter.emit(EInternalEvents.CALL_REJECTED, directChatId)
    onClose()
    console.log(">>> [handleRejectFromModal] end reject")
  }

  const handleEndCall = () => {
    console.log("check handle end call")
    hangupCall()
    setShowIncomingModal(false)
    setCallState(EVoiceCallStatus.ENDED)
    onClose()
  }

  const handlePeerCancelled = (data: { directChatId?: number }) => {
    if (!data.directChatId || data.directChatId === directChatId) {
      rejectCall()
      setCallState(EVoiceCallStatus.CANCELLED)
      onClose()
      dispatch(updateCallSession({ status: EVoiceCallStatus.CANCELLED }))
      dispatch(updateIncomingCallSession({ status: EVoiceCallStatus.CANCELLED }))
      dispatch(resetCallSession())
      dispatch(resetIncomingCallSession())
      cleanupVideo()
      setTimeout(() => onClose(), 300)
    }
  }
  const handlePeerRejected = (data: { directChatId?: number }) => {
    if (!data.directChatId || data.directChatId === directChatId) {
      emitLog(`Peer rejected call for chat ${directChatId}. Closing UI.`)
      dispatch(resetCallSession())
      dispatch(resetIncomingCallSession())
      setPeerRejected(true)
      setCallState(EVoiceCallStatus.REJECTED)
      cleanupVideo()
      onClose()
    }
  }

  const listenCallRejected = (chatId: number) => {
    if (chatId === directChatId) {
      emitLog(`Call Rejected/Cancelled for chat ${chatId}. Closing modal.`)

      setCallState(EVoiceCallStatus.REJECTED)

      cleanupVideo()
      onClose()
    }
  }
  const handleCloseModal = () => {
    handleRejectFromModal()
  }

  const listenCallRequestReceived = () => {
    dispatch(updateIncomingCallSession({ status: EVoiceCallStatus.RINGING }))
    setCallState(EVoiceCallStatus.RINGING)
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
    const fetchCallee = async () => {
      if (incomingCallSession && isIncoming) {
        try {
          // Tính toán calleeUserId
          const currentUserId = user?.id
          if (!currentUserId) {
            console.error(">>> [CallBox] Error: Current user ID not found")
            setCalleeName("Call")
            return
          }

          const calleeUserId =
            directChat.creatorId === currentUserId ? directChat.recipientId : directChat.creatorId

          // Gọi API để lấy thông tin callee
          const callee = await userService.getUserById(calleeUserId)
          console.log(">>>>callee", callee)
          setCalleeName(callee.Profile?.fullName || "Call") // Sử dụng thông tin từ callee
          setCalleeAvatar(callee.Profile.avatar || "/images/user/default-avatar-white.webp")
        } catch (error) {
          console.error(">>> [CallBox] Failed to fetch callee user:", error)
          setCalleeName("Call") // Fallback nếu lỗi
          toaster.error("Failed to load callee information")
        }
      } else {
        try {
          const caller = await userService.getUserById(calleeUserId)

          setCallerName(caller.Profile?.fullName || "Call") // Sử dụng thông tin từ callee
          //   setCalleeAvatar(callee.Profile.avatar || "/images/user/default-avatar-white.webp")
        } catch (error) {
          console.error(">>> [CallBox] Failed to fetch callee user:", error)
          setCalleeName("Call") // Fallback nếu lỗi
          toaster.error("Failed to load callee information")
        }
      }
    }

    fetchCallee()
  }, [incomingCallSession, isIncoming, directChat, user]) // Thêm directChat và user vào dependency array

  useEffect(() => {
    if (isIncoming && open) {
      console.log(">>> [CallBox] Set RINGING cho incoming")
      // setCallState(EVoiceCallStatus.RINGING);
      dispatch(updateIncomingCallSession({ status: EVoiceCallStatus.RINGING }))
      setShowIncomingModal(true)
    } else if (open) {
      voiceCallHandler()
    }
  }, [open, isIncoming])

  useEffect(() => {
    emitLog("Registering for call request received")
    eventEmitter.on(EInternalEvents.INIT_REMOTE_STREAM, listenInitRemoteStream)
    eventEmitter.on(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED, listenCallRequestReceived)
    eventEmitter.on(EInternalEvents.CALL_REJECTED, listenCallRejected)
    eventEmitter.on(EInternalEvents.CALL_CANCELLED_BY_PEER, handlePeerCancelled)
    eventEmitter.on(EInternalEvents.CALL_REJECTED_BY_PEER, handlePeerRejected)
    eventEmitter.on(EInternalEvents.EMIT_LOG, (messages) => {
      setLogs((prev) => [...messages, ...prev])
    })
    return () => {
      emitLog("Un-registering for call request received")
      eventEmitter.off(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED, listenCallRequestReceived)
      eventEmitter.off(EInternalEvents.INIT_REMOTE_STREAM, listenInitRemoteStream)
      eventEmitter.off(EInternalEvents.CALL_REJECTED, listenCallRejected)
      eventEmitter.off(EInternalEvents.CALL_CANCELLED_BY_PEER, handlePeerCancelled)
      eventEmitter.off(EInternalEvents.CALL_REJECTED_BY_PEER, handlePeerRejected)
      eventEmitter.off(EInternalEvents.EMIT_LOG)
    }
  }, [directChatId, onClose, cleanupVideo]) // Hook 12

  return (
    <div className="mt-6">
      {/* <button className="p-2 bg-pink-600 w-fit" onClick={() => hangupCall()}>
        end call
      </button> */}
      {(callState === EVoiceCallStatus.CONNECTED || callState === EVoiceCallStatus.RINGING) && (
        <HolderUI
          onClose={handleEndCall}
          calleeName={callerName}
          callState={callState}
          remoteAudioEleRef={remoteAudioEleRef}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          toggleVideo={toggleVideo}
          isVideoEnabled={isVideoEnabled}
          toggleMic={toggleMic}
        />
      )}
      <IncomingCallModal
        open={showIncomingModal}
        callerName={calleeName}
        callerAvatar={calleeAvatar}
        onAccept={handleAcceptFromModal}
        onReject={handleRejectFromModal}
      />

      <audio ref={remoteAudioEleRef} autoPlay playsInline />
    </div>
  )
}
type TVoiceCallProps = {
  canSend: boolean
  directChat: TDirectChat
}
export const VoiceCall = ({ canSend, directChat }: TVoiceCallProps) => {
  const [callBoxOpen, setCallBoxOpen] = useState<boolean>(false)
  const incomingCallSession = useAppSelector((state) => state["voice-call"]?.incomingCallSession)
  const callSession = useAppSelector((state) => state["voice-call"].callSession)
  const dispatch = useAppDispatch()
  const { startCall, cleanup } = useVoiceCall()
  const user = useUser()!

  useEffect(() => {
    if (callSession?.status === EVoiceCallStatus.REJECTED) {
      setCallBoxOpen(false)
    }
  }, [callSession?.status])
  useEffect(() => {
    const handleIncoming = () => {
      console.log(">>> [VoiceCall] Nhận event incoming")
      setCallBoxOpen(true)
    }
    eventEmitter.on(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED, handleIncoming)

    return () => {
      eventEmitter.off(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED, handleIncoming)
    }
  }, [])

  useEffect(() => {
    if (incomingCallSession) {
      setCallBoxOpen(true)
    }
  }, [incomingCallSession])

  useEffect(() => {
    if (
      callSession?.status === EVoiceCallStatus.REJECTED ||
      callSession?.status === EVoiceCallStatus.ENDED ||
      callSession?.status === EVoiceCallStatus.CANCELLED ||
      incomingCallSession?.status === EVoiceCallStatus.CANCELLED ||
      incomingCallSession?.status === EVoiceCallStatus.ENDED
    ) {
      setCallBoxOpen(false)
    }
  }, [callSession?.status, incomingCallSession?.status])
  const handleClick = () => {
    if (!incomingCallSession) {
      setCallBoxOpen(true)
      const currentUserId = user?.id // Lấy ID user hiện tại
      if (!currentUserId) {
        console.error(">>> [VoiceCall] Error: Current user ID not found")
        toaster.error("Cannot start call: User not authenticated")
        setCallBoxOpen(false)
        return
      }

      // Xác định calleeUserId
      const calleeUserId =
        directChat.creatorId === currentUserId ? directChat.recipientId : directChat.creatorId

      // Debug chi tiết
      console.log(">>> [VoiceCall] Starting call", {
        currentUserId,
        calleeUserId,
        directChatId: directChat.id,
        directChat: { creatorId: directChat.creatorId, recipientId: directChat.recipientId },
      })

      // Kiểm tra không tự gọi chính mình
      if (calleeUserId === currentUserId) {
        console.error(">>> [VoiceCall] Error: Cannot call yourself", {
          currentUserId,
          calleeUserId,
        })
        toaster.error("Cannot call yourself")
        setCallBoxOpen(false)
        return
      }

      startCall(calleeUserId, directChat.id, (res: TCallRequestEmitRes) => {
        console.log(">>> [VoiceCall] Call request response:", res)
        if (res.session) {
          dispatch(setCallSession(res.session))
        }
      }).catch((error) => {
        console.error(">>> [VoiceCall] Failed to start call:", error)
        toaster.error(`Failed to start call: ${error.message}`)
        setCallBoxOpen(false)
      })
    }
  }
  const handleCallBoxClose = () => setCallBoxOpen(false)
  return (
    <div className="relative">
      <CustomTooltip title="Call" placement="bottom" align="end">
        <div
          className={`${canSend === false ? "pointer-events-none cursor-not-allowed" : ""} w-fit ${!!incomingCallSession ? "opacity-50 cursor-not-allowed" : ""}`} // Thêm class disabled thay vì prop
        >
          <IconButton
            onClick={handleClick}
            className="flex justify-center items-center text-regular-icon-cl w-[40px] h-[40px]"
          >
            <Phone />
          </IconButton>
        </div>
      </CustomTooltip>
      {callBoxOpen && (
        <CallBox
          open={callBoxOpen}
          directChat={directChat}
          isIncoming={!!incomingCallSession}
          onClose={handleCallBoxClose}
          callSession={callSession}
        />
      )}{" "}
    </div>
  )
}
