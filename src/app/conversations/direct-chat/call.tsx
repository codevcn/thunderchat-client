"use client"

import { CustomTooltip } from "@/components/materials/tooltip"
import { IconButton } from "@/components/materials/icon-button"
import { Phone, Video, Users } from "lucide-react"

import { useUser } from "@/hooks/user"
import { useEffect, useState } from "react"
import type { TDirectChat, TGroupChat } from "@/utils/types/be-api"
import { EVoiceCallStatus } from "@/utils/enums"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { toaster } from "@/utils/toaster"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import IncomingCallModal from "@/components/voice-call/in-coming-call-modal"
import { setCallSession, updateIncomingCallSession } from "@/redux/call/layout.slice"
import HolderUI from "@/components/voice-call/holder"
import { userService } from "@/services/user.service"
import type { IAgoraRTCRemoteUser, ICameraVideoTrack } from "agora-rtc-sdk-ng"

type TCallBoxProps = {
  open: boolean
  directChat?: TDirectChat
  groupChat?: TGroupChat
  isIncoming?: boolean
  isOutgoing: boolean
  callSession: any
  onClose: () => void

  acceptCall: () => void
  rejectCall: () => void
  hangupCall: () => void
  toggleMic: () => boolean
  toggleVideo: () => Promise<boolean>
  isVideoEnabled: boolean
  isMicEnabled: boolean
  remoteUsers: IAgoraRTCRemoteUser[]
  localVideoTrack: ICameraVideoTrack | null
  switchCamera: () => Promise<void>
}

