import React, { useState, useMemo } from "react"
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Link as LinkIcon,
  Music,
  Video,
  File as FileIcon,
  Play,
} from "lucide-react"
import { useAppSelector } from "@/hooks/redux"
import { EMessageMediaTypes, EMessageTypes } from "@/utils/enums"
import dayjs from "dayjs"
import MediaViewerModal from "@/components/chatbox/media-viewer-modal"
import MediaArchivePanel from "./media-archive-panel"
import ActionIcons from "@/components/materials/action-icons"
import { useUser } from "@/hooks/user"
import { useVoicePlayerActions } from "@/contexts/voice-player.context"
import { useMediaMessages } from "@/hooks/use-media-messages"
import type { TMediaData, TMediaDataCollection } from "@/utils/types/global"
import { EMessageStatus } from "@/utils/socket/enums"

// Tối ưu Section component với React.memo
const Section = React.memo(
  ({
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
)

Section.displayName = "Section"

// Tối ưu MediaPanel với React.memo
const MediaPanel = React.memo(() => {
  const { directChat } = useAppSelector(({ messages }) => messages)
  const currentUser = useUser()!
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
  const [showArchive, setShowArchive] = useState(false)
  const [archiveTab, setArchiveTab] = useState<"Images/Video" | "files" | "voices" | "links">(
    "Images/Video"
  )

  // Chỉ sử dụng actions, không subscribe vào state
  const { playAudio, setShowPlayer } = useVoicePlayerActions()

  // Custom hook để quản lý media messages
  const { mediaMessages, loading, error, statistics } = useMediaMessages()
  // Hàm kiểm tra URL - memoized
  const isUrl = useMemo(
    () => (text: string) => {
      try {
        new URL(text)
        return true
      } catch {
        return false
      }
    },
    []
  )

  // Lọc các loại media từ tin nhắn
  const mediaData = useMemo<TMediaDataCollection>(() => {
    if (!mediaMessages || mediaMessages.length === 0)
      return { images: [], videos: [], files: [], audios: [], links: [] }

    const images: TMediaData[] = []
    const videos: TMediaData[] = []
    const files: TMediaData[] = []
    const audios: TMediaData[] = []
    const links: TMediaData[] = []

    mediaMessages.forEach((message) => {
      // Bỏ qua tin nhắn đã bị xóa
      if (message.isDeleted) return

      // Handle TEXT messages (links)
      if (message.type === EMessageTypes.TEXT && message.content && isUrl(message.content)) {
        const messageData: TMediaData = {
          id: message.id,
          type: message.type,
          mediaUrl: message.content, // Use content as URL for links
          fileName: message.content,
          content: message.content,
          createdAt: message.createdAt,
          authorId: message.authorId,
          fileSize: 0,
          thumbnailUrl: "",
          mediaType: EMessageMediaTypes.DOCUMENT, // Default type for links
          isViolated: message.isViolated,
        }
        links.push(messageData)
        return
      }

      // Handle MEDIA messages
      if (message.type === EMessageTypes.MEDIA && message.Media) {
        const messageData: TMediaData = {
          id: message.id,
          type: message.type,
          mediaUrl: message.Media.url,
          fileName: message.Media.fileName,
          content: message.content || "",
          createdAt: message.createdAt,
          authorId: message.authorId,
          fileSize: message.Media.fileSize,
          thumbnailUrl: message.Media.thumbnailUrl,
          mediaType: message.Media.type,
          isViolated: message.isViolated,
        }

        if (message.Media.type === EMessageMediaTypes.IMAGE) {
          images.push(messageData)
        } else if (message.Media.type === EMessageMediaTypes.VIDEO) {
          videos.push(messageData)
        } else if (message.Media.type === EMessageMediaTypes.AUDIO) {
          audios.push(messageData)
        } else if (message.Media.type === EMessageMediaTypes.DOCUMENT) {
          files.push(messageData)
        }
      } else {
      }
    })

    // Sắp xếp theo thời gian mới nhất (createdAt giảm dần)
    const sortByLatest = (a: TMediaData, b: TMediaData) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

    const result = {
      images: images.sort(sortByLatest),
      videos: videos.sort(sortByLatest),
      files: files.sort(sortByLatest),
      audios: audios.sort(sortByLatest),
      links: links.sort(sortByLatest),
    }

    return result
  }, [mediaMessages, isUrl])

  // Memoized mixed media
  const mixedMedia = useMemo(() => {
    const arr = [...mediaData.images, ...mediaData.videos]
    arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return arr
  }, [mediaData.images, mediaData.videos])

  // Memoized handlers
  const openMediaViewer = useMemo(
    () => (mediaItem: TMediaData) => {
      const index = mixedMedia.findIndex((item) => item.id === mediaItem.id)
      setSelectedMediaIndex(index >= 0 ? index : 0)
      setIsMediaViewerOpen(true)
    },
    [mixedMedia]
  )

  const handleVoiceClick = useMemo(
    () => (voiceMessage: TMediaData) => {
      // Phát audio và hiển thị player
      playAudio({
        id: voiceMessage.id,
        authorId: voiceMessage.authorId,
        createdAt: voiceMessage.createdAt,
        type: EMessageTypes.MEDIA,
        content: "",
        directChatId: directChat?.id || 0,
        status: EMessageStatus.SENT,
        isNewMsg: false,
        isDeleted: false,
        Author: currentUser,
        ReplyTo: null,
        Media: {
          id: voiceMessage.id,
          url: voiceMessage.mediaUrl,
          fileName: voiceMessage.fileName,
          type: EMessageMediaTypes.AUDIO,
          fileSize: voiceMessage.fileSize,
          thumbnailUrl: voiceMessage.thumbnailUrl,
          createdAt: new Date(voiceMessage.createdAt),
        },
        Sticker: null,
        isViolated: voiceMessage.isViolated,
      })
      setShowPlayer(true)
    },
    [directChat?.id, currentUser, playAudio, setShowPlayer]
  )

  const handleDownload = useMemo(
    () => async (item: TMediaData) => {
      if (!item.mediaUrl) return
      const url = item.mediaUrl
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error("Cannot download file")
        const blob = await response.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = blobUrl
        const fileNameWithExt = item.fileName || "media"
        const hasExtension = fileNameWithExt.includes(".")
        const finalFileName = hasExtension
          ? fileNameWithExt
          : `${fileNameWithExt}.${item.mediaType || "dat"}`
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
          : `${fileNameWithExt}.${item.mediaType || "dat"}`
        link.download = finalFileName
        link.target = "_blank"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    },
    []
  )

  // Memoized helper functions
  const getFileIcon = useMemo(
    () => (fileName: string) => {
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
    },
    []
  )

  const formatFileSize = useMemo(
    () => (bytes?: number) => {
      if (!bytes) return ""
      if (bytes < 1024) return bytes + " B"
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
      return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    },
    []
  )

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

      {/* Images/Video Section */}
      <Section title="Images/Video">
        <div className="grid grid-cols-3 gap-2 px-2 pb-2">
          {mixedMedia.slice(0, 6).map((item) => {
            return (
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
                    onViewOriginalMessage={() => {}}
                    onDeleteForMe={() => console.log("Delete for me:", item.id)}
                    onDeleteForEveryone={() => console.log("Delete for everyone:", item.id)}
                    messageId={item.id}
                  />
                </div>

                {/* Media content */}
                {item.mediaUrl &&
                  (item.type === EMessageTypes.MEDIA &&
                  item.mediaType === EMessageMediaTypes.IMAGE ? (
                    <img
                      src={item.mediaUrl}
                      alt={item.fileName || "media"}
                      className="object-cover w-full h-full"
                      loading="lazy"
                    />
                  ) : item.type === EMessageTypes.MEDIA &&
                    item.mediaType === EMessageMediaTypes.VIDEO ? (
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
            )
          })}
          {mixedMedia.length === 0 && (
            <div className="col-span-3 text-center text-gray-400 py-4 whitespace-nowrap">
              No images or videos yet
            </div>
          )}
        </div>
        {statistics.images + statistics.videos > 0 && (
          <button
            className="w-full mt-2 bg-[#2C2E31] hover:bg-[#35363A] text-white font-semibold py-2 rounded-lg"
            onClick={() => {
              setArchiveTab("Images/Video")
              setShowArchive(true)
            }}
          >
            View all ({statistics.images + statistics.videos})
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
        <div className="absolute right-0 top-0 h-full w-info-bar-mb screen-large-chatting:w-info-bar z-[10] bg-[#181A1B]">
          <MediaArchivePanel
            onClose={() => setShowArchive(false)}
            creator={directChat.Creator}
            recipient={directChat.Recipient}
            initialTab={archiveTab}
            directChatId={directChat.id}
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
                <div className="font-semibold text-white truncate leading-snug">
                  {item.fileName || "Unknown file"}
                </div>
                <div className="text-xs text-gray-400">
                  <span className="block">{dayjs(item.createdAt).format("DD/MM/YYYY")}</span>
                  <span className="block">{formatFileSize(item.fileSize)}</span>
                </div>
              </div>
              {/* Action icons on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ActionIcons
                  onDownload={() => handleDownload(item)}
                  onShare={() => {}}
                  onMore={() => {}}
                  showDownload={!!item.mediaUrl}
                  isSender={item.authorId === currentUser?.id}
                  onViewOriginalMessage={() => {}}
                  messageId={item.id}
                />
              </div>
            </div>
          ))}
          {mediaData.files.length === 0 && (
            <div className="text-center text-gray-400 py-4">No files yet</div>
          )}
        </div>
        {statistics.files > 0 && (
          <button
            className="w-full mt-2 bg-[#2C2E31] hover:bg-[#35363A] text-white font-semibold py-2 rounded-lg"
            onClick={() => {
              setArchiveTab("files")
              setShowArchive(true)
            }}
          >
            View all ({statistics.files})
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
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ActionIcons
                  onDownload={() => handleDownload(item)}
                  onShare={() => {}}
                  onMore={() => {}}
                  showDownload={!!item.mediaUrl}
                  isSender={item.authorId === currentUser?.id}
                  onViewOriginalMessage={() => {}}
                  onDeleteForMe={() => console.log("Delete for me:", item.id)}
                  onDeleteForEveryone={() => console.log("Delete for everyone:", item.id)}
                  messageId={item.id}
                />
              </div>
            </div>
          ))}
          {mediaData.audios.length === 0 && (
            <div className="text-center text-gray-400 py-4">No voice messages yet</div>
          )}
        </div>
        {statistics.voices > 0 && (
          <button
            className="w-full mt-2 bg-[#2C2E31] hover:bg-[#35363A] text-white font-semibold py-2 rounded-lg"
            onClick={() => {
              setArchiveTab("voices")
              setShowArchive(true)
            }}
          >
            View all ({statistics.voices})
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
                <div className="text-blue-400 text-sm font-medium truncate underline">
                  {item.content}
                </div>
                <div className="text-gray-400 text-xs">Link</div>
              </div>
              {/* Action icons on hover, no download */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ActionIcons
                  showDownload={false}
                  onShare={() => {}}
                  onMore={() => {}}
                  isSender={item.authorId === currentUser?.id}
                  onViewOriginalMessage={() => {}}
                  onDeleteForMe={() => console.log("Delete for me:", item.id)}
                  onDeleteForEveryone={() => console.log("Delete for everyone:", item.id)}
                  messageId={item.id}
                />
              </div>
            </div>
          ))}
          {mediaData.links.length === 0 && (
            <div className="text-center text-gray-400 py-4">No links yet</div>
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
            View all ({mediaData.links.length})
          </button>
        )}
      </Section>
    </div>
  )
})

MediaPanel.displayName = "MediaPanel"

export default MediaPanel
