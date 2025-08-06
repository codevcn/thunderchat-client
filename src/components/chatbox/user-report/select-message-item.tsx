import { useState, useMemo } from "react"
import { EMessageMediaTypes, EMessageTypes } from "@/utils/enums"
import { santizeMsgContent } from "@/utils/helpers"
import type { TStateMessage } from "@/utils/types/global"
import type { TUserWithoutPassword } from "@/utils/types/be-api"
import dayjs from "dayjs"
import { FileText, File, FileSpreadsheet, Presentation, FileCode, Mic, Play } from "lucide-react"
import Image from "next/image"
import { CustomAvatar } from "@/components/materials"

type TSelectMessageItemProps = {
  content: string
  stickerUrl: string | null
  mediaUrl: string | null
  type: string
  fileName?: string
  fileType?: string
  fileSize?: number
  message?: TStateMessage
  user: TUserWithoutPassword
  isSelected: boolean
  onSelect: (isSelected: boolean) => void
  disabled?: boolean
}

type TContentProps = {
  content: string
  stickerUrl: string | null
  mediaUrl: string | null
  type: string
  fileName?: string
  fileType?: string
  fileSize?: number
  message: TStateMessage
  user: TUserWithoutPassword
  isSender?: boolean
}

// Content component tái sử dụng từ message.tsx
const Content = ({
  content,
  stickerUrl,
  mediaUrl,
  type,
  fileName,
  fileType,
  fileSize,
  message,
  user,
  isSender,
}: TContentProps) => {
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    const iconClass = "w-4 h-4"

    switch (extension) {
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
      case "js":
      case "ts":
      case "jsx":
      case "tsx":
      case "html":
      case "css":
      case "json":
        return <FileCode className={`${iconClass} text-gray-500`} />
      default:
        return <File className={`${iconClass} text-blue-400`} />
    }
  }

  const formatBytes = (bytes?: number) => {
    if (!bytes) return ""
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  // Sticker messages are filtered out, so this case should not be reached
  if (type === EMessageTypes.STICKER && stickerUrl) {
    return null
  }

  if (type === EMessageTypes.MEDIA && fileType === EMessageMediaTypes.IMAGE && mediaUrl) {
    return (
      <div className="relative">
        <Image src={mediaUrl} alt="Image" width={150} height={150} className="rounded-lg w-fit" />
      </div>
    )
  }

  if (type === EMessageTypes.MEDIA && fileType === EMessageMediaTypes.VIDEO && mediaUrl) {
    return (
      <div className="relative">
        <video
          src={mediaUrl}
          className="rounded-lg w-fit"
          preload="metadata"
          style={{ maxWidth: "150px", maxHeight: "150px" }}
        />
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Play size={16} className="text-white ml-0.5" />
          </div>
        </div>
      </div>
    )
  }

  if (type === EMessageTypes.MEDIA && fileType === EMessageMediaTypes.AUDIO && mediaUrl) {
    return (
      <div className="flex items-center gap-3 p-3 bg-regular-hover-card-cl rounded-lg w-fit">
        {/* Play Button */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-white rounded-full border border-regular-violet-cl flex items-center justify-center">
            <Play size={16} className="text-regular-violet-cl ml-0.5" />
          </div>
        </div>

        {/* Audio Content */}
        <div className="flex-1 min-w-0">
          {/* Waveform */}
          <div className="flex items-center gap-1 mb-1">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="w-1 bg-regular-violet-cl bg-opacity-60 rounded-full"
                style={{
                  height: `${Math.random() * 20 + 8}px`,
                }}
              />
            ))}
          </div>

          {/* Time Display */}
          <div className="text-regular-white-cl text-xs">00:00 / 00:01</div>
        </div>
      </div>
    )
  }

  // Document/File message
  if (
    type === EMessageTypes.MEDIA &&
    fileType === EMessageMediaTypes.DOCUMENT &&
    mediaUrl &&
    fileName
  ) {
    return (
      <div className="flex items-center gap-2 p-2 bg-regular-hover-card-cl rounded-lg w-fit">
        <div className="text-regular-violet-cl">{getFileIcon(fileName)}</div>
        <div className="flex-1 min-w-0">
          <div
            className="text-regular-white-cl text-xs font-medium truncate [&_.STYLE-emoji-img]:w-3 [&_.STYLE-emoji-img]:h-3 [&_.STYLE-emoji-img]:inline-block [&_.STYLE-emoji-img]:align-text-bottom"
            dangerouslySetInnerHTML={{ __html: santizeMsgContent(fileName) }}
          />
          {/* {fileSize && (
            <div className="text-regular-text-secondary-cl text-xs">
              {formatBytes(fileSize)}
            </div>
          )} */}
        </div>
      </div>
    )
  }

  // Text message
  if (type === EMessageTypes.TEXT) {
    return (
      <div
        className="text-regular-white-cl text-xs whitespace-pre-wrap break-words [&_.STYLE-emoji-img]:w-3 [&_.STYLE-emoji-img]:h-3 [&_.STYLE-emoji-img]:inline-block [&_.STYLE-emoji-img]:align-text-bottom"
        dangerouslySetInnerHTML={{ __html: santizeMsgContent(content) }}
      />
    )
  }

  // Fallback for any other text content
  return (
    <div
      className="text-regular-white-cl text-xs whitespace-pre-wrap break-words [&_.STYLE-emoji-img]:w-3 [&_.STYLE-emoji-img]:h-3 [&_.STYLE-emoji-img]:inline-block [&_.STYLE-emoji-img]:align-text-bottom"
      dangerouslySetInnerHTML={{ __html: santizeMsgContent(content) }}
    />
  )
}