export const CallBox = ({
  open,
  directChat,
  groupChat,
  isIncoming = false,
  isOutgoing,
  onClose,
  callSession,
  acceptCall,
  rejectCall,
  hangupCall,
  toggleMic,
  toggleVideo,
  isVideoEnabled,
  isMicEnabled,
  remoteUsers,
  localVideoTrack,
  switchCamera,
}: TCallBoxProps) => {
  useEffect(() => {
    console.log(">>> CallBox render:", {
      open,
      isIncoming,
      isOutgoing,
      hasCallSession: !!callSession,
      hasDirectChat: !!directChat,
      hasGroupChat: !!groupChat,
      isVideoEnabled,
      remoteUsersCount: remoteUsers.length,
    })

    isOutgoing = true
  }, [
    open,
    isIncoming,
    isOutgoing,
    callSession,
    directChat,
    groupChat,
    isVideoEnabled,
    remoteUsers,
  ])

  const user = useUser()!
  const dispatch = useAppDispatch()
  const [callState, setCallState] = useState<EVoiceCallStatus | undefined>(() => {
    if (isIncoming) return EVoiceCallStatus.RINGING
    return EVoiceCallStatus.RINGING
  })
  const [calleeName, setCalleeName] = useState<string>("callee")
  const [callerName, setCallerName] = useState<string>("caller")
  const [calleeAvatar, setCalleeAvatar] = useState<string>("/images/user/default-avatar-white.webp")
  const [showIncomingModal, setShowIncomingModal] = useState(false)
  const [displayInfo, setDisplayInfo] = useState<{
    name: string
    avatar?: string
    callType: "DIRECT" | "GROUP"
    initiatorName?: string
  }>({
    name: "Group",
    callType: directChat ? "DIRECT" : "GROUP",
  })
  const incomingCallSession = useAppSelector((state) => state["voice-call"]?.incomingCallSession)

  useEffect(() => {
    return () => {
      setCallState(undefined)
      setShowIncomingModal(false)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setCallState(undefined)
      setShowIncomingModal(false)
    }
  }, [open])

  useEffect(() => {
    if (callSession?.status) {
      setCallState(callSession.status)
      if (callSession.status === EVoiceCallStatus.CONNECTED) {
        setShowIncomingModal(false)
      }
    }
  }, [callSession?.status])

  const handleAcceptFromModal = () => {
    acceptCall()
    setShowIncomingModal(false)
  }

  const handleRejectFromModal = () => {
    rejectCall()
    setShowIncomingModal(false)
    setCallState(EVoiceCallStatus.REJECTED)
    onClose()
  }

  const handleEndCall = () => {
    setShowIncomingModal(false)
    setCallState(EVoiceCallStatus.ENDED)
    onClose()
  }

  const handlePeerCancelled = (data: { directChatId?: number }) => {
    if (!directChat) {
      return toaster.error("Cannot start call: Direct chat not found")
    }
    console.log(">>> Peer cancelled call", data)
    if (!data.directChatId || data.directChatId === directChat.id) {
      setCallState(EVoiceCallStatus.CANCELLED)
      setShowIncomingModal(false)
      onClose()
    }
  }

  const handlePeerRejected = (data: { directChatId?: number }) => {
    if (!directChat) {
      console.log("calltsx126")
      return toaster.error("Cannot start call: Direct chat not found")
    }
    console.log(">>> Peer rejected call", data)
    if (!data.directChatId || data.directChatId === directChat.id) {
      setCallState(EVoiceCallStatus.REJECTED)
      setShowIncomingModal(false)
      onClose()
    }
  }

  const listenCallRequestReceived = () => {
    if (isIncoming) {
      dispatch(updateIncomingCallSession({ status: EVoiceCallStatus.RINGING }))
      setCallState(EVoiceCallStatus.RINGING)
      setShowIncomingModal(true)
    }
  }

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!open || !user) return

      if (isIncoming && incomingCallSession) {
        const { isVideoCall, callerUserId, id } = incomingCallSession
        console.log(">>> Fetching Incoming Group Call info", isVideoCall, groupChat)
        if (groupChat) {
          console.log(">>> Fetching Incoming Group Call info")
          const caller = await userService.getUserById(callerUserId)
          setDisplayInfo({
            name: groupChat.name,
            avatar: groupChat.avatarUrl || undefined,
            callType: "GROUP",
            initiatorName: caller.Profile?.fullName || "TeamFBC",
          })
        } else if (!isVideoCall && directChat) {
          console.log(">>> Fetching Incoming 1-1 Call info")
          const caller = await userService.getUserById(callerUserId)
          setDisplayInfo({
            name: caller.Profile?.fullName || "TeamFBC",
            avatar: caller.Profile?.avatar || undefined,
            callType: "DIRECT",
          })
        }
      } else if (!isIncoming) {
        if (groupChat) {
          setDisplayInfo({
            name: groupChat.name,
            avatar: groupChat.avatarUrl || undefined,
            callType: "GROUP",
          })
        } else if (directChat) {
          const calleeId =
            directChat.creatorId === user.id ? directChat.recipientId : directChat.creatorId
          const callee = await userService.getUserById(calleeId)
          setDisplayInfo({
            name: callee.Profile?.fullName || "TeamFBC",
            avatar: callee.Profile?.avatar || undefined,
            callType: "DIRECT",
          })
        }
      }
    }
    fetchUserInfo().catch(console.error)
  }, [open, isIncoming, incomingCallSession, callSession, directChat, groupChat, user])

  useEffect(() => {
    if (!open) return

    if (isIncoming) {
      setCallState(EVoiceCallStatus.RINGING)
      setShowIncomingModal(true)
    } else if (callSession?.isGroupCall) {
      setCallState(EVoiceCallStatus.RINGING)
      setShowIncomingModal(false)
    } else {
      setCallState(EVoiceCallStatus.RINGING)
      setShowIncomingModal(false)
    }
  }, [open, isIncoming, callSession?.isGroupCall])

  useEffect(() => {
    eventEmitter.on(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED, listenCallRequestReceived)

    if (directChat) {
      eventEmitter.on(EInternalEvents.CALL_CANCELLED_BY_PEER, handlePeerCancelled)
      eventEmitter.on(EInternalEvents.CALL_REJECTED_BY_PEER, handlePeerRejected)
    }
    return () => {
      eventEmitter.off(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED, listenCallRequestReceived)
      if (directChat) {
        eventEmitter.off(EInternalEvents.CALL_CANCELLED_BY_PEER, handlePeerCancelled)
        eventEmitter.off(EInternalEvents.CALL_REJECTED_BY_PEER, handlePeerRejected)
      }
    }
  }, [isIncoming, directChat, onClose])

  const shouldShowIncomingModal =
    isIncoming && callState === EVoiceCallStatus.RINGING && showIncomingModal

  const shouldShowHolder =
    !shouldShowIncomingModal &&
    callState != null &&
    ![EVoiceCallStatus.REJECTED, EVoiceCallStatus.CANCELLED, EVoiceCallStatus.ENDED].includes(
      callState
    )

  console.log("checkstate", shouldShowIncomingModal, callState)
  console.log(">>> Render decision:", {
    callState,
    isIncoming,
    showIncomingModal,
    shouldShowIncomingModal,
    shouldShowHolder,
    callSessionStatus: callSession?.status,
    remoteUsersLength: remoteUsers.length,
  })

  return (
    <div className="mt-6">
      {shouldShowHolder && (
        <HolderUI
          onClose={handleEndCall}
          calleeName={displayInfo.name}
          callState={callState!}
          localVideoTrack={localVideoTrack}
          remoteUsers={remoteUsers}
          toggleVideo={toggleVideo}
          isVideoEnabled={isVideoEnabled}
          toggleMic={toggleMic}
          isMicEnabled={isMicEnabled}
          switchCamera={switchCamera}
        />
      )}

      {shouldShowIncomingModal && (
        <IncomingCallModal
          open={true}
          displayName={displayInfo.name}
          avatarUrl={displayInfo.avatar}
          callType={displayInfo.callType}
          initiatorName={displayInfo.initiatorName}
          onAccept={handleAcceptFromModal}
          onReject={handleRejectFromModal}
          isVideoCall={incomingCallSession?.isVideoCall || false}
        />
      )}
    </div>
  )
}

