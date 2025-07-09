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
import { useState } from "react"

type TContentProps = {
  content: string
  stickerUrl: string | null
  mediaUrl: string | null
  type: string
  fileName?: string
  fileType?: string
  fileSize?: number
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]">
        {/* Nút chức năng */}
        <div className="absolute -top-12 right-0 flex gap-2 z-10">
          {/* Download */}
          <button
            onClick={handleDownload}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            title="Tải xuống ảnh"
          >
            {/* Download icon */}
            <svg
              width="22"
              height="22"
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
          {/* Rotate */}
          <button
            onClick={handleRotate}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            title="Xoay ảnh"
          >
            {/* Rotate icon */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 2v6h-6" />
              <path d="M3 13a9 9 0 0 1 14.5-7.5L21 8" />
              <path d="M21 8v2" />
            </svg>
          </button>
          {/* More (3 dots) */}
          <button
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            title="Tùy chọn khác"
            tabIndex={-1}
          >
            {/* Dots icon */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
              <circle cx="5" cy="12" r="1.5" />
            </svg>
          </button>
        </div>
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute -top-12 left-0 text-white hover:text-gray-300 transition-colors z-10"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <Image
          src={imageUrl}
          alt="Zoomed image"
          width={800}
          height={600}
          className="max-w-full max-h-full object-contain rounded-lg"
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
}: TContentProps) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  // Hiển thị ảnh
  if (type === "IMAGE" && mediaUrl) {
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
          {/* Nút tải xuống ảnh */}
          <button
            type="button"
            className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white rounded-full shadow transition-colors opacity-0 group-hover:opacity-100"
            title="Tải xuống ảnh"
            onClick={async (e) => {
              e.stopPropagation()

              try {
                // Fetch ảnh từ S3
                const response = await fetch(mediaUrl)
                if (!response.ok) throw new Error("Không thể tải ảnh")

                // Tạo blob từ response
                const blob = await response.blob()

                // Tạo URL cho blob
                const blobUrl = window.URL.createObjectURL(blob)

                // Tạo thẻ a để tải ảnh
                const link = document.createElement("a")
                link.href = blobUrl

                // Đảm bảo tên file có extension
                const fileNameWithExt = fileName || "image"
                const hasExtension = fileNameWithExt.includes(".")
                const finalFileName = hasExtension
                  ? fileNameWithExt
                  : `${fileNameWithExt}.${fileType || "jpg"}`

                link.download = finalFileName

                // Thêm vào DOM, click và xóa
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)

                // Giải phóng blob URL
                window.URL.revokeObjectURL(blobUrl)
              } catch (error) {
                console.error("Lỗi khi tải ảnh:", error)
                // Fallback: thử cách cũ
                const link = document.createElement("a")
                link.href = mediaUrl
                const fileNameWithExt = fileName || "image"
                const hasExtension = fileNameWithExt.includes(".")
                const finalFileName = hasExtension
                  ? fileNameWithExt
                  : `${fileNameWithExt}.${fileType || "jpg"}`
                link.download = finalFileName
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
        <ImageModal
          imageUrl={mediaUrl}
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
        />
      </>
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
    // Nếu là HTML có <img> hoặc <svg> thì render HTML, còn lại render text thường
    if (/<img|<svg/.test(content)) {
      const cleanContent = keepOnlyImgTags(santizeMsgContent(content))
      return (
        <div
          className="max-w-full break-words whitespace-pre-wrap text-sm inline"
          dangerouslySetInnerHTML={{ __html: cleanContent }}
        ></div>
      )
    } else {
      // Render text thường
      return (
        <div className="max-w-full break-words whitespace-pre-wrap text-sm inline">{content}</div>
      )
    }
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

// Hàm lọc chỉ giữ lại thẻ <img>, loại bỏ mọi thẻ khác
function keepOnlyImgTags(html: string) {
  // Tạo một div tạm để parse HTML
  const div = document.createElement("div")
  div.innerHTML = html

  // Lấy tất cả thẻ img
  const imgElements = div.querySelectorAll("img")

  // Tạo HTML mới chỉ chứa các thẻ img
  let result = ""
  imgElements.forEach((img) => {
    result += img.outerHTML
  })

  return result
}

// Hàm loại bỏ HTML, chỉ lấy text thuần
function stripHtml(html: string): string {
  if (!html) return ""
  const div = document.createElement("div")
  div.innerHTML = html
  return div.textContent || div.innerText || ""
}

type TMessageProps = {
  message: TStateDirectMessage
  user: TUserWithoutPassword
  stickyTime: string | null
  onReply: (msg: TStateDirectMessage) => void
}

const getReplyPreview = (replyTo: any) => {
  if (!replyTo) return null

  // Hàm scroll đến tin nhắn gốc
  const scrollToOriginalMessage = () => {
    console.log("🔄 CLICK REPLY PREVIEW - Scroll to original message")
    console.log("replyTo:", replyTo)
    console.log("replyTo.id:", replyTo.id)
    console.log("Looking for element with data-msg-id:", replyTo.id)

    const originalMessageElement = document.querySelector(`[data-msg-id="${replyTo.id}"]`)
    console.log("Found element:", originalMessageElement)

    if (originalMessageElement) {
      console.log("✅ Element found, scrolling to it...")
      originalMessageElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
      // Thêm highlight tạm thời
      originalMessageElement.classList.add("bg-yellow-100", "transition-colors", "duration-300")
      setTimeout(() => {
        originalMessageElement.classList.remove("bg-yellow-100")
      }, 2000)
      console.log("✅ Scroll and highlight completed")
    } else {
      console.log("❌ Element not found with data-msg-id:", replyTo.id)
      console.log("Available elements with data-msg-id:")
      const allMsgElements = document.querySelectorAll("[data-msg-id]")
      allMsgElements.forEach((el) => {
        console.log("- data-msg-id:", el.getAttribute("data-msg-id"))
      })
    }
  }

  // Nếu là ảnh
  if (replyTo.type === "IMAGE" && replyTo.mediaUrl) {
    return (
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors"
        onClick={scrollToOriginalMessage}
      >
        <div className="w-8 h-8 rounded overflow-hidden bg-gray-200 flex-shrink-0">
          <Image
            src={replyTo.mediaUrl}
            alt="img"
            width={32}
            height={32}
            className="object-cover w-full h-full"
          />
        </div>
        <span className="truncate text-xs text-gray-600">[Ảnh]</span>
      </div>
    )
  }
  // Nếu là video
  if (replyTo.type === "VIDEO" && replyTo.mediaUrl) {
    return (
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors"
        onClick={scrollToOriginalMessage}
      >
        <div className="w-8 h-8 rounded overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center">
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <span className="truncate text-xs text-gray-600">[Video]</span>
      </div>
    )
  }
  // Nếu là file tài liệu
  if (replyTo.type === "DOCUMENT" && replyTo.fileName) {
    return (
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors"
        onClick={scrollToOriginalMessage}
      >
        <div className="w-8 h-8 rounded overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center">
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="14" height="14" rx="2" />
            <path d="M7 7h6M7 11h6M7 15h2" />
          </svg>
        </div>
        <span className="truncate text-xs text-gray-600">{replyTo.fileName}</span>
      </div>
    )
  }
  // Nếu là sticker
  if (replyTo.stickerUrl) {
    return (
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors"
        onClick={scrollToOriginalMessage}
      >
        <div className="w-8 h-8 rounded overflow-hidden bg-gray-200 flex-shrink-0">
          <Image
            src={replyTo.stickerUrl}
            alt="sticker"
            width={32}
            height={32}
            className="object-cover w-full h-full"
          />
        </div>
        <span className="truncate text-xs text-gray-600">[Sticker]</span>
      </div>
    )
  }
  // Nếu là emoji (có thẻ <img ...> hoặc <svg ...> ở bất kỳ đâu)
  if (replyTo.content && (replyTo.content.includes("<img") || replyTo.content.includes("<svg"))) {
    const cleanContent = keepOnlyImgTags(replyTo.content)
    return (
      <span
        className="text-xs cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors inline-block"
        dangerouslySetInnerHTML={{ __html: cleanContent }}
        onClick={scrollToOriginalMessage}
      />
    )
  }
  // Nếu là text hoặc HTML khác
  const plain = stripHtml(replyTo.content)
  return (
    <span
      className="truncate text-xs text-gray-600 cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors inline-block"
      onClick={scrollToOriginalMessage}
    >
      {plain || "[Không có nội dung]"}
    </span>
  )
}

export const Message = ({ message, user, stickyTime, onReply }: TMessageProps) => {
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
    replyTo,
  } = message

  const msgTime = dayjs(createdAt).format(ETimeFormats.HH_mm)

  return (
    <>
      {stickyTime && <StickyTime stickyTime={stickyTime} />}

      <div className="w-full text-regular-white-cl">
        {user.id === authorId ? (
          <div className={`QUERY-user-message-${id} flex justify-end w-full`} data-msg-id={id}>
            <div
              className={`${isNewMsg ? "animate-new-user-message -translate-x-[3.5rem] translate-y-[1rem] opacity-0" : ""} ${stickerUrl ? "" : "bg-regular-violet-cl"} max-w-[70%] w-max rounded-t-2xl rounded-bl-2xl py-1.5 pb-1 pl-2 pr-1`}
            >
              {replyTo && (
                <div
                  className="rounded-lg bg-[#e6f0fa] border-l-4 border-blue-500 px-3 py-2 mb-1"
                  style={{ minWidth: 0 }}
                >
                  <div className="font-bold text-sm text-blue-900 truncate">
                    {replyTo.senderName || "User"}
                  </div>
                  <div
                    className="text-xs text-gray-600 break-words truncate"
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {getReplyPreview(replyTo)}
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
                <button
                  className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
                  title="Trả lời"
                  onClick={() => {
                    console.log("🔄 REPLY BUTTON CLICKED - User message")
                    console.log("Message being replied to:", message)
                    console.log("Message ID:", message.id)
                    console.log("Message content:", message.content)
                    onReply(message)
                  }}
                >
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
                    <polyline points="9 17 4 12 9 7" />
                    <path d="M20 18v-1a4 4 0 0 0-4-4H4" />
                  </svg>
                </button>
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
              {replyTo && (
                <div
                  className="rounded-lg bg-[#e6f0fa] border-l-4 border-blue-500 px-3 py-2 mb-1"
                  style={{ minWidth: 0 }}
                >
                  <div className="font-bold text-sm text-blue-900 truncate">
                    {replyTo.senderName || "User"}
                  </div>
                  <div
                    className="text-xs text-gray-600 break-words truncate"
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {getReplyPreview(replyTo)}
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
              />
              <div className="flex justify-end items-center mt-1.5">
                <span className="text-xs text-regular-creator-msg-time-cl">{msgTime}</span>
                <button
                  className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
                  title="Trả lời"
                  onClick={() => {
                    console.log("🔄 REPLY BUTTON CLICKED - Friend message")
                    console.log("Message being replied to:", message)
                    console.log("Message ID:", message.id)
                    console.log("Message content:", message.content)
                    onReply(message)
                  }}
                >
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
                    <polyline points="9 17 4 12 9 7" />
                    <path d="M20 18v-1a4 4 0 0 0-4-4H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