export const SelectMessageItem = ({
  message,
  user,
  isSelected,
  onSelect,
  disabled = false,
}: TSelectMessageItemProps) => {
  const messageTime = useMemo(() => {
    return dayjs(message?.createdAt).format("HH:mm")
  }, [message?.createdAt])

  const handleRadioChange = () => {
    if (!disabled) {
      onSelect(!isSelected)
    }
  }

  const isOwnMessage = message?.authorId === user?.id

  return (
    <div
      className={`flex items-start gap-2 transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
      onClick={handleRadioChange}
    >
      {/* Radio Button - Only show for other people's messages */}
      {!isOwnMessage && (
        <div className="flex-shrink-0 mt-1">
          <input
            type="radio"
            checked={isSelected}
            onChange={handleRadioChange}
            disabled={disabled}
            className="w-3 h-3 text-regular-violet-cl bg-regular-dark-gray-cl border-regular-hover-card-cl focus:ring-regular-violet-cl focus:ring-2"
          />
        </div>
      )}

      {/* Avatar - Only show for other people's messages */}
      {!isOwnMessage && (
        <div className="flex-shrink-0">
          <CustomAvatar
            src={message?.Author?.Profile?.avatar}
            imgSize={20}
            className="text-xs bg-regular-violet-cl"
            fallback={message?.Author?.Profile?.fullName?.[0] || "U"}
          />
        </div>
      )}

      {/* Message Content */}
      <div className={`flex-1 min-w-0 ${!isOwnMessage ? "" : "flex justify-end"}`}>
        {/* Message Content with compact styling */}
        <div
          className={`p-2 rounded-lg transition-colors w-fit ${
            isOwnMessage
              ? "bg-regular-violet-cl bg-opacity-10" // Light purple for own messages
              : isSelected
                ? "bg-regular-violet-cl bg-opacity-20" // Purple background when selected
                : "bg-regular-hover-card-cl" // Default background for other messages
          }`}
        >
          <Content
            content={message?.content || ""}
            stickerUrl={message?.Sticker?.imageUrl || null}
            mediaUrl={message?.Media?.url || null}
            type={message?.type || ""}
            fileName={message?.Media?.fileName || ""}
            fileType={message?.Media?.type || ""}
            fileSize={message?.Media?.fileSize || 0}
            message={message || ({} as TStateMessage)}
            user={user}
            isSender={message?.Author?.id === user.id}
          />
          {/* Time */}
          <div className="text-regular-text-secondary-cl text-xs mt-1">{messageTime}</div>
        </div>
      </div>
    </div>
  )
}
