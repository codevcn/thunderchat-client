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
      setIsVideoEnabled(shouldEnable)

      if (!p2pConnectionRef.current || !localStreamRef.current) {
        toaster.error("Call not established yet")
        return
      }

      const existingVideoTrack = localStreamRef.current.getVideoTracks()[0]

      if (shouldEnable && !existingVideoTrack) {
        // Thêm track mới
        const videoStream = await getVideoStream()
        if (!videoStream) return

        const newVideoTrack = videoStream.getVideoTracks()[0]
        localStreamRef.current.addTrack(newVideoTrack)

        // Thay thế hoặc add sender trong PC
        const sender = p2pConnectionRef.current.getSenders().find((s) => s.track?.kind === "video")
        if (sender) {
          await sender.replaceTrack(newVideoTrack)
          emitLog("Replaced video track in RTC sender")
        } else {
          p2pConnectionRef.current.addTrack(newVideoTrack, localStreamRef.current)
          emitLog("Added new video track to RTC")
        }

        // Gắn local video UI - FIX: Check null
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current
        }
      } else if (!shouldEnable && existingVideoTrack) {
        // Disable hoặc remove track
        existingVideoTrack.enabled = false
        existingVideoTrack.stop() // Stop để tiết kiệm tài nguyên
        localStreamRef.current.removeTrack(existingVideoTrack)

        // Remove từ PC
        const sender = p2pConnectionRef.current.getSenders().find((s) => s.track?.kind === "video")
        if (sender) {
          await sender.replaceTrack(null)
          emitLog("Removed video track from RTC sender")
        }

        // Clear local video UI - FIX: Check null
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null
        }
      }

      eventEmitter.emit(EInternalEvents.VIDEO_TOGGLED, shouldEnable)
      emitLog(`Video toggled: ${shouldEnable ? "enabled" : "disabled"}`)
    },
    [isVideoEnabled]
  )

  // Cleanup video tracks
  const cleanupVideo = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.stop()
      localStreamRef.current?.removeTrack(track)
    })
    // FIX: Check null trước khi access
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
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
