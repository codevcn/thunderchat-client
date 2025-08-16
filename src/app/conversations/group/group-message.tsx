import { EMessageMediaTypes, EMessageTypes, ETimeFormats } from "@/utils/enums"
import { santizeMsgContent, highlightUrlsInText, processPinNoticeContent } from "@/utils/helpers"
import { EMessageStatus } from "@/utils/socket/enums"
import type { TUserWithoutPassword, TMessageFullInfo, TMessageMedia } from "@/utils/types/be-api"
import type { TStateMessage } from "@/utils/types/global"
import dayjs from "dayjs"
import {
  Check,
  CheckCheck,
  Quote,
  FileVideo,
  Paperclip,
  Mic,
  Pin,
  Share2,
  Download as DownloadIcon,
  RotateCw,
  MoreHorizontal,
  Download,
} from "lucide-react"
import Image from "next/image"
import { CSS_VARIABLES } from "@/configs/css-variables"
import VoiceMessage from "../../../components/voice-message/voice-message"
import React, { useState, forwardRef, useEffect } from "react"
import { toast } from "sonner"
import { DropdownMessage } from "@/components/materials/dropdown-message"
import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react-dom"
import { createPortal } from "react-dom"
import { ShareMessageModal } from "./share-message-modal"
import { FileService } from "@/services/file.service"
import { pinService } from "@/services/pin.service"

