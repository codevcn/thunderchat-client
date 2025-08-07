"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Trash2,
  Share,
  Download,
  ZoomIn,
  ZoomOut,
  MessageSquare,
} from "lucide-react"
import { toast } from "sonner"
import dayjs from "dayjs"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { TUserWithProfileFE } from "@/utils/types/fe-api"

type MediaItem = {
  id: number
  type: string
  mediaUrl: string
  fileName?: string
  thumbnailUrl?: string | null
  createdAt?: string
  authorId?: number
  mediaType?: string
}

type MediaViewerModalProps = {
  isOpen: boolean
  onClose: () => void
  mediaItems: MediaItem[]
  initialIndex: number
  creator: TUserWithProfileFE
  recipient: TUserWithProfileFE
  // New props to control button visibility
  showUserInfo?: boolean
  showActionButtons?: boolean
  showZoomControls?: boolean
}

const HEADER_HEIGHT = 64 // px
const ZOOM_HEIGHT = 64 // px

const MediaViewerModal = ({
  isOpen,
  onClose,
  mediaItems,
  initialIndex,
  creator,
  recipient,
  showUserInfo = true,
  showActionButtons = true,
  showZoomControls = true,
}: MediaViewerModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [showZoom, setShowZoom] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)
  const videoRef = useRef<HTMLVideoElement>(null)
  const imgContainerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const [isImgLoading, setIsImgLoading] = useState(true)
  const [isVideoLoading, setIsVideoLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setIsVideoPlaying(false)
      setShowZoom(false)
      setZoomLevel(100)
      setIsImgLoading(true)
      setIsVideoLoading(true)
    }
  }, [isOpen, initialIndex])

  useEffect(() => {
    setIsImgLoading(true)
    setIsVideoLoading(true)
  }, [currentIndex])

  const currentMedia = mediaItems[currentIndex]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      switch (e.key) {
        case "Escape":
          onClose()
          break
        case "ArrowLeft":
          goToPrevious()
          break
        case "ArrowRight":
          goToNext()
          break
        case " ":
          if (currentMedia?.mediaType === "VIDEO" || currentMedia?.type === "VIDEO") {
            e.preventDefault()
            toggleVideoPlay()
          }
          break
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, currentMedia])

  const getSenderInfo = () => {
    if (!currentMedia?.authorId) return null
    return currentMedia.authorId === creator.id ? creator : recipient
  }

  const sender = getSenderInfo()

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < mediaItems.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsVideoPlaying(!isVideoPlaying)
    }
  }

  const handleVideoEnded = () => setIsVideoPlaying(false)
  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setZoomLevel(parseInt(e.target.value))

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 300))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 25))

  const handleDownload = async () => {
    if (!currentMedia?.mediaUrl) return
    try {
      const response = await fetch(currentMedia.mediaUrl)
      if (!response.ok) throw new Error("Không thể tải file")
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      const fileNameWithExt = currentMedia.fileName || "media"
      const hasExtension = fileNameWithExt.includes(".")
      const finalFileName = hasExtension
        ? fileNameWithExt
        : `${fileNameWithExt}.${currentMedia.type.toLowerCase()}`
      link.download = finalFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      toast.success("Đã tải xuống thành công")
    } catch (error) {
      toast.error("Lỗi khi tải xuống file")
    }
  }

  // Thêm hàm xem tin nhắn gốc
  const handleViewOriginalMessage = () => {
    if (currentMedia?.id) {
      eventEmitter.emit(EInternalEvents.SCROLL_TO_MESSAGE_MEDIA, currentMedia.id)
      onClose() // Đóng modal sau khi emit event
      toast.success("Đang hiển thị context tin nhắn gốc...")
    }
  }

  // Drag to scroll for zoomed image
  useEffect(() => {
    if (!showZoom || !imgContainerRef.current) return
    const container = imgContainerRef.current
    const onMouseDown = (e: MouseEvent) => {
      dragging.current = true
      lastPos.current = { x: e.clientX, y: e.clientY }
      container.style.cursor = "grabbing"
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      container.scrollLeft -= e.clientX - lastPos.current.x
      container.scrollTop -= e.clientY - lastPos.current.y
      lastPos.current = { x: e.clientX, y: e.clientY }
    }
    const onMouseUp = () => {
      dragging.current = false
      container.style.cursor = "grab"
    }
    container.addEventListener("mousedown", onMouseDown)
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      container.removeEventListener("mousedown", onMouseDown)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
      container.style.cursor = "default"
    }
  }, [showZoom, currentIndex])

  if (!isOpen || !currentMedia) return null

  // Calculate available height for media area
  const headerH = HEADER_HEIGHT
  const zoomH =
    showZoom && (currentMedia.mediaType === "IMAGE" || currentMedia.type === "IMAGE")
      ? ZOOM_HEIGHT
      : 0
  const mediaAreaStyle = {
    top: headerH + zoomH,
    bottom: 0,
    left: 0,
    right: 0,
    position: "absolute" as const,
    overflow: "hidden" as const,
    background: "#111",
    zIndex: 1,
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-black/50 border-b border-gray-700"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: HEADER_HEIGHT,
          zIndex: 10,
        }}
      >
        {showUserInfo ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
              {sender?.Profile.avatar ? (
                <img
                  src={sender.Profile.avatar}
                  alt={sender.Profile.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {sender?.Profile.fullName?.[0] || "U"}
                </span>
              )}
            </div>
            <div>
              <div className="text-white font-medium">{sender?.Profile.fullName || "Unknown"}</div>
              <div className="text-gray-400 text-sm">
                {currentMedia?.createdAt
                  ? dayjs(currentMedia.createdAt).format("MMM D [at] HH:mm")
                  : ""}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-white font-medium"></div>
        )}
        <div className="flex items-center gap-3">
          {showActionButtons && (
            <>
              {/* Nút xem tin nhắn gốc */}
              <button
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                onClick={handleViewOriginalMessage}
                title="Xem tin nhắn gốc"
              >
                <MessageSquare className="w-4 h-4 text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                <Trash2 className="w-4 h-4 text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                <Share className="w-4 h-4 text-gray-400" />
              </button>
              <button
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 text-gray-400" />
              </button>
            </>
          )}
          {showZoomControls && (
            <button
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              onClick={() => setShowZoom(!showZoom)}
            >
              <ZoomIn className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Zoom controls */}
      {showZoom &&
        showZoomControls &&
        (currentMedia.mediaType === "IMAGE" || currentMedia.type === "IMAGE") && (
          <div
            className="flex items-center justify-center gap-4 px-4 py-3 bg-black/50 border-b border-gray-700"
            style={{
              position: "absolute",
              top: HEADER_HEIGHT,
              left: 0,
              right: 0,
              height: ZOOM_HEIGHT,
              zIndex: 10,
            }}
          >
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            >
              <ZoomOut className="w-4 h-4 text-gray-400" />
            </button>
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <input
                type="range"
                min="25"
                max="300"
                value={zoomLevel}
                onChange={handleZoomChange}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-gray-400 text-sm min-w-[3rem]">{zoomLevel}%</span>
            </div>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            >
              <ZoomIn className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}

      {/* Media Content Area */}
      <div style={mediaAreaStyle}>
        {/* Navigation buttons */}
        {currentIndex > 0 && (
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}
        {currentIndex < mediaItems.length - 1 && (
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
        {/* Media content */}
        <div className="w-full h-full flex items-center justify-center">
          {currentMedia.mediaType === "IMAGE" || currentMedia.type === "IMAGE" ? (
            showZoom ? (
              <div
                ref={imgContainerRef}
                className="w-full h-full overflow-auto cursor-grab STYLE-styled-modal-scrollbar"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {isImgLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-60 h-60 bg-gray-700 rounded-lg animate-pulse" />
                  </div>
                )}
                <img
                  src={currentMedia.mediaUrl}
                  alt={currentMedia.fileName || "Image"}
                  style={{
                    width: `${zoomLevel}%`,
                    height: "auto",
                    maxWidth: "none",
                    maxHeight: "none",
                    display: isImgLoading ? "none" : "block",
                    margin: "auto",
                  }}
                  draggable={false}
                  onLoad={() => setIsImgLoading(false)}
                />
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                {isImgLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-60 h-60 bg-gray-700 rounded-lg animate-pulse" />
                  </div>
                )}
                <img
                  src={currentMedia.mediaUrl}
                  alt={currentMedia.fileName || "Image"}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    display: isImgLoading ? "none" : "block",
                    margin: "auto",
                  }}
                  draggable={false}
                  onLoad={() => setIsImgLoading(false)}
                  onError={() => setIsImgLoading(false)}
                />
              </div>
            )
          ) : currentMedia.mediaType === "VIDEO" || currentMedia.type === "VIDEO" ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {isVideoLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-60 h-60 bg-gray-700 rounded-lg animate-pulse" />
                </div>
              )}
              <video
                ref={videoRef}
                src={currentMedia.mediaUrl}
                className="max-w-full max-h-full object-contain"
                onEnded={handleVideoEnded}
                controls
                style={{ display: isVideoLoading ? "none" : "block" }}
                onLoadedData={() => setIsVideoLoading(false)}
                onError={() => setIsVideoLoading(false)}
              />
              {/* Custom play/pause button overlay */}
              <button
                onClick={toggleVideoPlay}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                {isVideoPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>
            </div>
          ) : currentMedia.type === "TEXT" ? (
            // Handle TEXT messages (links)
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="text-center max-w-md mx-auto p-6">
                <div className="text-blue-400 text-lg font-medium mb-4">Link</div>
                <div className="text-white text-sm break-all mb-4">{currentMedia.mediaUrl}</div>
                <a
                  href={currentMedia.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Open Link
                </a>
              </div>
            </div>
          ) : (
            <div className="text-white text-center">
              <p>Không thể hiển thị media</p>
              <p>Type: {currentMedia?.type}</p>
              <p>MediaType: {currentMedia?.mediaType}</p>
              <p>URL: {currentMedia?.mediaUrl}</p>
            </div>
          )}
        </div>
        {/* Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-black/50 rounded-full">
          <span className="text-white text-sm">
            {currentIndex + 1} / {mediaItems.length}
          </span>
        </div>
        {/* File name */}
        {currentMedia.fileName && (
          <div className="absolute bottom-4 left-4 z-10 px-4 py-2 bg-black/50 rounded-lg max-w-xs">
            <span className="text-white text-sm truncate block">{currentMedia.fileName}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default MediaViewerModal
