import { EMessageTypes, ETimeFormats } from "@/utils/enums"
import { santizeMsgContent } from "@/utils/helpers"
import { EMessageStatus } from "@/utils/socket/enums"
import type {
  TDirectMessageWithAuthor,
  TUserWithoutPassword,
  TGetFriendsData,
} from "@/utils/types/be-api"
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
  Quote,
  FileVideo,
  Paperclip,
  Mic,
  Pin,
  Share2,
  Download as DownloadIcon,
  RotateCw,
  MoreHorizontal,
  X as CloseIcon,
} from "lucide-react"
import Image from "next/image"
import { CSS_VARIABLES } from "@/configs/css-variables"
import VoiceMessage from "../(voice-chat)/VoiceMessage"
import React, { useState, forwardRef, useEffect, useRef } from "react"
import { pinService } from "@/services/pin.service"
import { toast } from "sonner"
import { DropdownMessage } from "@/components/materials/dropdown-message"
import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react-dom"
import { createPortal } from "react-dom"
import ActionIcons from "@/components/materials/action-icons"
import { ShareMessageModal } from "./ShareMessageModal"
import { directChatService } from "@/services/direct-chat.service"
import { chattingService } from "@/services/chatting.service"
import { useUser } from "@/hooks/user"
import { clientSocket } from "@/utils/socket/client-socket"

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