type TContentProps = {
  content: string
  stickerUrl: string | null
  type: string
  Media: TMessageMedia | null
  message?: TStateMessage
  user: TUserWithoutPassword
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
      if (!response.ok) throw new Error("Unable to download image")
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
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="top-0 left-0 right-0 bottom-0 z-10 absolute" onClick={onClose}></div>
      <div className="flex flex-col max-w-[90vw] max-h-[90vh] relative z-20">
        {/* Thanh nút chức năng trên cùng */}
        <div className="w-full flex flex-row items-center justify-end z-10 mb-4">
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
          </div>
        </div>
        <img
          src={imageUrl}
          alt="Zoomed image"
          className="max-w-[85vw] max-h-[80vh] object-contain rounded-lg"
          style={{ transform: `rotate(${rotation}deg)` }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}

type TFileIconProps = {
  fileTypeText: string
  onDownload: (e: React.MouseEvent<HTMLDivElement>) => void
}

const FileIcon = ({ fileTypeText, onDownload }: TFileIconProps) => {
  return (
    <div className="STYLE-file-icon" onClick={onDownload} title={fileTypeText}>
      <span className="STYLE-file-icon-extension">{fileTypeText}</span>
      <div className="STYLE-file-icon-download">
        <Download size={20} />
      </div>
      <div className="STYLE-file-icon-progress"></div>
    </div>
  )
}

const Content = ({ content, stickerUrl, type, Media, message, user }: TContentProps) => {
  const { url: mediaUrl, fileName, type: mediaType, fileSize } = Media || {}
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  if (message?.isDeleted) {
    const messageText = message.isViolated
      ? "This message has been recalled due to violation"
      : "This message has been deleted"

    return (
      <div
        className="max-w-full break-words whitespace-pre-wrap text-sm inline"
        dangerouslySetInnerHTML={{ __html: highlightUrlsInText(santizeMsgContent(messageText)) }}
      ></div>
    )
  }

  // Hiển thị ảnh
  if (type === EMessageTypes.MEDIA && mediaType === EMessageMediaTypes.IMAGE && mediaUrl) {
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
  if (type === EMessageTypes.MEDIA && mediaType === EMessageMediaTypes.VIDEO && mediaUrl) {
    return (
      <div className="max-w-[320px] h-[180px]">
        <video
          src={mediaUrl}
          controls
          className="rounded-lg max-w-full h-full"
          preload="metadata"
        />
      </div>
    )
  }
  // Hiển thị document
  if (type === EMessageTypes.MEDIA && mediaType === EMessageMediaTypes.DOCUMENT && mediaUrl) {
    const downloadFile = async (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      e.preventDefault()
      const fileIconEle = e.currentTarget
      try {
        const response = await FileService.downloadFile(mediaUrl, (loaded, total) => {
          const percent = Math.round((loaded * 100) / (total || 1))
          fileIconEle.classList.add("downloading")
          fileIconEle.querySelector(".STYLE-file-icon-progress")!.textContent = `${percent}%`
        })

        fileIconEle.classList.remove("downloading")
        fileIconEle.querySelector(".STYLE-file-icon-progress")!.textContent = ""

        // Tạo URL từ blob để tải
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement("a")
        link.href = url
        link.download = fileName || "file"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        fileIconEle.classList.remove("downloading")
        fileIconEle.querySelector(".STYLE-file-icon-progress")!.textContent = ""
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
        <div className="flex items-center gap-1.5 p-1 pb-0 rounded-lg">
          <FileIcon
            fileTypeText={mediaType || fileName?.split(".").pop()?.toUpperCase() || "Unknown"}
            onDownload={downloadFile}
          />
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium text-sm text-regular-white-cl">
              {fileName || "File"}
            </div>
            <div className="text-xs text-white/70 mt-1">{formatBytes(fileSize)}</div>
          </div>
        </div>
      </div>
    )
  }

  if (
    type === EMessageTypes.MEDIA &&
    mediaType === EMessageMediaTypes.AUDIO &&
    mediaUrl &&
    message
  ) {
    const isSender = user.id === message.authorId
    return <VoiceMessage audioUrl={mediaUrl} message={message} isSender={isSender} />
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
        dangerouslySetInnerHTML={{ __html: highlightUrlsInText(santizeMsgContent(content)) }}
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

const getReplyPreview = (replyTo: NonNullable<TMessageFullInfo["ReplyTo"]>) => {
  const { type, Media, Sticker, content, isDeleted, isViolated } = replyTo
  const mediaUrl = Media?.url
  const fileName = Media?.fileName
  const stickerUrl = Sticker?.imageUrl
  const mediaType = Media?.type

  // Nếu tin nhắn gốc đã bị thu hồi hoặc vi phạm, hiển thị thông báo tương ứng
  if (isDeleted) {
    const messageText = isViolated
      ? "This message has been recalled due to violation"
      : "This message has been deleted"
    return <span className="text-xs rounded mt-0.5 inline-block text-white/80">{messageText}</span>
  }

  // Nếu là ảnh
  if (type === EMessageTypes.MEDIA && mediaType === EMessageMediaTypes.IMAGE && mediaUrl) {
    return (
      <div className="flex items-center gap-2 rounded p-0.5 mt-0.5">
        <img src={mediaUrl} alt="img" className="object-cover h-8" />
      </div>
    )
  }
  // Nếu là audio
  if (type === EMessageTypes.MEDIA && mediaType === EMessageMediaTypes.AUDIO && mediaUrl) {
    return (
      <div className="flex items-center gap-2 mt-0.5">
        <Mic size={16} />
        <span className="text-xs rounded mt-0.5 inline-block">Voice message</span>
      </div>
    )
  }
  // Nếu là video
  if (type === EMessageTypes.MEDIA && mediaType === EMessageMediaTypes.VIDEO && mediaUrl) {
    return (
      <div className="flex items-center gap-2 mt-0.5">
        <FileVideo size={16} />
        <span className="text-xs rounded mt-0.5 inline-block">{fileName}</span>
      </div>
    )
  }
  // Nếu là file tài liệu
  if (type === EMessageTypes.MEDIA && mediaType === EMessageMediaTypes.DOCUMENT && mediaUrl) {
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

type TMessageProps = {
  message: TStateMessage
  user: TUserWithoutPassword
  stickyTime: string | null
  onReply: (msg: TStateMessage) => void
  isPinned: boolean
  onPinChange: (newState: boolean) => void
  pinnedCount: number
  onReplyPreviewClick?: (replyToId: number) => void
}

export const Message = forwardRef<HTMLDivElement, TMessageProps>(
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
      Media,
      Sticker,
      type,
      ReplyTo,
      groupChatId,
      isDeleted,
      isViolated,
      Author,
    } = message

    const msgTime = dayjs(createdAt).format(ETimeFormats.HH_mm)

    // Giả lập trạng thái đã ghim, sau này sẽ lấy từ props hoặc state
    const [loadingPin, setLoadingPin] = useState(false)

    const handlePinClick = async () => {
      if (loadingPin) return
      setLoadingPin(true)
      try {
        const response = await pinService.togglePinMessage(id, undefined, !isPinned, groupChatId)
        if ("success" in response) {
          onPinChange(false)
        } else {
          onPinChange(true)
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
              dangerouslySetInnerHTML={{ __html: processPinNoticeContent(content) }}
            ></div>
            {/* Nút xem nếu có ReplyTo và tin nhắn gốc chưa bị thu hồi */}
            {message.ReplyTo &&
              typeof message.ReplyTo.id !== "undefined" &&
              !message.ReplyTo.isDeleted &&
              !message.ReplyTo.isViolated && (
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
                className={
                  `${isNewMsg ? "animate-new-user-message -translate-x-[3.5rem] translate-y-[1rem] opacity-0" : ""} ` +
                  `${Sticker ? "" : message.isDeleted ? "bg-regular-violet-cl opacity-60 text-white" : "bg-regular-violet-cl"} ` +
                  "group relative max-w-[70%] w-max rounded-t-2xl rounded-bl-2xl py-1.5 pb-1 pl-2 pr-1"
                }
              >
                <div
                  className={
                    (showDropdown ? "flex" : "hidden") +
                    (isDeleted ? "" : " group-hover:flex") +
                    " items-end h-full absolute top-0 right-[calc(100%-5px)] pr-[20px]"
                  }
                >
                  <button
                    className="p-1 bg-white/20 rounded hover:scale-110 transition duration-200"
                    title="Reply to this message"
                    onClick={() => {
                      if (message && message.type !== EMessageTypes.PIN_NOTICE) {
                        onReply(message)
                      }
                    }}
                  >
                    <Quote size={14} />
                  </button>
                  {/* Nút chia sẻ */}
                  <button
                    className="p-1 ml-1 rounded hover:scale-110 transition duration-200 bg-white/20"
                    title="Share message"
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
                      />,
                      document.body
                    )}
                  <button
                    className={`p-1 ml-1 rounded hover:scale-110 transition duration-200 ${isPinned ? "bg-purple-400/80 text-purple-700" : "bg-white/20"}`}
                    title={
                      isPinned
                        ? "Unpin message"
                        : pinnedCount >= 5
                          ? "You have reached the limit of 5 pinned messages."
                          : "Pin message"
                    }
                    onClick={() => {
                      if (!isPinned && pinnedCount >= 5) {
                        toast.error(
                          "You have reached the limit of 5 pinned messages. Please unpin another message before pinning a new one."
                        )
                        return
                      }
                      handlePinClick()
                    }}
                    disabled={loadingPin}
                  >
                    <Pin size={14} fill={isPinned ? "#fff" : "none"} />
                  </button>
                  <button
                    ref={refs.setReference}
                    className="p-1 ml-1 rounded bg-white/20"
                    title="More actions"
                    onClick={handleShowDropdown}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {ReplyTo && !isDeleted && !isViolated && (
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
                  stickerUrl={Sticker?.imageUrl ?? null}
                  message={message}
                  Media={Media}
                  type={type}
                  user={user}
                />
                <div className="flex justify-end items-center gap-x-1 mt-1.5 w-full">
                  <span className="text-xs text-regular-creator-msg-time-cl leading-none">
                    {msgTime}
                  </span>
                  <div className="flex ml-0.5">
                    {status === EMessageStatus.SENT ? (
                      <span title="Sent">
                        <Check size={15} />
                      </span>
                    ) : (
                      status === EMessageStatus.SEEN && (
                        <span title="Seen">
                          <CheckCheck size={15} />
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Tin nhắn của đối phương
            <div
              className={`${isNewMsg || status === EMessageStatus.SENT ? "QUERY-unread-message" : ""} origin-left flex justify-start w-full`}
              data-msg-id={id}
            >
              <div
                className={
                  `group ${isNewMsg ? "animate-new-friend-message translate-x-[3.5rem] translate-y-[1rem] opacity-0" : ""} ` +
                  `${Sticker ? "" : isDeleted ? "bg-regular-dark-gray-cl opacity-60 text-white" : "w-max bg-regular-dark-gray-cl"} ` +
                  "max-w-[70%] rounded-t-2xl rounded-br-2xl pt-1.5 pb-1 px-2 relative"
                }
              >
                <div className="text-xs text-regular-violet-cl font-bold pb-1">
                  {Author.Profile.fullName}
                </div>
                <div
                  className={
                    (showDropdown ? "flex" : "hidden") +
                    (isDeleted ? "" : " group-hover:flex") +
                    " items-end h-full absolute top-0 left-[calc(100%-5px)] pl-[20px]"
                  }
                >
                  <button
                    className="p-1 bg-white/20 rounded hover:scale-110 transition duration-200"
                    title="Reply to this message"
                    onClick={() => {
                      if (message && message.type !== EMessageTypes.PIN_NOTICE) {
                        onReply(message)
                      }
                    }}
                  >
                    <Quote size={14} />
                  </button>
                  {/* Nút chia sẻ */}
                  <button
                    className="p-1 ml-1 rounded hover:scale-110 transition duration-200 bg-white/20"
                    title="Share message"
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
                      />,
                      document.body
                    )}
                  <button
                    className={`p-1 ml-1 rounded hover:scale-110 transition duration-200 ${isPinned ? "bg-regular-violet-cl text-regular-white-cl" : "bg-white/20"}`}
                    title={
                      isPinned
                        ? "Unpin message"
                        : pinnedCount >= 5
                          ? "You have reached the limit of 5 pinned messages."
                          : "Pin message"
                    }
                    onClick={() => {
                      if (!isPinned && pinnedCount >= 5) {
                        toast.error(
                          "You have reached the limit of 5 pinned messages. Please unpin another message before pinning a new one."
                        )
                        return
                      }
                      handlePinClick()
                    }}
                    disabled={loadingPin}
                  >
                    <Pin size={14} fill={isPinned ? "#fff" : "none"} />
                  </button>
                  <button
                    ref={refs.setReference}
                    className="p-1 ml-1 rounded bg-white/20"
                    title="More actions"
                    onClick={handleShowDropdown}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {ReplyTo && !isDeleted && !isViolated && (
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
                  stickerUrl={Sticker?.imageUrl ?? null}
                  type={type}
                  message={message}
                  Media={Media}
                  user={user}
                />
                <div className="flex justify-start items-center gap-x-1 mt-1.5 w-full">
                  <span className="text-xs text-regular-creator-msg-time-cl leading-none">
                    {msgTime}
                  </span>
                </div>
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
              canDelete={user.id === authorId && !isDeleted && !isViolated}
              messageId={message.id}
            />
          </div>
        )}
      </>
    )
  }
)
