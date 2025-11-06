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
        if (!isOutgoingCall) {
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

    eventEmitter.on(EInternalEvents.START_OUTGOING_CALL, handleStartOutgoingCall)

    return () => {
      eventEmitter.off(EInternalEvents.START_OUTGOING_CALL, handleStartOutgoingCall)
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
    const handlePeerAccepted = (data: { directChatId?: number | string }) => {
      if (callContext?.directChat?.id != null && callContext.directChat.id === data.directChatId) {
        console.log(">>> Peer accepted call")
      }
    }

    const handlePeerRejected = (data: { directChatId?: number | string }) => {
      if (callContext?.directChat?.id != null && callContext.directChat.id === data.directChatId) {
        console.log(">>> Peer rejected call")
        setIsCallUiOpen(false)
        setCallContext(null)
        setIsOutgoingCall(false)
      }
    }

    const handlePeerCancelled = (data: { directChatId?: number | string }) => {
      if (callContext?.directChat?.id != null && callContext.directChat.id === data.directChatId) {
        console.log(">>> Peer cancelled call")
        setIsCallUiOpen(false)
        setCallContext(null)
        setIsOutgoingCall(false) // ⭐ Reset flag
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
