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
  calleeName,
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
  const [isRemoteVideoActive, setIsRemoteVideoActive] = useState(false)
  console.log("calleeName>>", calleeName)
  useEffect(() => {
    const remoteVideo = remoteVideoRef.current
    if (!remoteVideo) return

    const checkRemoteVideo = () => {
      const stream = remoteVideo.srcObject as MediaStream
      if (stream) {
        const videoTracks = stream.getVideoTracks()
        // Kiểm tra track có active và enabled
        const hasActiveVideo = videoTracks.some(
          (track) => track.readyState === "live" && track.enabled
        )
        setIsRemoteVideoActive(hasActiveVideo)
      } else {
        setIsRemoteVideoActive(false)
      }
    }

    checkRemoteVideo()
    const interval = setInterval(checkRemoteVideo, 1000) // Tăng interval

    return () => clearInterval(interval)
  }, [remoteVideoRef])

  useEffect(() => {
    const handleRemoteVideoUpdate = (stream: MediaStream) => {
      console.log(">>> Remote video updated:", stream?.getVideoTracks().length)
      if (remoteVideoRef.current && stream) {
        remoteVideoRef.current.srcObject = stream

        // Check tracks
        const videoTracks = stream.getVideoTracks()
        const hasActiveVideo = videoTracks.some((t) => t.enabled && t.readyState === "live")
        setIsRemoteVideoActive(hasActiveVideo)
      }
    }

    eventEmitter.on(EInternalEvents.REMOTE_VIDEO_UPDATED, handleRemoteVideoUpdate)

    return () => {
      eventEmitter.off(EInternalEvents.REMOTE_VIDEO_UPDATED, handleRemoteVideoUpdate)
    }
  }, [remoteVideoRef])

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
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.6)",
      }}
    >
      <div
        className="modal-container rounded-lg shadow-2xl w-[70vw] mx-auto min-h-[600px] max-h-[90vh] overflow-hidden flex flex-col relative border"
        style={{
          minWidth: "400px",
          maxWidth: "800px",
          backgroundColor: "var(--tdc-regular-modal-board-bgcl)",
          borderColor: "var(--tdc-regular-border-cl)",
        }}
      >
        {/* âm thanh cuộc gọi */}
        <audio ref={remoteAudioEleRef} autoPlay playsInline style={{ display: "none" }} />

        {/* Vùng video chính */}
        <div
          className="flex-1 relative flex items-center justify-center overflow-hidden"
          style={{
            backgroundColor: "var(--tdc-regular-dark-gray-cl)",
          }}
        >
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isRemoteVideoActive ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Placeholder khi video đối phương tắt */}
          {!isRemoteVideoActive && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-white p-4"
              style={{
                backgroundColor: "rgba(0,0,0,0.65)",
              }}
            >
              <span className="text-xl font-medium">{calleeName}</span>
              <span className="text-sm text-white/70">Video is off</span>
            </div>
          )}

          {/* Header */}
          <div
            className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start"
            style={{
              background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
            }}
          >
            <div className="text-white text-lg font-semibold">
              {calleeName}
              <p className="text-sm font-normal text-white/80">
                {callState === EVoiceCallStatus.CONNECTED ? "In Call" : "Connecting..."}
              </p>
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full w-8 h-8 text-white/90 hover:text-white transition"
              style={{
                backgroundColor: "rgba(0,0,0,0.3)",
              }}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Local video */}
          {isVideoEnabled && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-4 right-4 w-40 h-28 rounded-lg border-2 shadow-xl object-cover z-10"
              style={{
                borderColor: "var(--tdc-regular-white-cl)",
              }}
            />
          )}
        </div>

        {/* Footer / Controls */}
        <div
          className="px-8 py-4 flex items-center justify-center gap-6 box-content shrink-0 border-t"
          style={{
            backgroundColor: "var(--tdc-regular-button-bgcl)",
            borderColor: "var(--tdc-regular-divider-cl)",
          }}
        >
          {/* Toggle Video */}
          {/* Toggle Video */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => {
                console.log(">>> Video button clicked, current state:", isVideoEnabled)
                toggleVideo()
              }}
              className={`w-14 h-14 rounded-full inline-flex items-center justify-center transition shadow-md ${
                isVideoEnabled ? "text-white" : "text-gray-300"
              }`}
              style={{
                backgroundColor: isVideoEnabled
                  ? "var(--tdc-gradient-blue-from-cl)"
                  : "var(--tdc-regular-icon-btn-cl)",
              }}
              aria-label={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              <Video className="w-6 h-6" />
            </button>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--tdc-regular-text-secondary-cl)" }}
            >
              {isVideoEnabled ? "Video On" : "Video Off"}
            </span>
          </div>

          {/* Toggle Mic */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleToggleMic}
              className="w-14 h-14 rounded-full inline-flex items-center justify-center transition shadow-md"
              style={{
                backgroundColor: isMicEnabled
                  ? "var(--tdc-gradient-blue-from-cl)"
                  : "var(--tdc-regular-icon-btn-cl)",
                color: isMicEnabled ? "#fff" : "#ccc",
              }}
              aria-label={isMicEnabled ? "Mute mic" : "Unmute mic"}
            >
              {isMicEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--tdc-regular-text-secondary-cl)" }}
            >
              {isMicEnabled ? "Mic On" : "Mic Off"}
            </span>
          </div>

          {/* End Call */}
          <div className="flex flex-col items-center gap-2 ml-4">
            <button
              onClick={handleEndCall}
              className="w-16 h-16 rounded-full inline-flex items-center justify-center shadow-lg transition duration-200 hover:scale-105"
              style={{
                backgroundColor: "var(--tdc-regular-red-cl)",
                color: "#fff",
              }}
              aria-label="End call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--tdc-regular-text-secondary-cl)" }}
            >
              End Call
            </span>
          </div>
        </div>
      </div>
    </div>
  )
  return createPortal(holder, portalRoot)
}

export default HolderUI
