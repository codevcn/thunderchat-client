"use client"

import { useAgoraCall } from "@/hooks/voice-call"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useEffect, useState } from "react"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import type { TDirectChat, TGroupChat } from "@/utils/types/be-api"
import { directChatService } from "@/services/direct-chat.service"
import { groupChatService } from "@/services/group-chat.service"
import { useUser } from "@/hooks/user"
import { toaster } from "@/utils/toaster"
import { CallBox } from "@/app/conversations/direct-chat/call"

type TCallContext = {
  directChat?: TDirectChat
  groupChat?: TGroupChat
}

export const GlobalCallManager = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch()
  const user = useUser()

  const [isCallUiOpen, setIsCallUiOpen] = useState(false)
  const [callContext, setCallContext] = useState<TCallContext | null>(null)

  const [isOutgoingCall, setIsOutgoingCall] = useState(false)

  const incomingCallSession = useAppSelector((state) => state["voice-call"]?.incomingCallSession)
  const callSession = useAppSelector((state) => state["voice-call"].callSession)

  const {
    startPeerCall,
    startGroupCall,
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
  } = useAgoraCall()

  useEffect(() => {
    console.log(">>> GlobalCallManager STATE:", {
      isCallUiOpen,
      hasCallContext: !!callContext,
      hasCallSession: !!callSession,
      hasIncomingSession: !!incomingCallSession,
      isOutgoingCall,
      remoteUsersCount: remoteUsers.length,
    })
  }, [isCallUiOpen, callContext, callSession, incomingCallSession, isOutgoingCall, remoteUsers])

  useEffect(() => {
    const fetchChatData = async () => {
      if (!incomingCallSession) {
        // Only close UI if there's no active call session AND not outgoing call
        if (!isOutgoingCall && !callSession) {
          setIsCallUiOpen(false)
          setCallContext(null)
        }
        return
      }

      try {
        setIsCallUiOpen(true)
        setIsOutgoingCall(false)
        const { directChatId, isVideoCall, isGroupCall } = incomingCallSession

        if (isGroupCall) {
          const groupChatData = await groupChatService.fetchGroupChat(directChatId)
          setCallContext({ groupChat: groupChatData })
        } else {
          const directChat = await directChatService.fetchDirectChat(directChatId)
          console.log("direct chat", directChat)
          setCallContext({ directChat })
        }
      } catch (error) {
        console.error(">>> Failed to fetch chat info:", error)
        toaster.error("Failed to load call info.")
        setIsCallUiOpen(false)
        setCallContext(null)
        setIsOutgoingCall(false)
      }
    }

    fetchChatData()
  }, [incomingCallSession, isOutgoingCall])

  useEffect(() => {
    const handleStartOutgoingCall = async ({
      directChat,
      groupChat,
      isVideo,
    }: {
      directChat?: TDirectChat
      groupChat?: TGroupChat
      isVideo: boolean
    }) => {
      console.log(">>> GlobalCallManager: START_OUTGOING_CALL received", {
        directChat,
        groupChat,
        isVideo,
      })

      if (incomingCallSession) return toaster.error("You have an incoming call!")
      if (callSession) return toaster.error("You are already in a call!")
      if (!user) return toaster.error("User not authenticated")

      setIsOutgoingCall(true)
      setCallContext({ directChat, groupChat })
      setIsCallUiOpen(true)

      const handleCallStarted = (res: any) => {
        console.log(">>> Outgoing call started successfully:", res)
      }

      const handleCallError = (error: Error) => {
        console.error(">>> Outgoing call failed:", error)
        toaster.error(`Call failed: ${error.message}`)
        setIsCallUiOpen(false)
        setCallContext(null)
        setIsOutgoingCall(false) // ⭐ Reset flag
      }

      try {
        if (groupChat) {
          const memberIds =
            groupChat.Members?.map((m) => m.userId).filter((id) => id !== user.id) ?? []
          if (memberIds.length === 0) {
            toaster.error("No members to call.")
            setIsCallUiOpen(false)
            setCallContext(null)
            setIsOutgoingCall(false)
            return
          }
          await startGroupCall(groupChat.id, memberIds, handleCallStarted, isVideo)
        } else if (directChat) {
          const calleeId =
            directChat.creatorId === user.id ? directChat.recipientId : directChat.creatorId
          await startPeerCall(calleeId, directChat.id, handleCallStarted, isVideo)
        }
      } catch (error) {
        handleCallError(error as Error)
      }
    }

    const handleMakeDirectCall = async ({
      directChatId,
      isVideo,
      contactName,
    }: {
      directChatId: number
      isVideo: boolean
      contactName: string
    }) => {
      console.log(">>> GlobalCallManager: MAKE_DIRECT_CALL received", {
        directChatId,
        isVideo,
        contactName,
      })

      try {
        const directChat = await directChatService.fetchDirectChat(directChatId)
        eventEmitter.emit(EInternalEvents.START_OUTGOING_CALL, {
          directChat,
          isVideo,
        })
      } catch (error) {
        console.error(">>> Failed to fetch direct chat:", error)
        toaster.error(`Không thể gọi cho ${contactName}`)
      }
    }

    const handleMakeGroupCall = async ({
      groupId,
      isVideo,
    }: {
      groupId: number
      isVideo: boolean
    }) => {
      console.log(">>> GlobalCallManager: MAKE_GROUP_CALL received", { groupId, isVideo })

      try {
        const groupChat = await groupChatService.fetchGroupChat(groupId)
        eventEmitter.emit(EInternalEvents.START_OUTGOING_CALL, {
          groupChat,
          isVideo,
        })
      } catch (error) {
        console.error(">>> Failed to fetch group chat:", error)
        toaster.error("Không thể gọi nhóm")
      }
    }

    eventEmitter.on(EInternalEvents.START_OUTGOING_CALL, handleStartOutgoingCall)
    eventEmitter.on(EInternalEvents.MAKE_DIRECT_CALL, handleMakeDirectCall)
    eventEmitter.on(EInternalEvents.MAKE_GROUP_CALL, handleMakeGroupCall)

    return () => {
      eventEmitter.off(EInternalEvents.START_OUTGOING_CALL, handleStartOutgoingCall)
      eventEmitter.off(EInternalEvents.MAKE_DIRECT_CALL, handleMakeDirectCall)
      eventEmitter.off(EInternalEvents.MAKE_GROUP_CALL, handleMakeGroupCall)
    }
  }, [user, incomingCallSession, callSession, startGroupCall, startPeerCall])

  useEffect(() => {
    if (!callSession && !incomingCallSession && !isOutgoingCall && isCallUiOpen) {
      console.log(">>> No active call, closing UI")
      setIsCallUiOpen(false)
      setCallContext(null)
    }
  }, [callSession, incomingCallSession, isOutgoingCall, isCallUiOpen])

  useEffect(() => {
    const handleVoiceAcceptCall = async () => {
      console.log("📞 VOICE_ACCEPT_CALL_COMMAND received - calling acceptCall()")
      try {
        await acceptCall()
        console.log("✅ Voice accept call successful")
      } catch (error) {
        console.error("❌ Voice accept call failed:", error)
        toaster.error("Failed to accept call via voice")
      }
    }

    const handleVoiceRejectCall = async () => {
      console.log("📞 VOICE_REJECT_CALL_COMMAND received - calling rejectCall()")
      try {
        await rejectCall()
        console.log("✅ Voice reject call successful")
      } catch (error) {
        console.error("❌ Voice reject call failed:", error)
        toaster.error("Failed to reject call via voice")
      }
    }

    eventEmitter.on(EInternalEvents.VOICE_ACCEPT_CALL_COMMAND, handleVoiceAcceptCall)
    eventEmitter.on(EInternalEvents.VOICE_REJECT_CALL_COMMAND, handleVoiceRejectCall)

    return () => {
      eventEmitter.off(EInternalEvents.VOICE_ACCEPT_CALL_COMMAND, handleVoiceAcceptCall)
      eventEmitter.off(EInternalEvents.VOICE_REJECT_CALL_COMMAND, handleVoiceRejectCall)
    }
  }, [acceptCall, rejectCall])

  useEffect(() => {
    const handlePeerAccepted = (data: { directChatId?: number | string }) => {
      if (callContext?.directChat?.id != null && callContext.directChat.id === data.directChatId) {
        console.log(">>> Peer accepted call")
      }
    }

    const handlePeerRejected = (data: { directChatId?: number | string }) => {
      if (
        callContext?.directChat?.id != null &&
        (data.directChatId == null || callContext.directChat.id === data.directChatId)
      ) {
        console.log(">>> Peer rejected call")
        setIsCallUiOpen(false)
        setCallContext(null)
        setIsOutgoingCall(false)
      }
    }

    const handlePeerCancelled = (data: { directChatId?: number | string }) => {
      if (
        callContext?.directChat?.id != null &&
        (data.directChatId == null || callContext.directChat.id === data.directChatId)
      ) {
        console.log(">>> Peer cancelled call")
        setIsCallUiOpen(false)
        setCallContext(null)
        setIsOutgoingCall(false)
      }
    }

    const handleUserJoined = (data: { userId: number; chatId: string | number }) => {
      if (
        callContext?.groupChat?.id != null &&
        String(callContext.groupChat.id) === String(data.chatId)
      ) {
        console.log(">>> User joined group call:", data.userId)
      }
    }

    const handleUserLeft = (data: { userId: number; chatId: string | number }) => {
      if (
        callContext?.groupChat?.id != null &&
        String(callContext.groupChat.id) === String(data.chatId)
      ) {
        console.log(">>> User left group call:", data.userId)
      }
    }

    eventEmitter.on(EInternalEvents.CALL_ACCEPTED_BY_PEER, handlePeerAccepted)
    eventEmitter.on(EInternalEvents.CALL_REJECTED_BY_PEER, handlePeerRejected)
    eventEmitter.on(EInternalEvents.CALL_CANCELLED_BY_PEER, handlePeerCancelled)
    eventEmitter.on(EInternalEvents.USER_JOINED_CALL, handleUserJoined)
    eventEmitter.on(EInternalEvents.USER_LEFT_CALL, handleUserLeft)

    return () => {
      eventEmitter.off(EInternalEvents.CALL_ACCEPTED_BY_PEER, handlePeerAccepted)
      eventEmitter.off(EInternalEvents.CALL_REJECTED_BY_PEER, handlePeerRejected)
      eventEmitter.off(EInternalEvents.CALL_CANCELLED_BY_PEER, handlePeerCancelled)
      eventEmitter.off(EInternalEvents.USER_JOINED_CALL, handleUserJoined)
      eventEmitter.off(EInternalEvents.USER_LEFT_CALL, handleUserLeft)
    }
  }, [callContext?.directChat?.id, callContext?.groupChat?.id])

  const handleGlobalClose = () => {
    hangupCall()
    setIsCallUiOpen(false)
    setCallContext(null)
    setIsOutgoingCall(false)
  }

  return (
    <>
      {children}

      {isCallUiOpen && callContext && (
        <CallBox
          open={isCallUiOpen}
          directChat={callContext.directChat}
          groupChat={callContext.groupChat}
          isIncoming={!!incomingCallSession}
          isOutgoing={isOutgoingCall}
          onClose={handleGlobalClose}
          callSession={callSession}
          acceptCall={acceptCall}
          rejectCall={rejectCall}
          hangupCall={hangupCall}
          toggleMic={toggleMic}
          toggleVideo={toggleVideo}
          isVideoEnabled={isVideoEnabled}
          isMicEnabled={isMicEnabled}
          remoteUsers={remoteUsers}
          localVideoTrack={localVideoTrack}
          switchCamera={switchCamera}
        />
      )}
    </>
  )
}

export default GlobalCallManager
