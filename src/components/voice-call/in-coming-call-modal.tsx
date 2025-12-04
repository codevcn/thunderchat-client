"use client"

import { Phone, PhoneOff, User, Video, Users } from "lucide-react"
import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"

interface IncomingCallModalProps {
  open: boolean
  onAccept?: () => void
  onReject?: () => void
  isVideoCall?: boolean

  callType: "DIRECT" | "GROUP"
  displayName: string
  avatarUrl?: string
  initiatorName?: string
}

const IncomingCallModal = ({
  open,
  onAccept,
  onReject,
  isVideoCall = false,
  callType,
  displayName = "TeamFBC",
  avatarUrl,
  initiatorName,
}: IncomingCallModalProps) => {
  const ringtoneRef = useRef<HTMLAudioElement | null>(null)

  const handleAccept = () => {
    if (onAccept) onAccept()
  }

  const handleReject = () => {
    if (onReject) onReject()
  }

  useEffect(() => {
    if (open && ringtoneRef.current) {
      ringtoneRef.current.play().catch((e) => {
        console.error("Ringtone play failed:", e)
      })
    } else if (!open && ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
    }
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
        ringtoneRef.current.currentTime = 0
      }
    }
  }, [open])

  if (!open) return null
  if (typeof document === "undefined") return null
  const portalRoot = document.body

  const callDescription =
    callType === "GROUP"
      ? `Incoming group ${isVideoCall ? "video " : ""}call${initiatorName ? ` from ${initiatorName}` : "..."}`
      : `Incoming ${isVideoCall ? "video " : ""}call...`

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <audio ref={ringtoneRef} src="/sounds/ringtone.mp3" loop style={{ display: "none" }} />

      <div
        className="rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.4)] w-[70vw] max-w-[460px] mx-auto overflow-hidden flex flex-col animate-fade-in"
        style={{
          backgroundColor: "var(--tdc-regular-modal-board-bgcl)",
          color: "var(--tdc-regular-white-cl)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center gap-3 shrink-0"
          style={{
            background: "var(--tdc-user-avt-bgimg)",
            borderBottom: "1px solid var(--tdc-regular-border-cl)",
          }}
        >
          {/* 4. Cập nhật logic Avatar Header */}
          <div className="relative animate-pulse-scale">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-12 h-12 rounded-full border-2 border-white object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center bg-[var(--tdc-regular-hover-bgcl)]">
                {callType === "GROUP" ? (
                  <Users className="w-6 h-6 text-[var(--tdc-regular-white-cl)]" />
                ) : (
                  <User className="w-6 h-6 text-[var(--tdc-regular-white-cl)]" />
                )}
              </div>
            )}
            <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping"></div>
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-base text-[var(--tdc-regular-white-cl)]">
              {displayName}
            </h3>
            <p className="text-sm text-[var(--tdc-regular-text-secondary-cl)]">{callDescription}</p>
          </div>
        </div>

        {/* Body (Avatar lớn) */}
        <div
          className="flex-1 flex justify-center items-center py-20"
          style={{
            background:
              "linear-gradient(to bottom, var(--tdc-regular-dark-gray-cl), var(--tdc-regular-modal-board-bgcl))",
          }}
        >
          <div className="relative animate-pulse-scale">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-44 h-44 rounded-full border-4 shadow-xl object-cover"
                style={{
                  borderColor: "var(--tdc-gradient-blue-from-cl)",
                }}
              />
            ) : (
              <div
                className="w-44 h-44 rounded-full flex items-center justify-center shadow-xl"
                style={{
                  backgroundColor: "var(--tdc-regular-hover-card-cl)",
                  border: "4px solid var(--tdc-gradient-blue-from-cl)",
                }}
              >
                {callType === "GROUP" ? (
                  <Users className="w-20 h-20 text-[var(--tdc-regular-icon-cl)]" />
                ) : (
                  <User className="w-20 h-20 text-[var(--tdc-regular-icon-cl)]" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions (Giữ nguyên) */}
        <div className="px-8 py-6 flex justify-center items-center gap-10 shrink-0">
          {/* Nút Decline */}
          <button
            onClick={handleReject}
            className="group flex flex-col items-center gap-2 focus:outline-none"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105"
              style={{ backgroundColor: "var(--tdc-regular-red-cl)" }}
            >
              <PhoneOff className="w-6 h-6 text-[var(--tdc-regular-white-cl)]" />
            </div>
            <span className="text-sm font-medium text-[var(--tdc-regular-text-secondary-cl)]">
              Decline
            </span>
          </button>

          {/* Nút Answer */}
          <button
            id="voice-accept-call-button"
            onClick={handleAccept}
            className="group flex flex-col items-center gap-2 focus:outline-none"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105 animate-pulse"
              style={{ backgroundColor: "var(--tdc-regular-green-cl)" }}
            >
              {isVideoCall ? (
                <Video className="w-6 h-6 text-[var(--tdc-regular-white-cl)]" />
              ) : (
                <Phone className="w-6 h-6 text-[var(--tdc-regular-white-cl)]" />
              )}
            </div>
            <span className="text-sm font-medium text-[var(--tdc-regular-text-secondary-cl)]">
              Answer
            </span>
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, portalRoot)
}

export default IncomingCallModal
