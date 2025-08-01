import React, { useState, useRef, useEffect } from "react"
import ReactDOM from "react-dom"
import { Download, Share2, MoreHorizontal } from "lucide-react"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { directChatService } from "@/services/direct-chat.service"
import { toast } from "sonner"
import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react-dom"

interface ActionIconsProps {
  onDownload?: () => void
  onShare?: () => void
  onMore?: () => void
  showDownload?: boolean
  className?: string
  onViewOriginalMessage?: () => void
  onDeleteForMe?: () => void
  onDeleteForEveryone?: () => void
  isSender?: boolean
  messageId?: number
  mediaUrl?: string
  fileName?: string
  fileType?: string
}

const MENU_WIDTH = 100

const ActionIcons = ({
  onDownload,
  onShare,
  onMore,
  showDownload = true,
  className = "",
  isSender = false,
  messageId,
}: ActionIconsProps) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const moreButtonRef = useRef<HTMLButtonElement>(null)

  // Sử dụng floating-ui cho positioning
  const { refs, floatingStyles, update } = useFloating({
    placement: "bottom-end",
    middleware: [
      offset(4),
      flip({ fallbackPlacements: ["top-end", "bottom-end", "top-start", "bottom-start"] }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  })

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    if (!showMoreMenu) return
    const handleClick = (e: MouseEvent) => {
      const floatingEl = refs.floating.current
      const referenceEl = refs.reference.current
      const isRefEl = referenceEl instanceof HTMLElement
      if (
        floatingEl &&
        !floatingEl.contains(e.target as Node) &&
        (!isRefEl || !referenceEl.contains(e.target as Node))
      ) {
        setShowMoreMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showMoreMenu, refs])

  // Tính vị trí menu khi mở
  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMoreMenu(!showMoreMenu)
    if (!showMoreMenu) {
      setTimeout(update, 0)
    }
    onMore && onMore()
  }

  const handleViewOriginalMessage = () => {
    if (messageId) {
      // Emit event để scroll đến message media
      eventEmitter.emit(EInternalEvents.SCROLL_TO_MESSAGE_MEDIA, messageId)
    }
    setShowMoreMenu(false)
  }

  // Logic thu hồi tin nhắn
  const handleRecallMessage = async () => {
    if (!messageId || !isSender) {
      toast.error("Bạn chỉ có thể thu hồi tin nhắn của mình")
      return
    }

    try {
      setShowMoreMenu(false)

      const response = await directChatService.deleteMessage(messageId)

      if (response.success) {
        toast.success("Đã thu hồi tin nhắn thành công")
        // Emit event để cập nhật UI
      } else {
        toast.error(response.message || "Thu hồi tin nhắn thất bại")
      }
    } catch (error: any) {
      console.error("Error recalling message:", error)
      toast.error(error.message || "Thu hồi tin nhắn thất bại")
    }
  }

  const menu = (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="bg-[#2C2E31] rounded-lg shadow-lg border border-gray-700 z-50"
    >
      <div className="py-1">
        {messageId ? (
          <button
            className="w-full px-4 py-2 text-left text-white hover:bg-[#35363A] text-sm"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleViewOriginalMessage()
            }}
          >
            View Original Message
          </button>
        ) : null}
        {isSender && messageId && (
          <>
            <div className="border-t border-gray-600 my-1"></div>
            <button
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-[#35363A] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleRecallMessage()
              }}
            >
              Recall Message
            </button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showDownload && (
        <button
          className="p-1 rounded hover:bg-[#232526] text-white"
          onClick={(e) => {
            e.stopPropagation()
            onDownload && onDownload()
          }}
          title="Download"
        >
          <Download className="w-5 h-5" />
        </button>
      )}
      <button
        className="p-1 rounded hover:bg-[#232526] text-white"
        onClick={(e) => {
          e.stopPropagation()
          onShare && onShare()
        }}
        title="Share"
      >
        <Share2 className="w-5 h-5" />
      </button>
      <button
        ref={refs.setReference}
        className="p-1 rounded hover:bg-[#232526] text-white"
        onClick={handleMoreClick}
        title="More"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
      {showMoreMenu && ReactDOM.createPortal(menu, document.body)}
    </div>
  )
}

export default ActionIcons