const ImageModal = ({
  imageUrl,
  isOpen,
  onClose,
}: {
  imageUrl: string
  isOpen: boolean
  onClose: () => void
}) => {
  const [rotation, setRotation] = useState(0)

  if (!isOpen) return null

  // Tải ảnh
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(imageUrl)
      if (!response.ok) throw new Error("Không thể tải ảnh")
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = "image.jpg"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error("Lỗi khi tải ảnh:", error)
      // Fallback: cách cũ
      const link = document.createElement("a")
      link.href = imageUrl
      link.download = "image.jpg"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Xoay ảnh
  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRotation((r) => (r + 90) % 360)
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]">
        {/* Thanh nút chức năng trên cùng */}
        <div className="absolute -top-12 left-0 w-full flex flex-row items-center justify-end z-10 px-2">
          {/* Nhóm nút chức năng */}
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors flex items-center justify-center"
              title="Tải xuống ảnh"
            >
              <DownloadIcon size={22} />
            </button>
            <button
              onClick={handleRotate}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors flex items-center justify-center"
              title="Xoay ảnh"
            >
              <RotateCw size={22} />
            </button>
            <button
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors flex items-center justify-center"
              title="Tùy chọn khác"
              tabIndex={-1}
            >
              <MoreHorizontal size={22} />
            </button>
          </div>
        </div>
        <img
          src={imageUrl}
          alt="Zoomed image"
          className="max-w-full max-h-full object-contain rounded-l min-h-[300px] max-h-[90vh]"
          style={{ transform: `rotate(${rotation}deg)` }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
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
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  if (message?.isDeleted) {
    return (
      <div
        className="max-w-full break-words whitespace-pre-wrap text-sm inline"
        dangerouslySetInnerHTML={{ __html: santizeMsgContent("Tin nhắn này đã được thu hồi") }}
      ></div>
    )
  }

  // Hiển thị ảnh
  if (type === EMessageTypes.IMAGE && mediaUrl) {
    return (
      <>
        <div className="max-w-xs relative group">
          <Image
            src={mediaUrl}
            alt="sent image"
            width={300}
            height={200}
            className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
            priority
            onClick={() => setIsImageModalOpen(true)}
          />
          {/* XÓA NÚT TẢI XUỐNG Ở ĐÂY */}
        </div>
        {createPortal(
          <ImageModal
            imageUrl={mediaUrl}
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
          />,
          document.body
        )}
      </>
    )
  }

  // Hiển thị video
  if (type === EMessageTypes.VIDEO && mediaUrl) {
    return (
      <div className="max-w-xs">
        <video src={mediaUrl} controls className="rounded-lg max-w-full" preload="metadata" />
      </div>
    )
  }

  // Hiển thị document
  if (type === EMessageTypes.DOCUMENT && mediaUrl) {
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
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors">
          {getFileIcon(fileName || "document")}
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium text-sm text-blue-400">
              {fileName || "Tệp tin"}
            </div>
            <div className="text-xs text-gray-400">{formatBytes(fileSize)}</div>
          </div>
          {/* Nút tải xuống */}
          <button
            type="button"
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Tải xuống file"
            onClick={async (e) => {
              e.preventDefault()
              e.stopPropagation()

              try {
                // Fetch file từ S3
                const response = await fetch(mediaUrl)
                if (!response.ok) throw new Error("Không thể tải file")

                // Tạo blob từ response
                const blob = await response.blob()

                // Tạo URL cho blob
                const blobUrl = window.URL.createObjectURL(blob)

                // Tạo thẻ a để tải file
                const link = document.createElement("a")
                link.href = blobUrl

                // Đảm bảo tên file có extension
                const fileNameWithExt = fileName || "document"
                const hasExtension = fileNameWithExt.includes(".")
                const finalFileName = hasExtension
                  ? fileNameWithExt
                  : `${fileNameWithExt}.${fileType || "pdf"}`

                link.download = finalFileName

                // Thêm vào DOM, click và xóa
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)

                // Giải phóng blob URL
                window.URL.revokeObjectURL(blobUrl)
              } catch (error) {
                console.error("Lỗi khi tải file:", error)
                // Fallback: thử cách cũ
                const link = document.createElement("a")
                link.href = mediaUrl
                const fileNameWithExt = fileName || "document"
                const hasExtension = fileNameWithExt.includes(".")
                const finalFileName = hasExtension
                  ? fileNameWithExt
                  : `${fileNameWithExt}.${fileType || "pdf"}`
                link.download = finalFileName
                link.target = "_blank"
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }
            }}
          >
            {/* Download icon */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  if (type === EMessageTypes.AUDIO && mediaUrl && message) {
    return <VoiceMessage audioUrl={mediaUrl} message={message} />
  }

  // Hiển thị sticker
  if (type === EMessageTypes.STICKER && stickerUrl) {
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
  if (type === EMessageTypes.TEXT && content) {
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
  onReply: (msg: TStateDirectMessage) => void
  isPinned: boolean
  onPinChange: (newState: boolean) => void
  pinnedCount: number
}

const getReplyPreview = (replyTo: TDirectMessageWithAuthor) => {
  const { type, mediaUrl, fileName, stickerUrl, content } = replyTo

  // Nếu là ảnh
  if (type === EMessageTypes.IMAGE && mediaUrl) {
    return (
      <div className="flex items-center gap-2 rounded p-0.5 mt-0.5">
        <img src={mediaUrl} alt="img" className="object-cover h-8" />
      </div>
    )
  }
  // Nếu là audio
  if (type === EMessageTypes.AUDIO && mediaUrl) {
    return (
      <div className="flex items-center gap-2 mt-0.5">
        <Mic size={16} />
        <span className="text-xs rounded mt-0.5 inline-block">Voice message</span>
      </div>
    )
  }
  // Nếu là video
  if (type === EMessageTypes.VIDEO && mediaUrl) {
    return (
      <div className="flex items-center gap-2 mt-0.5">
        <FileVideo size={16} />
        <span className="text-xs rounded mt-0.5 inline-block">{fileName}</span>
      </div>
    )
  }
  // Nếu là file tài liệu
  if (type === EMessageTypes.DOCUMENT && fileName) {
    return (
      <div className="flex items-center gap-2 mt-0.5">
        <Paperclip size={16} />
        <span className="text-xs rounded mt-0.5 inline-block">{fileName}</span>
      </div>
    )
  }
  // Nếu là sticker
  if (type === EMessageTypes.STICKER && stickerUrl) {
    return (
      <div className="flex items-center gap-2 rounded p-0.5 mt-0.5">
        <Image src={stickerUrl} alt="sticker" width={32} height={32} className="object-cover" />
      </div>
    )
  }
  // Nếu là emoji (có thẻ <img ...> hoặc <svg ...> ở bất kỳ đâu)
  if (content) {
    return (
      <span
        className="text-xs rounded mt-0.5 inline-block"
        dangerouslySetInnerHTML={{ __html: santizeMsgContent(content) }}
      />
    )
  }

  return <></>
}

export const Message = forwardRef<
  HTMLDivElement,
  TMessageProps & { onReplyPreviewClick?: (replyToId: number) => void }
>(
  (
    { message, user, stickyTime, onReply, isPinned, onPinChange, pinnedCount, onReplyPreviewClick },
    ref
  ) => {
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
      ReplyTo,
    } = message

    const msgTime = dayjs(createdAt).format(ETimeFormats.HH_mm)

    // Giả lập trạng thái đã ghim, sau này sẽ lấy từ props hoặc state
    const [loadingPin, setLoadingPin] = useState(false)

    const handlePinClick = async () => {
      if (loadingPin) return
      setLoadingPin(true)
      try {
        const response = await pinService.togglePinMessage(
          message.id,
          message.directChatId,
          !isPinned
        )

        // Xử lý response dựa trên loại response
        if ("success" in response) {
          // Bỏ ghim thành công
          onPinChange(false)
          toast.success("Đã bỏ ghim tin nhắn")
        } else {
          // Ghim thành công
          onPinChange(true)
          toast.success("Đã ghim tin nhắn")
        }
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || "Lỗi khi ghim/bỏ ghim"
        toast.error(errorMessage)
      } finally {
        setLoadingPin(false)
      }
    }

    // Hiển thị thông báo đặc biệt cho PIN_NOTICE
    if (type === EMessageTypes.PIN_NOTICE) {
      const isUnpin = content?.toLowerCase().includes("bỏ ghim")
      return (
        <div className="w-full flex justify-center my-2">
          <div className="flex items-center gap-2 bg-[#232323] border border-[#333] text-white px-4 py-2 rounded-full text-sm font-medium shadow">
            <span className="relative inline-block w-4 h-4">
              {isUnpin ? (
                <Pin className="w-4 h-4 text-gray-400 opacity-70 rotate-[45deg]" />
              ) : (
                <Pin className="w-4 h-4" />
              )}
            </span>
            <div
              className="max-w-[300px] text-sm truncate"
              dangerouslySetInnerHTML={{ __html: santizeMsgContent(content) }}
            ></div>
            {/* Nút xem nếu có ReplyTo */}
            {message.ReplyTo && typeof message.ReplyTo.id !== "undefined" && (
              <button
                className="ml-2 px-1 py-0.5 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
                onClick={() => {
                  if (message.ReplyTo && onReplyPreviewClick)
                    onReplyPreviewClick(message.ReplyTo.id)
                }}
              >
                Xem
              </button>
            )}
          </div>
        </div>
      )
    }

    // Hàm scroll tới message theo id và highlight
    const scrollToMessage = (msgId: string) => {
      const el = document.querySelector(`.QUERY-message-container-${msgId}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        const overlay = el.querySelector(".QUERY-message-container-overlay")
        if (overlay) {
          overlay.classList.add("!opacity-100")
          setTimeout(() => {
            overlay.classList.remove("!opacity-100")
          }, 1200)
        }
      }
    }

    const [showDropdown, setShowDropdown] = useState(false)
    const { refs, floatingStyles, update } = useFloating({
      placement: "bottom-end",
      middleware: [
        offset(4),
        flip({ fallbackPlacements: ["top-end", "bottom-end"] }),
        shift({ padding: 8 }),
      ],
      whileElementsMounted: autoUpdate,
    })
    const popupRef = refs.floating

    // Đóng popup khi click ra ngoài
    useEffect(() => {
      if (!showDropdown) return
      const handleClick = (e: MouseEvent) => {
        const floatingEl = refs.floating.current
        const referenceEl = refs.reference.current
        const isRefEl = referenceEl instanceof HTMLElement
        if (
          floatingEl &&
          !floatingEl.contains(e.target as Node) &&
          (!isRefEl || !referenceEl.contains(e.target as Node))
        ) {
          setShowDropdown(false)
        }
      }
      document.addEventListener("mousedown", handleClick)
      return () => document.removeEventListener("mousedown", handleClick)
    }, [showDropdown, refs])

    const handleShowDropdown = (e: React.MouseEvent) => {
      e.stopPropagation()
      setShowDropdown(true)
      setTimeout(update, 0)
    }
    const handleCloseDropdown = () => setShowDropdown(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const reactUser = useUser() // Đặt ở đầu component

    return (
      <>
        {stickyTime && <StickyTime stickyTime={stickyTime} />}

        <div
          ref={ref}
          className={`QUERY-message-container-${id} w-full text-regular-white-cl relative z-10`}
        >
          <div className="QUERY-message-container-overlay opacity-0 bg-purple-400/20 absolute top-0 left-1/2 -translate-x-1/2 w-screen h-full -z-10"></div>
          {user.id === authorId ? (
            <div className={`QUERY-user-message-${id} flex justify-end w-full`} data-msg-id={id}>
              <div
                className={`${isNewMsg ? "animate-new-user-message -translate-x-[3.5rem] translate-y-[1rem] opacity-0" : ""} ${stickerUrl ? "" : "bg-regular-violet-cl"} group relative max-w-[70%] w-max rounded-t-2xl rounded-bl-2xl py-1.5 pb-1 pl-2 pr-1`}
              >
                <div
                  className={
                    (showDropdown ? "flex" : "group-hover:flex hidden") +
                    " items-end h-full absolute top-0 right-[calc(100%-5px)] pr-[20px]"
                  }
                >
                  <button
                    className="p-1 bg-white/20 rounded hover:scale-110 transition duration-200"
                    title="Reply to this message"
                    onClick={() => {
                      if (message && message.type !== "PIN_NOTICE") {
                        console.log("[DEBUG] Reply button clicked", message)
                        onReply(message)
                      }
                    }}
                  >
                    <Quote size={14} />
                  </button>
                  {/* Nút chia sẻ */}
                  <button
                    className="p-1 ml-1 rounded hover:scale-110 transition duration-200 bg-white/20"
                    title="Chia sẻ tin nhắn"
                    onClick={() => setShowShareModal(true)}
                  >
                    <Share2 size={14} />
                  </button>
                  {/* Modal chia sẻ - render qua portal */}
                  {showShareModal &&
                    createPortal(
                      <ShareMessageModal
                        open={showShareModal}
                        onClose={() => setShowShareModal(false)}
                        messageToShare={message}
                        onSelectConversation={async (conversation: any) => {
                          // Logic đã được xử lý trong ShareMessageModal
                        }}
                      />,
                      document.body
                    )}
                  <button
                    className={`p-1 ml-1 rounded hover:scale-110 transition duration-200 ${isPinned ? "bg-purple-400/80 text-purple-700" : "bg-white/20"}`}
                    title={
                      isPinned
                        ? "Bỏ ghim tin nhắn"
                        : pinnedCount >= 5
                          ? "Đã đạt giới hạn 5 tin nhắn ghim"
                          : "Ghim tin nhắn"
                    }
                    onClick={() => {
                      if (!isPinned && pinnedCount >= 5) {
                        toast.error(
                          "Đã đạt giới hạn 5 tin nhắn ghim. Vui lòng bỏ ghim một tin nhắn khác trước khi ghim tin nhắn mới."
                        )
                        return
                      }
                      handlePinClick()
                    }}
                    disabled={loadingPin}
                  >
                    <Pin size={14} fill={isPinned ? "#facc15" : "none"} />
                  </button>
                  <button
                    ref={refs.setReference}
                    className="p-1 ml-1 rounded hover:scale-110 transition duration-200 bg-white/20"
                    title="More actions"
                    onClick={handleShowDropdown}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {ReplyTo && (
                  <div
                    data-reply-to-id={ReplyTo.id}
                    className="QUERY-reply-preview rounded-lg bg-white/20 border-l-4 border-white px-2 py-1 mb-1.5 cursor-pointer hover:bg-white/30 transition-colors"
                    onClick={() => {
                      if (ReplyTo) {
                        if (onReplyPreviewClick) onReplyPreviewClick(ReplyTo.id)
                      }
                    }}
                  >
                    <div className="font-bold text-sm text-white truncate">
                      {ReplyTo.Author.Profile.fullName}
                    </div>
                    <div className="text-xs text-white break-words truncate max-w-full">
                      {getReplyPreview(ReplyTo)}
                    </div>
                  </div>
                )}
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
                className={`group ${isNewMsg ? "animate-new-friend-message translate-x-[3.5rem] translate-y-[1rem] opacity-0" : ""} ${stickerUrl ? "" : "w-max bg-regular-dark-gray-cl"} max-w-[70%] rounded-t-2xl rounded-br-2xl pt-1.5 pb-1 px-2 relative`}
              >
                <div
                  className={
                    (showDropdown ? "flex" : "group-hover:flex hidden") +
                    " items-end h-full absolute top-0 left-[calc(100%-5px)] pl-[20px]"
                  }
                >
                  <button
                    className="p-1 bg-white/20 rounded hover:scale-110 transition duration-200"
                    title="Reply to this message"
                    onClick={() => {
                      if (message && message.type !== "PIN_NOTICE") {
                        console.log("[DEBUG] Reply button clicked", message)
                        onReply(message)
                      }
                    }}
                  >
                    <Quote size={14} />
                  </button>
                  {/* Nút chia sẻ */}
                  <button
                    className="p-1 ml-1 rounded hover:scale-110 transition duration-200 bg-white/20"
                    title="Chia sẻ tin nhắn"
                    onClick={() => setShowShareModal(true)}
                  >
                    <Share2 size={14} />
                  </button>
                  {/* Modal chia sẻ - render qua portal */}
                  {showShareModal &&
                    createPortal(
                      <ShareMessageModal
                        open={showShareModal}
                        onClose={() => setShowShareModal(false)}
                        messageToShare={message}
                        onSelectConversation={async (conversation: any) => {
                          // Logic đã được xử lý trong ShareMessageModal
                        }}
                      />,
                      document.body
                    )}
                  <button
                    className={`p-1 ml-1 rounded hover:scale-110 transition duration-200 ${isPinned ? "bg-yellow-400/80 text-yellow-700" : "bg-white/20"}`}
                    title={
                      isPinned
                        ? "Bỏ ghim tin nhắn"
                        : pinnedCount >= 5
                          ? "Đã đạt giới hạn 5 tin nhắn ghim"
                          : "Ghim tin nhắn"
                    }
                    onClick={() => {
                      if (!isPinned && pinnedCount >= 5) {
                        toast.error(
                          "Đã đạt giới hạn 5 tin nhắn ghim. Vui lòng bỏ ghim một tin nhắn khác trước khi ghim tin nhắn mới."
                        )
                        return
                      }
                      handlePinClick()
                    }}
                    disabled={loadingPin}
                  >
                    <Pin size={14} fill={isPinned ? "#facc15" : "none"} />
                  </button>
                  <button
                    ref={refs.setReference}
                    className="p-1 ml-1 rounded hover:scale-110 transition duration-200 bg-white/20"
                    title="More actions"
                    onClick={handleShowDropdown}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {ReplyTo && (
                  <div
                    data-reply-to-id={ReplyTo.id}
                    className="QUERY-reply-preview rounded-lg bg-white/20 border-l-4 border-white px-2 py-1 mb-1.5 cursor-pointer hover:bg-white/30 transition-colors"
                    onClick={() =>
                      onReplyPreviewClick
                        ? onReplyPreviewClick(ReplyTo.id)
                        : scrollToMessage(String(ReplyTo.id))
                    }
                  >
                    <div className="font-bold text-sm text-white truncate">
                      {ReplyTo.Author.Profile.fullName}
                    </div>
                    <div className="text-xs text-white break-words truncate max-w-full">
                      {getReplyPreview(ReplyTo)}
                    </div>
                  </div>
                )}
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
              </div>
            </div>
          )}
        </div>
        {showDropdown && (
          <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 9999 }}>
            <DropdownMessage
              onPin={() => {
                handlePinClick()
                handleCloseDropdown()
              }}
              isPinned={isPinned}
              onClose={handleCloseDropdown}
              content={content}
              isTextMessage={type === "TEXT"}
              canDelete={user.id === authorId && !message.isDeleted}
              messageId={message.id}
            />
          </div>
        )}
      </>
    )
  }
)
