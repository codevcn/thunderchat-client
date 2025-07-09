import { ETimeFormats } from "@/utils/enums"
import { santizeMsgContent } from "@/utils/helpers"
import { EMessageStatus } from "@/utils/socket/enums"
import type { TUserWithoutPassword } from "@/utils/types/be-api"
import type { TStateDirectMessage } from "@/utils/types/global"
import dayjs from "dayjs"
import {
  Check,
  CheckCheck,
  FileText,
  File,
  FileSpreadsheet,
  Presentation,
  FileCode,
} from "lucide-react"
import Image from "next/image"
import { CSS_VARIABLES } from "@/configs/css-variables"
import VoiceMessage from "../(voice-chat)/VoiceMessage"

type TContentProps = {
  content: string
  stickerUrl: string | null
  mediaUrl: string | null
  type: string
  fileName?: string
  fileType?: string
  fileSize?: number
  message?: TStateDirectMessage
}

const Content = ({
  content,
  stickerUrl,
  mediaUrl,
  type,
  fileName,
  fileType,
  fileSize,
  message,
}: TContentProps) => {
  // Hiển thị ảnh
  if (type === "IMAGE" && mediaUrl) {
    return (
      <div className="max-w-xs">
        <Image
          src={mediaUrl}
          alt="sent image"
          width={300}
          height={200}
          className="rounded-lg"
          priority
        />
      </div>
    )
  }

  // Hiển thị video
  if (type === "VIDEO" && mediaUrl) {
    return (
      <div className="max-w-xs">
        <video src={mediaUrl} controls className="rounded-lg max-w-full" preload="metadata" />
      </div>
    )
  }

  // Hiển thị document
  if (type === "DOCUMENT" && mediaUrl) {
    const getFileIcon = (fileName: string) => {
      const ext = fileName.split(".").pop()?.toLowerCase()
      const iconClass = "w-8 h-8"

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

    const formatBytes = (bytes?: number) => {
      if (!bytes) return ""
      if (bytes < 1024) return bytes + " B"
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
      return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    }

    return (
      <div className="max-w-xs">
        <a
          href={mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          {getFileIcon(fileName || "document")}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {fileName || "Tệp tài liệu"}
            </div>
            <div className="text-xs text-gray-300">
              {formatBytes(fileSize)} • {fileName?.split(".").pop()?.toUpperCase() || "FILE"}
            </div>
          </div>
        </a>
      </div>
    )
  }

  if (type === "AUDIO" && mediaUrl && message) {
    return <VoiceMessage audioUrl={mediaUrl} message={message} />
  }

  // Hiển thị sticker
  if (stickerUrl) {
    return (
      <Image
        src={stickerUrl}
        alt="sticker"
        width={CSS_VARIABLES.STICKER.WIDTH}
        height={CSS_VARIABLES.STICKER.HEIGHT}
        priority
      />
    )
  }

  // Hiển thị text
  if (content) {
    return (
      <div
        className="max-w-full break-words whitespace-pre-wrap text-sm inline"
        dangerouslySetInnerHTML={{ __html: santizeMsgContent(content) }}
      ></div>
    )
  }

  return <></>
}

type TStickyTimeProps = {
  stickyTime: string
}

const StickyTime = ({ stickyTime }: TStickyTimeProps) => {
  return (
    <div className="flex w-full py-2 text-regular-text-secondary-cl">
      <div className="m-auto py-0.5 px-1 cursor-pointer font-bold">{stickyTime}</div>
    </div>
  )
}

type TMessageProps = {
  message: TStateDirectMessage
  user: TUserWithoutPassword
  stickyTime: string | null
}

export const Message = ({ message, user, stickyTime }: TMessageProps) => {
  const {
    authorId,
    content,
    createdAt,
    isNewMsg,
    id,
    status,
    stickerUrl,
    mediaUrl,
    type,
    fileName,
    fileType,
    fileSize,
  } = message

  const msgTime = dayjs(createdAt).format(ETimeFormats.HH_mm)

  return (
    <>
      {stickyTime && <StickyTime stickyTime={stickyTime} />}

      <div className="w-full text-regular-white-cl">
        {user.id === authorId ? (
          <div className={`QUERY-user-message-${id} flex justify-end w-full`}>
            <div
              className={`${isNewMsg ? "animate-new-user-message -translate-x-[3.5rem] translate-y-[1rem] opacity-0" : ""} ${stickerUrl ? "" : "bg-regular-violet-cl"} max-w-[70%] w-max rounded-t-2xl rounded-bl-2xl py-1.5 pb-1 pl-2 pr-1`}
            >
              <Content
                content={content}
                stickerUrl={stickerUrl ?? null}
                mediaUrl={mediaUrl ?? null}
                type={type}
                fileName={fileName}
                fileType={fileType}
                fileSize={fileSize}
                message={message}
              />
              <div className="flex justify-end items-center gap-x-1 mt-1.5 w-full">
                <span className="text-xs text-regular-creator-msg-time-cl leading-none">
                  {msgTime}
                </span>
                <div className="flex ml-0.5">
                  {status === EMessageStatus.SENT ? (
                    <Check size={15} />
                  ) : (
                    status === EMessageStatus.SEEN && <CheckCheck size={15} />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`${isNewMsg || status === EMessageStatus.SENT ? "QUERY-unread-message" : ""} origin-left flex justify-start w-full`}
            data-msg-id={id}
          >
            <div
              className={`${isNewMsg ? "animate-new-friend-message translate-x-[3.5rem] translate-y-[1rem] opacity-0" : ""} ${stickerUrl ? "" : "w-max bg-regular-dark-gray-cl"} max-w-[70%] rounded-t-2xl rounded-br-2xl pt-1.5 pb-1 px-2 relative`}
            >
              <Content
                content={content}
                stickerUrl={stickerUrl ?? null}
                mediaUrl={mediaUrl ?? null}
                type={type}
                fileName={fileName}
                fileType={fileType}
                fileSize={fileSize}
                message={message}
              />
              <div className="flex justify-end items-center mt-1.5">
                <span className="text-xs text-regular-creator-msg-time-cl">{msgTime}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
