"use client"

import { useEffect, useRef } from "react" // Xóa useState pulse
import { Phone, PhoneOff, User, Video } from "lucide-react"
import { createPortal } from "react-dom"
interface IncomingCallModalProps {
  open: boolean
  callerName: string
  callerAvatar?: string
  onAccept?: () => void
  onReject?: () => void
}

const IncomingCallModal = ({
  open,
  callerName = "Unknown Caller",
  callerAvatar,
  onAccept,
  onReject,
}: IncomingCallModalProps) => {
  const handleAccept = () => {
    onAccept?.()
  }
  const ringtoneRef = useRef<HTMLAudioElement>(null)
  useEffect(() => {
    const audio = ringtoneRef.current

    if (!audio) return

    if (open) {
      audio.load()

      audio.play().catch((err) => {
        console.warn("Ringtone play blocked by browser:", err)
      })
    } else {
      audio.pause()
      audio.currentTime = 0
    }

    return () => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    }
  }, [open])

  const handleReject = () => {
    onReject?.()
  }

  if (!open) return null

  if (typeof document === "undefined") return null
  const portalRoot = document.body

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* <audio ref={ringtoneRef} src="/sounds/ringtone.mp3" loop style={{ display: 'none' }} /> */}
      <div className="modal-container bg-white dark:bg-[#242526] rounded-lg shadow-2xl w-[70vw] mx-auto min-h-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-[#0084ff] px-5 py-4 flex items-center gap-3 box-content shrink-0">
          <div className="relative animate-pulse-scale">
            {callerAvatar ? (
              <img
                src={callerAvatar}
                alt={callerName}
                className="w-12 h-12 rounded-full border-2 border-white object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping"></div>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-base">{callerName}</h3>
            <p className="text-white/90 text-sm">Calling...</p>
          </div>
        </div>

        <div className="flex-1 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#18191a] dark:to-[#242526] py-32 flex justify-center items-center box-content min-h-0 overflow-hidden">
          <div className="relative animate-pulse-scale">
            {callerAvatar ? (
              <img
                src={callerAvatar}
                alt={callerName}
                className="w-48 h-48 rounded-full border-4 border-[#0084ff]/30 shadow-xl object-cover"
              />
            ) : (
              <div className="w-48 h-48 rounded-full bg-gray-200 dark:bg-gray-700 border-4 border-[#0084ff]/30 flex items-center justify-center shadow-xl">
                <User className="w-24 h-24 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#242526] px-8 py-8 flex justify-center items-center gap-6 box-content shrink-0">
          <button
            onClick={handleReject}
            className="group flex flex-col items-center gap-2 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-105">
              <PhoneOff className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Decline</span>
          </button>

          <button
            onClick={handleAccept}
            className="group flex flex-col items-center gap-2 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-105 animate-pulse">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Answer</span>
          </button>

          <button
            onClick={handleAccept}
            className="group flex flex-col items-center gap-2 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-[#0084ff] hover:bg-[#0073e6] flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-105">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Video</span>
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, portalRoot)
}

export default IncomingCallModal
