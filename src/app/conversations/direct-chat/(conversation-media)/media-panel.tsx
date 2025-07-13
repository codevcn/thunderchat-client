import React, { useState, useMemo, useEffect } from "react"
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Music,
  Video,
  File as FileIcon,
} from "lucide-react"
import { useAppSelector } from "@/hooks/redux"
import { EMessageTypes } from "@/utils/enums"
import dayjs from "dayjs"
import Image from "next/image"

const Section = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-[#232526] rounded-xl mb-2">
      <button
        className="flex items-center justify-between w-full px-4 py-3 text-base font-semibold text-[#CFCFCF] focus:outline-none"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

const MediaPanel = () => {
  const { directMessages } = useAppSelector(({ messages }) => messages)

  // Hàm kiểm tra URL
  const isUrl = (text: string) => {
    try {
      new URL(text)
      return true
    } catch {
      return false
    }
  }

  // Lọc các loại media từ tin nhắn
  const mediaData = useMemo(() => {
    if (!directMessages) return { images: [], videos: [], files: [], audios: [], links: [] }

    const images: any[] = []
    const videos: any[] = []
    const files: any[] = []
    const audios: any[] = []
    const links: any[] = []

    directMessages.forEach((message) => {
      if (!message.mediaUrl && !message.content) return

      const messageData = {
        id: message.id,
        type: message.type,
        mediaUrl: message.mediaUrl,
        fileName: message.fileName,
        content: message.content,
        createdAt: message.createdAt,
        authorId: message.authorId,
        fileSize: message.fileSize, // Thêm fileSize
      }

      switch (message.type) {
        case EMessageTypes.IMAGE:
          if (message.mediaUrl) {
            images.push(messageData)
          }
          break
        case EMessageTypes.VIDEO:
          if (message.mediaUrl) {
            videos.push(messageData)
          }
          break
        case EMessageTypes.DOCUMENT:
          if (message.mediaUrl) {
            files.push(messageData)
          }
          break
        case EMessageTypes.AUDIO:
          if (message.mediaUrl) {
            audios.push(messageData)
          }
          break
        case EMessageTypes.TEXT:
          // Kiểm tra nếu content chứa URL
          if (message.content && isUrl(message.content)) {
            links.push(messageData)
          }
          break
      }
    })

    return { images, videos, files, audios, links }
  }, [directMessages, isUrl])

  // Hàm lấy icon cho file
  const getFileIcon = (fileName: string) => {
    const ext = fileName?.split(".").pop()?.toLowerCase()
    const iconClass = "w-7 h-7"

    switch (ext) {
      case "pdf":
        return <FileText className={`${iconClass} text-red-500`} />
      case "doc":
      case "docx":
        return <FileText className={`${iconClass} text-blue-500`} />
      case "xls":
      case "xlsx":
        return <FileText className={`${iconClass} text-green-500`} />
      case "ppt":
      case "pptx":
        return <FileText className={`${iconClass} text-orange-500`} />
      case "txt":
        return <FileText className={`${iconClass} text-gray-500`} />
      default:
        return <FileIcon className={`${iconClass} text-blue-400`} />
    }
  }

  // Hàm format kích thước file
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ""
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  // Hàm format URL để hiển thị
  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname + urlObj.pathname
    } catch {
      return url
    }
  }

  // Component Video Thumbnail với thumbnail thực từ video
  const VideoThumbnail = ({ videoUrl, fileName }: { videoUrl: string; fileName?: string }) => {
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    // Tạo thumbnail từ video
    const generateThumbnail = () => {
      const video = document.createElement("video")
      video.crossOrigin = "anonymous"
      video.muted = true
      video.playsInline = true
      video.preload = "metadata"

      video.onloadedmetadata = () => {
        try {
          // Tạo canvas để vẽ frame từ video
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")
          if (!ctx) {
            setError(true)
            setLoading(false)
            return
          }

          canvas.width = 80
          canvas.height = 80

          // Vẽ frame đầu tiên của video
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          // Chuyển canvas thành data URL
          const thumbnail = canvas.toDataURL("image/jpeg", 0.8)
          setThumbnailUrl(thumbnail)
          setLoading(false)
        } catch (error) {
          console.error("Error generating thumbnail:", error)
          setError(true)
          setLoading(false)
        }
      }

      video.onerror = () => {
        console.error("Error loading video for thumbnail")
        setError(true)
        setLoading(false)
      }

      video.src = videoUrl
      video.load()
    }

    // Tạo thumbnail khi component mount
    useEffect(() => {
      generateThumbnail()
    }, [videoUrl])

    if (loading) {
      return (
        <div className="w-20 h-20 relative bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      )
    }

    if (thumbnailUrl && !error) {
      return (
        <div className="w-20 h-20 relative bg-gray-700 rounded-lg overflow-hidden group cursor-pointer">
          <Image
            src={thumbnailUrl}
            alt={fileName || "Video thumbnail"}
            fill
            className="object-cover"
            sizes="80px"
          />
          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
            <div className="w-6 h-6 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-l-[6px] border-l-black border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
            </div>
          </div>

          {/* File name tooltip */}
          {fileName && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 truncate">
              {fileName}
            </div>
          )}
        </div>
      )
    }

    // Fallback nếu không tạo được thumbnail
    return (
      <div className="w-20 h-20 relative bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg overflow-hidden flex items-center justify-center group cursor-pointer">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 to-blue-600/80" />

        {/* Video icon */}
        <Video className="w-8 h-8 text-white z-10" />

        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <div className="w-6 h-6 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-l-[6px] border-l-black border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
          </div>
        </div>

        {/* File name tooltip */}
        {fileName && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 truncate">
            {fileName}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-2">
      {/* Ảnh/Video Section */}
      <Section title="Ảnh/Video">
        <div className="flex flex-wrap gap-2 px-2 pb-2">
          {mediaData.images.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="w-20 h-20 relative bg-gray-700 rounded-lg overflow-hidden"
            >
              <Image
                src={item.mediaUrl!}
                alt={item.fileName || "Image"}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          ))}
          {mediaData.videos.slice(0, 6).map((item) => (
            <VideoThumbnail key={item.id} videoUrl={item.mediaUrl!} fileName={item.fileName} />
          ))}
          {mediaData.images.length === 0 && mediaData.videos.length === 0 && (
            <div className="w-full text-center text-gray-400 py-4">Chưa có ảnh hoặc video</div>
          )}
        </div>
        {(mediaData.images.length > 0 || mediaData.videos.length > 0) && (
          <button className="w-full mt-2 bg-[#2C2E31] hover:bg-[#35363A] text-white font-semibold py-2 rounded-lg">
            Xem tất cả ({mediaData.images.length + mediaData.videos.length})
          </button>
        )}
      </Section>

      {/* File Section */}
      <Section title="File" defaultOpen={mediaData.files.length > 0}>
        <div className="px-2 pb-2">
          {mediaData.files.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-[#232526] hover:bg-[#282A2D] rounded-lg px-3 py-2 mb-1"
            >
              <div>{getFileIcon(item.fileName || "")}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">
                  {item.fileName || "Unknown file"}
                </div>
                <div className="text-xs text-gray-400 flex items-center justify-between">
                  <span>{dayjs(item.createdAt).format("DD/MM/YYYY")}</span>
                  <span>{formatFileSize(item.fileSize)}</span>
                </div>
              </div>
            </div>
          ))}
          {mediaData.files.length === 0 && (
            <div className="text-center text-gray-400 py-4">Chưa có file nào</div>
          )}
        </div>
        {mediaData.files.length > 3 && (
          <button className="w-full mt-2 bg-[#2C2E31] hover:bg-[#35363A] text-white font-semibold py-2 rounded-lg">
            Xem tất cả ({mediaData.files.length})
          </button>
        )}
      </Section>

      {/* Audio Section */}
      <Section title="Audio" defaultOpen={mediaData.audios.length > 0}>
        <div className="px-2 pb-2 flex flex-col gap-2">
          {mediaData.audios.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-[#232526] hover:bg-[#282A2D] rounded-lg px-3 py-2"
            >
              <Music className="w-7 h-7 text-green-400" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">
                  {item.fileName || "Audio message"}
                </div>
                <div className="text-xs text-gray-400">
                  {dayjs(item.createdAt).format("DD/MM/YYYY")}
                </div>
              </div>
            </div>
          ))}
          {mediaData.audios.length === 0 && (
            <div className="text-center text-gray-400 py-4">Chưa có tin nhắn thoại</div>
          )}
        </div>
        {mediaData.audios.length > 3 && (
          <button className="w-full mt-2 bg-[#2C2E31] hover:bg-[#35363A] text-white font-semibold py-2 rounded-lg">
            Xem tất cả ({mediaData.audios.length})
          </button>
        )}
      </Section>

      {/* Link Section */}
      <Section title="Link" defaultOpen={mediaData.links.length > 0}>
        <div className="px-2 pb-2 flex flex-col gap-2">
          {mediaData.links.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-[#232526] hover:bg-[#282A2D] rounded-lg px-3 py-2"
            >
              <LinkIcon className="w-6 h-6 text-blue-400" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">{formatUrl(item.content)}</div>
                <div className="text-xs text-gray-400">
                  {dayjs(item.createdAt).format("DD/MM/YYYY")}
                </div>
              </div>
            </div>
          ))}
          {mediaData.links.length === 0 && (
            <div className="text-center text-gray-400 py-4">Chưa có link nào</div>
          )}
        </div>
        {mediaData.links.length > 3 && (
          <button className="w-full mt-2 bg-[#2C2E31] hover:bg-[#35363A] text-white font-semibold py-2 rounded-lg">
            Xem tất cả ({mediaData.links.length})
          </button>
        )}
      </Section>
    </div>
  )
}

export default MediaPanel
