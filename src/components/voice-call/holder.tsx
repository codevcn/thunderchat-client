"use client"
import { useState, useEffect, useRef } from "react"
import { PhoneOff, MicOff, Video, ScreenShare, X, Mic } from "lucide-react"
import type { RefObject } from "react"
import { EVoiceCallStatus } from "@/utils/enums"
import { createPortal } from "react-dom"
import { useAppDispatch } from "@/hooks/redux"
import { updateCallSession, updateIncomingCallSession } from "@/redux/voice-call/layout.slice"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
const emitLog = (message: string) => console.log(message)
// HẾT GIẢ ĐỊNH

type HolderUIProps = {
  onClose: () => void
  calleeName?: string
  callState: EVoiceCallStatus
  remoteAudioEleRef: RefObject<HTMLAudioElement>
  localVideoRef: RefObject<HTMLVideoElement | null>
  remoteVideoRef: RefObject<HTMLVideoElement | null>
  toggleVideo: () => void
  isVideoEnabled: boolean
  toggleMic: () => boolean
}

const HolderUI = ({
  onClose,
  calleeName = "User",
  callState,
  remoteAudioEleRef,

  localVideoRef,
  remoteVideoRef,
  toggleVideo,
  isVideoEnabled,
  toggleMic,
}: HolderUIProps) => {
  const ringtoneRef = useRef<HTMLAudioElement>(null)
  const dispatch = useAppDispatch()
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  useEffect(() => {
    const audio = ringtoneRef.current

    if (!audio) return

    if (callState === EVoiceCallStatus.RINGING) {
      audio.load()
      audio.play().catch((err) => console.warn("Ringtone play blocked:", err))
    } else if (
      callState === EVoiceCallStatus.CONNECTED ||
      callState === EVoiceCallStatus.ENDED ||
      callState === EVoiceCallStatus.REJECTED
    ) {
      audio.pause()
      audio.currentTime = 0
    }
  }, [callState])

  const handleToggleMic = () => {
    const newMicState = toggleMic() // Gọi hàm từ useVoiceCall
    setIsMicEnabled(newMicState) // Cập nhật state
    emitLog(`Toggle mic: Mic is now ${newMicState ? "enabled" : "disabled"}`)
  }
  const handleEndCall = () => {
    emitLog("User1 ended call")
    onClose()
  }

  if (!open) return null

  if (typeof document === "undefined") return null
  const portalRoot = document.body

  const holder = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="modal-container bg-white dark:bg-[#242526] rounded-lg shadow-2xl w-[70vw] mx-auto min-h-[600px] max-h-[90vh] overflow-hidden flex flex-col relative"
        style={{ minWidth: "400px", maxWidth: "800px" }} // Thêm giới hạn kích thước
      >
        {/* <audio ref={ringtoneRef} src="/sounds/ringtone.mp3" loop style={{ display: 'none' }} /> */}
        <audio ref={remoteAudioEleRef} autoPlay playsInline style={{ display: "none" }} />

        <div className="flex-1 relative bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            // Hiển thị video đối phương full container nếu camera đang bật
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isVideoEnabled ? "opacity-100" : "opacity-0"
            }`}
            style={{ display: "block" }} // Luôn giữ thẻ video để dễ dàng attach stream
          />

          {/* Placeholder khi camera đối phương TẮT */}
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-700/80 text-white p-4">
              <span className="text-xl font-medium">{calleeName}</span>
              <span className="text-sm text-white/70">Video is off</span>
            </div>
          )}

          {/* Header/Controls trên video */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent">
            <div className="text-white text-lg font-semibold">
              {calleeName}
              <p className="text-sm font-normal text-white/80">
                {callState === EVoiceCallStatus.CONNECTED ? "In Call" : "Connecting..."}
              </p>
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full w-8 h-8 text-white/90 hover:text-white bg-black/30 hover:bg-black/50 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Local Video - Camera của bạn ở góc dưới bên phải */}
          {isVideoEnabled && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              // Định vị tuyệt đối trong container Video Chính
              className="absolute bottom-4 right-4 w-40 h-28 rounded-lg border-2 border-white/80 shadow-xl object-cover z-10"
            />
          )}
        </div>

        {/* Bottom controls - Đặt bên ngoài container video */}
        <div className="bg-white dark:bg-[#242526] px-8 py-4 flex items-center justify-center gap-6 box-content shrink-0 border-t dark:border-gray-700">
          {/* Toggle Camera */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full inline-flex items-center justify-center transition shadow-md ${
                isVideoEnabled
                  ? "bg-[#0084ff]/90 hover:bg-[#0073e6] text-white"
                  : "bg-gray-200/90 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white"
              }`}
              aria-label={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              <Video className="w-6 h-6" />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {isVideoEnabled ? "Video On" : "Video Off"}
            </span>
          </div>

          {/* Toggle Mic */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleToggleMic}
              className={`w-14 h-14 rounded-full inline-flex items-center justify-center transition shadow-md ${
                isMicEnabled
                  ? "bg-[#0084ff]/90 hover:bg-[#0073e6] text-white"
                  : "bg-gray-200/90 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white"
              }`}
              aria-label={isMicEnabled ? "Mute mic" : "Unmute mic"}
            >
              {isMicEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {isMicEnabled ? "Mic On" : "Mic Off"}
            </span>
          </div>

          {/* Screencast */}
          <div className="flex flex-col items-center gap-2">
            <button
              className="w-14 h-14 rounded-full bg-gray-200/90 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white inline-flex items-center justify-center shadow-md transition"
              aria-label="Screencast"
            >
              <ScreenShare className="w-6 h-6" />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Share</span>
          </div>

          {/* End Call Button (Màu đỏ nổi bật) */}
          <div className="flex flex-col items-center gap-2 ml-4">
            <button
              onClick={handleEndCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white inline-flex items-center justify-center shadow-lg transition duration-200 hover:scale-105"
              aria-label="End call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">End Call</span>
          </div>
        </div>
      </div>
    </div>
  )
  return createPortal(holder, portalRoot)
}

export default HolderUI
