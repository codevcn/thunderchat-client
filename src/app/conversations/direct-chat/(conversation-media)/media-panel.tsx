import React, { useState, useMemo } from "react"
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Music,
  Video,
  File as FileIcon,
  Play,
} from "lucide-react"
import { useAppSelector } from "@/hooks/redux"
import { EMessageTypes } from "@/utils/enums"
import dayjs from "dayjs"
import Image from "next/image"
import MediaViewerModal from "@/components/chatbox/media-viewer-modal"
import MediaArchivePanel from "./media-archive-panel"
import ActionIcons from "@/components/materials/action-icons"
import { useUser } from "@/hooks/user"
import { useVoicePlayer } from "@/contexts/voice-player.context"
import { useMediaMessages } from "@/hooks/use-media-messages"

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
  const { directChat } = useAppSelector(({ messages }) => messages)
  const currentUser = useUser()
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
  const [showArchive, setShowArchive] = useState(false)
  const [archiveTab, setArchiveTab] = useState<"Ảnh/Video" | "files" | "voices" | "links">(
    "Ảnh/Video"
  )

  // Voice player context
  const { playAudio, setShowPlayer } = useVoicePlayer()

  // Custom hook để quản lý media messages
  const { mediaMessages, loading, error } = useMediaMessages()

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
    if (!mediaMessages || mediaMessages.length === 0)
      return { images: [], videos: [], files: [], audios: [], links: [] }

    const images: any[] = []
    const videos: any[] = []
    const files: any[] = []
    const audios: any[] = []
    const links: any[] = []

    mediaMessages.forEach((message) => {
      if (!message.mediaUrl && !message.content) return

      const messageData = {
        id: message.id,
        type: message.type,
        mediaUrl: message.mediaUrl,
        fileName: message.fileName,
        content: message.content,
        createdAt: message.createdAt,
        authorId: message.authorId,
        fileSize: message.fileSize,
        thumbnailUrl: message.thumbnailUrl,
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

    // Sắp xếp theo thời gian mới nhất (createdAt giảm dần)
    const sortByLatest = (a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

    return {
      images: images.sort(sortByLatest),
      videos: videos.sort(sortByLatest),
      files: files.sort(sortByLatest),
      audios: audios.sort(sortByLatest),
      links: links.sort(sortByLatest),
    }
  }, [mediaMessages, isUrl])

  // Trộn ảnh và video, sort theo thời gian mới nhất
  const mixedMedia = useMemo(() => {
    const arr = [...mediaData.images, ...mediaData.videos]
    arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return arr
  }, [mediaData.images, mediaData.videos])

  // Hàm mở media viewer
  const openMediaViewer = (mediaItem: any) => {
    // Tìm index trong mixedMedia (danh sách đã được sort và hiển thị trong UI)
    const index = mixedMedia.findIndex((item) => item.id === mediaItem.id)
    setSelectedMediaIndex(index)
    setIsMediaViewerOpen(true)
  }

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

  // Hàm xử lý click vào voice message
  const handleVoiceClick = (voiceMessage: any) => {
    // Chuyển đổi format message để phù hợp với voice player
    const messageForPlayer = {
      id: voiceMessage.id,
      authorId: voiceMessage.authorId,
      createdAt: voiceMessage.createdAt,
      mediaUrl: voiceMessage.mediaUrl,
      type: EMessageTypes.AUDIO,
      fileName: voiceMessage.fileName || "Audio message",
      content: "",
      directChatId: directChat?.id || 0,
      status: "SENT" as any,
      isNewMsg: false,
      Author: voiceMessage.Author || currentUser, // BẮT BUỘC PHẢI CÓ
      ReplyTo: voiceMessage.ReplyTo || null, // Nếu có ReplyTo thì truyền vào, không thì null
    }

    // Phát audio và hiển thị player
    playAudio(messageForPlayer)
    setShowPlayer(true)
  }

  // Thêm hàm handleDownload
  const handleDownload = async (item: any) => {
    if (!item.mediaUrl && !item.fileUrl) return
    const url = item.mediaUrl || item.fileUrl
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error("Không thể tải file")
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      const fileNameWithExt = item.fileName || "media"
      const hasExtension = fileNameWithExt.includes(".")
      const finalFileName = hasExtension
        ? fileNameWithExt
        : `${fileNameWithExt}.${item.fileType || "dat"}`
      link.download = finalFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      // Fallback: tải trực tiếp từ URL
      const link = document.createElement("a")
      link.href = url
      const fileNameWithExt = item.fileName || "media"
      const hasExtension = fileNameWithExt.includes(".")
      const finalFileName = hasExtension
        ? fileNameWithExt
        : `${fileNameWithExt}.${item.fileType || "dat"}`
      link.download = finalFileName
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="p-2">
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-red-400 text-center py-2 px-4 bg-red-900/20 rounded-lg mb-2">
          {error}
        </div>
      )}

      {/* Ảnh/Video Section */}
      <Section title="Ảnh/Video">
        <div className="grid grid-cols-3 gap-2 px-2 pb-2">
          {mixedMedia.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="aspect-square bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer group relative"
              onClick={() => openMediaViewer(item)}
            >
              {/* Action icons on hover, top-right */}
              <div className="absolute top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <ActionIcons
                  onDownload={() => handleDownload(item)}
                  onShare={() => {}}
                  onMore={() => {}}
                  showDownload={item.mediaUrl ? true : false}
                  isSender={item.authorId === currentUser?.id}
                  onViewOriginalMessage={() => {}} // Sẽ hiển thị context tin nhắn gốc
                  onDeleteForMe={() => console.log("Delete for me:", item.id)}
                  onDeleteForEveryone={() => console.log("Delete for everyone:", item.id)}
                  messageId={item.id}
                  mediaUrl={item.mediaUrl || item.fileUrl}
                  fileName={item.fileName}
                  fileType={item.fileType}
                />
              </div>
              {item.mediaUrl &&
                (item.type === EMessageTypes.IMAGE ? (
                  <img
                    src={item.mediaUrl}
                    alt={item.fileName || "media"}
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                ) : item.type === EMessageTypes.VIDEO ? (
                  <div className="relative w-full h-full">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.fileName || "video"}
                        className="object-cover w-full h-full"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full text-white opacity-70">
                        <Video className="w-8 h-8" />
                        <span className="text-xs mt-1">Video</span>
                      </div>
                    )}
                    {/* Video play icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <Play className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                ) : null)}
            </div>
          ))}
          {mixedMedia.length === 0 && (
            <div className="w-full text-center text-gray-400 py-4">Chưa có ảnh hoặc video</div>
          )}
        </div>
        {mixedMedia.length > 0 && (
          <button
            className="w-full mt-2 bg-[#2C2E31] hover:bg-[#35363A] text-white font-semibold py-2 rounded-lg"
            onClick={() => {
              setArchiveTab("Ảnh/Video")
              setShowArchive(true)
            }}
          >
            Xem tất cả ({mixedMedia.length})
          </button>
        )}
      </Section>

      {/* Media Viewer Modal hoặc MediaArchivePanel */}
      {directChat && !showArchive && (
        <MediaViewerModal
          isOpen={isMediaViewerOpen}
          onClose={() => setIsMediaViewerOpen(false)}
          mediaItems={mixedMedia}
          initialIndex={selectedMediaIndex}
          creator={directChat.Creator}
          recipient={directChat.Recipient}
        />
      )}
      {directChat && showArchive && (
        <div className="absolute right-0 top-0 h-full w-info-bar-mb screen-large-chatting:w-info-bar z-[100] bg-[#181A1B]">
          <MediaArchivePanel
            onClose={() => setShowArchive(false)}
            mediaData={mediaData}
            allMediaItems={mixedMedia}
            creator={directChat.Creator}
            recipient={directChat.Recipient}
            initialTab={archiveTab}
          />
        </div>
      )}

      {/* File Section */}
      <Section title="File" defaultOpen={mediaData.files.length > 0}>
        <div className="px-2 pb-2">
          {mediaData.files.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-[#232526] hover:bg-[#282A2D] rounded-lg px-3 py-2 mb-1 group"
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
              {/* Action icons on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ActionIcons
                  onDownload={() => handleDownload(item)}
                  onShare={() => {}}
                  onMore={() => {}}
                  showDownload={!!(item.mediaUrl || item.fileUrl)}
                  isSender={item.authorId === currentUser?.id}
                  onViewOriginalMessage={() => {}} // Sẽ hiển thị context tin nhắn gốc
                  onDeleteForMe={() => console.log("Delete for me:", item.id)}
                  onDeleteForEveryone={() => console.log("Delete for everyone:", item.id)}
                  messageId={item.id}
                  mediaUrl={item.mediaUrl || item.fileUrl}
                  fileName={item.fileName}
                  fileType={item.fileType}
                />
              </div>
            </div>
          ))}
          {mediaData.files.length === 0 && (
            <div className="text-center text-gray-400 py-4">Chưa có file nào</div>
          )}
        </div>
        {mediaData.files.length > 0 && (
          <button
            className="w-full mt-2 bg-[#2C2E31] hover:bg-[#35363A] text-white font-semibold py-2 rounded-lg"
            onClick={() => {
              setArchiveTab("files")
              setShowArchive(true)
            }}
          >
            Xem tất cả ({mediaData.files.length})
          </button>
        )}
      </Section>

      {/* Voices Section */}
      <Section title="Voices" defaultOpen={mediaData.audios.length > 0}>
        <div className="px-2 pb-2 flex flex-col gap-2">
          {mediaData.audios.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-[#232526] hover:bg-[#282A2D] rounded-lg px-3 py-2 group cursor-pointer"
              onClick={() => handleVoiceClick(item)}
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
              {/* Action icons on hover */}
              <div
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <ActionIcons
                  onDownload={() => handleDownload(item)}
                  onShare={() => {}}
                  onMore={() => {}}
                  showDownload={!!(item.mediaUrl || item.fileUrl)}
                  isSender={item.authorId === currentUser?.id}
                  onViewOriginalMessage={() => {}} // Sẽ hiển thị context tin nhắn gốc
                  onDeleteForMe={() => console.log("Delete for me:", item.id)}
                  onDeleteForEveryone={() => console.log("Delete for everyone:", item.id)}
                  messageId={item.id}
                  mediaUrl={item.fileUrl}
                  fileName={item.fileName}
                  fileType={item.fileType}
                />
              </div>
            </div>
          ))}
          {mediaData.audios.length === 0 && (
            <div className="text-center text-gray-400 py-4">Chưa có tin nhắn voice</div>
          )}
        </div>
        {mediaData.audios.length > 0 && (
          <button
            className="w-full mt-2 bg-[#2C2E31] hover:bg-[#35363A] text-white font-semibold py-2 rounded-lg"
            onClick={() => {
              setArchiveTab("voices")
              setShowArchive(true)
            }}
          >
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
              className="flex items-center gap-3 bg-[#232526] hover:bg-[#282A2D] rounded-lg px-3 py-2 group"
            >
              <LinkIcon className="w-6 h-6 text-blue-400" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">{formatUrl(item.content)}</div>
                <div className="text-xs text-gray-400">
                  {dayjs(item.createdAt).format("DD/MM/YYYY")}
                </div>
              </div>
              {/* Action icons on hover, no download */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ActionIcons
                  showDownload={false}
                  onShare={() => {}}
                  onMore={() => {}}
                  isSender={item.authorId === currentUser?.id}
                  onViewOriginalMessage={() => {}} // Sẽ hiển thị context tin nhắn gốc
                  onDeleteForMe={() => console.log("Delete for me:", item.id)}
                  onDeleteForEveryone={() => console.log("Delete for everyone:", item.id)}
                  messageId={item.id}
                />
              </div>
            </div>
          ))}
          {mediaData.links.length === 0 && (
            <div className="text-center text-gray-400 py-4">Chưa có link nào</div>
          )}
        </div>
        {mediaData.links.length > 0 && (
          <button
            className="w-full mt-2 bg-[#2C2E31] hover:bg-[#35363A] text-white font-semibold py-2 rounded-lg"
            onClick={() => {
              setArchiveTab("links")
              setShowArchive(true)
            }}
          >
            Xem tất cả ({mediaData.links.length})
          </button>
        )}
      </Section>
    </div>
  )
}

export default MediaPanel
