import { useRef, useEffect, useState, useCallback } from "react"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events" // Thêm event mới nếu cần: VIDEO_TOGGLED, REMOTE_VIDEO_UPDATED
import { toaster } from "@/utils/toaster"
import { emitLog } from "@/utils/helpers"

// Props để tích hợp với voice hook
interface UseVideoCallProps {
  p2pConnection?: RTCPeerConnection | null // Truyền từ useVoiceCall
  localStream?: MediaStream | null // Truyền từ useVoiceCall để add track
  remoteStream?: MediaStream | null // Để update remote video
  onRemoteStreamUpdate?: (stream: MediaStream) => void // Callback để UI attach
}

export function useVideoCall({
  p2pConnection: externalPc,
  localStream: externalLocalStream,
  remoteStream: externalRemoteStream,
  onRemoteStreamUpdate,
}: UseVideoCallProps = {}) {
  // Internal refs (nếu không truyền external)
  const p2pConnectionRef = useRef<RTCPeerConnection | null>(externalPc || null)
  const localStreamRef = useRef<MediaStream | null>(externalLocalStream || null)
  const remoteStreamRef = useRef<MediaStream | null>(externalRemoteStream || null)

  // Video elements refs (gắn từ UI) - FIX: Thêm | null để tránh type conflict
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)

  // States
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [isCameraAccessGranted, setIsCameraAccessGranted] = useState(true)
  const [videoError, setVideoError] = useState<string | null>(null)

  // Update refs nếu external thay đổi (từ voice hook)
  useEffect(() => {
    p2pConnectionRef.current = externalPc || null
  }, [externalPc])

  useEffect(() => {
    localStreamRef.current = externalLocalStream || null
  }, [externalLocalStream])

  // FIX: Sửa deps từ externalRemoteStream (typo) thành externalRemoteStream (đúng biến)
  useEffect(() => {
    remoteStreamRef.current = externalRemoteStream || null
    if (remoteStreamRef.current && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current
      onRemoteStreamUpdate?.(remoteStreamRef.current)
      eventEmitter.emit(EInternalEvents.REMOTE_VIDEO_UPDATED, remoteStreamRef.current)
    }
  }, [externalRemoteStream, onRemoteStreamUpdate])

  // Hàm lấy video stream
  const getVideoStream = async (): Promise<MediaStream | null> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toaster.error("Camera not supported in this browser")
      setIsCameraAccessGranted(false)
      return null
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user", // Front camera, đổi thành "environment" cho sau
        },
      })
      setIsCameraAccessGranted(true)
      setVideoError(null)
      return stream
    } catch (err: any) {
      console.error("Camera access failed:", err)
      toaster.error("Cannot access camera: " + err.message)
      setVideoError(err.message)
      setIsCameraAccessGranted(false)
      return null
    }
  }

  // Toggle video on/off
  const toggleVideo = useCallback(
    async (enable?: boolean) => {
      const shouldEnable = enable ?? !isVideoEnabled
      const pc = p2pConnectionRef.current
      const localStream = localStreamRef.current

      if (!pc || !localStream) {
        toaster.error("Call not established yet")
        return
      }

      console.log(">>> [toggleVideo] shouldEnable:", shouldEnable)

      if (shouldEnable) {
        // 🔹 BẬT VIDEO
        try {
          let videoTrack = localStream.getVideoTracks()[0]

          // Nếu chưa có hoặc track đã stop
          if (!videoTrack || videoTrack.readyState === "ended") {
            console.log(">>> Getting new video stream...")
            const videoStream = await getVideoStream()
            if (!videoStream) return

            videoTrack = videoStream.getVideoTracks()[0]

            // Xóa track cũ nếu có
            localStream.getVideoTracks().forEach((track) => {
              localStream.removeTrack(track)
            })

            localStream.addTrack(videoTrack)

            // **FIX: Thêm hoặc replace sender**
            const videoSender = pc.getSenders().find((s) => s.track?.kind === "video")
            if (videoSender) {
              await videoSender.replaceTrack(videoTrack)
              console.log("✅ Replaced video track")
            } else {
              pc.addTrack(videoTrack, localStream)
              console.log("✅ Added video track (will trigger negotiation)")
            }
          } else {
            // Track còn tồn tại, chỉ enable
            videoTrack.enabled = true
            console.log("✅ Re-enabled video track")
          }

          // Update UI
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream
          }

          setIsVideoEnabled(true)
          emitLog("🎥 Video enabled")
        } catch (err: any) {
          console.error("❌ Enable video failed:", err)
          toaster.error("Cannot enable camera: " + err.message)
        }
      } else {
        // 🔸 TẮT VIDEO
        console.log(">>> Disabling video...")
        const videoTracks = localStream.getVideoTracks()

        videoTracks.forEach((track) => {
          track.enabled = false
          track.stop() // **QUAN TRỌNG: Stop để release camera**
          localStream.removeTrack(track)
        })

        // **FIX: Remove sender để trigger renegotiation**
        const videoSender = pc.getSenders().find((s) => s.track?.kind === "video")
        if (videoSender) {
          pc.removeTrack(videoSender)
          console.log("✅ Removed video sender (will trigger negotiation)")
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null
        }

        setIsVideoEnabled(false)
        emitLog("📷 Video disabled")
      }

      eventEmitter.emit(EInternalEvents.VIDEO_TOGGLED, shouldEnable)
    },
    [isVideoEnabled]
  )

  // Cleanup video tracks
  const cleanupVideo = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.stop()
    })
    setIsVideoEnabled(false)
  }, [])

  // Listen remote video tracks (nếu PC từ external)
  useEffect(() => {
    if (!p2pConnectionRef.current) return

    const handleTrack = (event: RTCTrackEvent) => {
      if (event.track.kind === "video") {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream()
        }
        remoteStreamRef.current.addTrack(event.track)
        // FIX: Check null
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current
        }
        onRemoteStreamUpdate?.(remoteStreamRef.current)
        eventEmitter.emit(EInternalEvents.REMOTE_VIDEO_UPDATED, remoteStreamRef.current)
        emitLog("Received remote video track")
      }
    }

    p2pConnectionRef.current.addEventListener("track", handleTrack)
    return () => {
      p2pConnectionRef.current?.removeEventListener("track", handleTrack)
    }
  }, [onRemoteStreamUpdate])

  // Auto attach local video nếu enable
  useEffect(() => {
    if (isVideoEnabled && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current
    }
  }, [isVideoEnabled])

  return {
    // States
    isVideoEnabled,
    videoError,
    isCameraAccessGranted,

    // Refs để gắn từ UI - FIX: Cast để tương thích nếu consumer dùng kiểu non-null
    localVideoRef: localVideoRef as React.RefObject<HTMLVideoElement>,
    remoteVideoRef: remoteVideoRef as React.RefObject<HTMLVideoElement>,

    // Actions
    toggleVideo,
    cleanupVideo,

    // Helpers
    getVideoStream, // Nếu cần manual
  }
}