type TVoiceCallProps = {
  canSend: boolean
  directChat?: TDirectChat
  groupChat?: TGroupChat
}

export const VoiceCall = ({ canSend, directChat, groupChat }: TVoiceCallProps) => {
  const incomingCallSession = useAppSelector((state) => state["voice-call"]?.incomingCallSession)
  const user = useUser()!

  const isGroupChat = !!groupChat

  const handleStartCall = (isVideo: boolean) => {
    if (incomingCallSession) return toaster.error("You have an incoming call!")

    const currentUserId = user?.id
    if (!currentUserId) return toaster.error("Cannot start call: User not authenticated")

    console.log("checkdataaa", directChat, groupChat, isVideo)
    eventEmitter.emit(EInternalEvents.START_OUTGOING_CALL, {
      directChat,
      groupChat,
      isVideo,
    })
  }

  return (
    <div className="relative flex gap-2">
      <CustomTooltip
        title={isGroupChat ? "Group Voice Call" : "Voice call"}
        placement="bottom"
        align="end"
      >
        <div
          className={`${!canSend ? "pointer-events-none cursor-not-allowed" : ""} w-fit ${
            !!incomingCallSession ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <IconButton
            onClick={() => handleStartCall(false)}
            className="flex justify-center items-center text-regular-icon-cl w-[40px] h-[40px]"
          >
            {isGroupChat ? <Users /> : <Phone />}
          </IconButton>
        </div>
      </CustomTooltip>

      <CustomTooltip
        title={isGroupChat ? "Group Video Call" : "Video call"}
        placement="bottom"
        align="end"
      >
        <div
          className={`${!canSend ? "pointer-events-none cursor-not-allowed" : ""} w-fit ${
            !!incomingCallSession ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <IconButton
            onClick={() => handleStartCall(true)}
            className="flex justify-center items-center text-regular-icon-cl w-[40px] h-[40px]"
          >
            <Video />
          </IconButton>
        </div>
      </CustomTooltip>
    </div>
  )
}
