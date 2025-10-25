"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import IncomingCallModal from "@/components/voice-call/in-coming-call-modal"
import { useVoiceCall } from "@/hooks/voice-call"
import { userService } from "@/services/user.service"
import { EVoiceCallStatus } from "@/utils/enums"
import { resetIncomingCallSession, setCallSession } from "@/redux/call/layout.slice"
import { useRouter } from "next/navigation"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { useUser } from "@/hooks/user"

export const GlobalIncomingCallModal = () => {
  const user = useUser()
  const incomingCallSession = useAppSelector((state) => state["voice-call"]?.incomingCallSession)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { acceptCall, rejectCall } = useVoiceCall()

  const [callerName, setCallerName] = useState<string>("Unknown")
  const [callerAvatar, setCallerAvatar] = useState<string>("/images/user/default-avatar-white.webp")
  const [showModal, setShowModal] = useState(false)

  // Log khi component mount
  useEffect(() => {
    console.log("🔔 [GlobalIncomingCallModal] Component mounted")
    console.log("🔔 [GlobalIncomingCallModal] Current user:", user?.id)

    return () => {
      console.log("🔔 [GlobalIncomingCallModal] Component unmounted")
    }
  }, [])

  // Lắng nghe incoming call từ Redux
  useEffect(() => {
    console.log("🔔 [GlobalIncomingCallModal] incomingCallSession changed:", incomingCallSession)

    if (!user) {
      console.log("🔔 [GlobalIncomingCallModal] No user authenticated, skipping")
      return
    }

    if (incomingCallSession?.status === EVoiceCallStatus.RINGING) {
      console.log(
        "🔔 [GlobalIncomingCallModal] Incoming call detected! Session:",
        incomingCallSession
      )

      // Fetch thông tin người gọi
      userService
        .getUserById(incomingCallSession.callerUserId)
        .then((callerUser) => {
          console.log(
            "🔔 [GlobalIncomingCallModal] Caller info loaded:",
            callerUser.Profile?.fullName
          )
          setCallerName(callerUser.Profile?.fullName || "Unknown")
          setCallerAvatar(callerUser.Profile?.avatar || "/images/user/default-avatar-white.webp")
          setShowModal(true)
        })
        .catch((error) => {
          console.error("🔔 [GlobalIncomingCallModal] Failed to fetch caller info:", error)
          setCallerName("Unknown")
          setShowModal(true)
        })
    } else {
      setShowModal(false)
    }
  }, [incomingCallSession, user])

  // Handler: Accept call
  const handleAccept = () => {
    console.log("🔔 [GlobalIncomingCallModal] User accepted call")

    if (!incomingCallSession) {
      console.error("🔔 [GlobalIncomingCallModal] No session to accept!")
      return
    }

    // Accept call
    acceptCall()

    // Navigate đến chat
    router.push(`/conversations?cid=${incomingCallSession.directChatId}`)

    // Close modal
    setShowModal(false)

    // Update Redux
    dispatch(setCallSession(incomingCallSession))
    dispatch(resetIncomingCallSession())
  }

  // Handler: Reject call
  const handleReject = () => {
    console.log("🔔 [GlobalIncomingCallModal] User rejected call")

    rejectCall()
    setShowModal(false)
    dispatch(resetIncomingCallSession())

    if (incomingCallSession) {
      eventEmitter.emit(EInternalEvents.CALL_REJECTED, incomingCallSession.directChatId)
    }
  }

  // Lắng nghe cancel từ peer
  useEffect(() => {
    const handlePeerCancelled = (data: { directChatId?: number }) => {
      if (
        incomingCallSession &&
        (!data.directChatId || data.directChatId === incomingCallSession.directChatId)
      ) {
        console.log("🔔 [GlobalIncomingCallModal] Call cancelled by peer")
        setShowModal(false)
        dispatch(resetIncomingCallSession())
      }
    }

    eventEmitter.on(EInternalEvents.CALL_CANCELLED_BY_PEER, handlePeerCancelled)

    return () => {
      eventEmitter.off(EInternalEvents.CALL_CANCELLED_BY_PEER, handlePeerCancelled)
    }
  }, [incomingCallSession, dispatch])

  // Không render gì nếu không có user hoặc không show modal
  if (!user || !showModal || !incomingCallSession) {
    return null
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div style={{ zIndex: 999999 }}>
        <IncomingCallModal
          open={true}
          callerName={callerName}
          callerAvatar={callerAvatar}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      </div>
    </div>
  )
}
