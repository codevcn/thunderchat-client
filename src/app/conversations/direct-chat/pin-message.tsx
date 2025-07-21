import { useState } from "react"
import type { TStateDirectMessage } from "@/utils/types/global"
import { EMessageTypes } from "@/utils/enums"
//import { useUser } from "@/hooks/user"
import {
  FileText,
  File,
  FileSpreadsheet,
  Presentation,
  FileCode,
  FileVideo,
  Paperclip,
  Mic,
  Image as ImageIcon,
} from "lucide-react"
import Image from "next/image"

export type PinMessageModalProps = {
  pinnedMessages: TStateDirectMessage[]
  onClose: () => void
  onSelectMessage: (msgId: number) => void
  onUnpinMessage: (msgId: number) => void
}

// Helper function to render message content based on type
const renderMessageContent = (message: TStateDirectMessage) => {
  const { type, content, mediaUrl, stickerUrl, fileName, fileType, fileSize } = message

  // Helper function to get file icon
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase()
    const iconClass = "w-4 h-4"

    switch (ext) {
      case "pdf":
        return <FileText className={`${iconClass} text-red-500`} />
      case "doc":
      case "docx":
        return <FileText className={`${iconClass} text-blue-500`} />
      case "xls":
      case "xlsx":
        return <FileSpreadsheet className={`${iconClass} text-green-500`} />
      case "ppt":
      case "pptx":
        return <Presentation className={`${iconClass} text-orange-500`} />
      case "txt":
        return <FileCode className={`${iconClass} text-gray-500`} />
      default:
        return <File className={`${iconClass} text-blue-400`} />
    }
  }

  // Helper function to format file size
  const formatBytes = (bytes?: number) => {
    if (!bytes) return ""
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  // Image message - hiển thị thu nhỏ ảnh
  if (type === EMessageTypes.IMAGE) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
          {mediaUrl ? (
            <Image
              src={mediaUrl}
              alt="Image"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-600 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-blue-400" />
            </div>
          )}
        </div>
        <span className="text-xs text-gray-300">Ảnh</span>
      </div>
    )
  }

  // Video message - hiển thị thu nhỏ video
  if (type === EMessageTypes.VIDEO) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-gray-600 flex items-center justify-center relative">
          {mediaUrl ? (
            <>
              <video
                src={mediaUrl}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <FileVideo className="w-3 h-3 text-white" />
              </div>
            </>
          ) : (
            <FileVideo className="w-4 h-4 text-red-400" />
          )}
        </div>
        <span className="text-xs text-gray-300">{fileName || "Video"}</span>
      </div>
    )
  }

  // Document message - hiển thị thu nhỏ document
  if (type === EMessageTypes.DOCUMENT) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-gray-600 flex items-center justify-center">
          {getFileIcon(fileName || "document")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-300 truncate">{fileName || "Tệp tin"}</div>
          {fileSize && <div className="text-xs text-gray-400">{formatBytes(fileSize)}</div>}
        </div>
      </div>
    )
  }

  // Audio message - hiển thị thu nhỏ audio
  if (type === EMessageTypes.AUDIO) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-gray-600 flex items-center justify-center">
          <Mic className="w-4 h-4 text-green-400" />
        </div>
        <span className="text-xs text-gray-300">Tin nhắn thoại</span>
      </div>
    )
  }

  // Sticker message - hiển thị thu nhỏ sticker
  if (type === EMessageTypes.STICKER) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
          {stickerUrl ? (
            <Image
              src={stickerUrl}
              alt="Sticker"
              width={24}
              height={24}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-600 flex items-center justify-center">
              <span className="text-xs">😊</span>
            </div>
          )}
        </div>
        <span className="text-xs text-gray-300">Sticker</span>
      </div>
    )
  }

  // Text message (including emojis)
  if (type === EMessageTypes.TEXT && content) {
    // Check if content contains emoji images
    const hasEmojiImage = content.includes("<img") || content.includes("emoji")

    if (hasEmojiImage) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 bg-gray-600 flex items-center justify-center">
            <span className="text-xs">😊</span>
          </div>
          <span className="text-xs text-gray-300">Emoji</span>
        </div>
      )
    }

    // Regular text message - hiển thị nội dung text như bình thường
    return (
      <div className="flex-1 min-w-0">
        <div
          className="text-xs text-gray-300 truncate max-w-[200px]"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    )
  }

  // Fallback - chỉ hiển thị khi không match với type nào
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-gray-600 flex items-center justify-center">
        <Paperclip className="w-4 h-4 text-gray-400" />
      </div>
      <span className="text-xs text-gray-300">Tệp/Media</span>
    </div>
  )
}

export const PinMessageModal = ({
  pinnedMessages,
  onClose,
  onSelectMessage,
  onUnpinMessage,
}: PinMessageModalProps) => {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-regular-dark-gray-cl rounded-lg shadow-lg max-w-md w-full p-0 relative border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-regular-dark-gray-cl rounded-t-lg">
          <span className="font-semibold text-base text-white">
            Danh sách ghim ({pinnedMessages.length})
          </span>
          <button
            className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
            onClick={onClose}
          >
            Thu gọn
          </button>
        </div>
        {/* List */}
        <ul className="divide-y divide-gray-700">
          {pinnedMessages.length === 0 ? (
            <li className="p-4 text-gray-400 text-sm">Chưa có tin nhắn nào được ghim.</li>
          ) : (
            pinnedMessages.slice(0, 5).map((msg) => (
              <li
                key={msg.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-800 cursor-pointer group relative"
                onClick={() => onSelectMessage(msg.id)}
              >
                {/* Icon */}
                <span className="mt-1 text-blue-400 flex-shrink-0">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="8" cy="8" r="6" />
                    <rect x="5.5" y="5.5" width="5" height="5" rx="1.5" />
                  </svg>
                </span>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-blue-300 mb-1">Tin nhắn</div>
                  <div className="text-xs text-gray-300 mb-1">
                    {msg.Author?.Profile?.fullName || "Người gửi"}
                  </div>
                  {renderMessageContent(msg)}
                </div>
                {/* More button */}
                <div className="relative flex-shrink-0">
                  <button
                    className="opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-gray-200 px-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(openMenuId === msg.id ? null : msg.id)
                    }}
                    title="Tùy chọn"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="8" cy="4" r="1" />
                      <circle cx="8" cy="8" r="1" />
                      <circle cx="8" cy="12" r="1" />
                    </svg>
                  </button>
                  {/* Dropdown menu */}
                  {openMenuId === msg.id && (
                    <div className="absolute right-0 mt-2 w-28 bg-gray-800 border border-gray-700 rounded shadow z-10">
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          onUnpinMessage(msg.id)
                          setOpenMenuId(null)
                        }}
                      >
                        Bỏ ghim
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
