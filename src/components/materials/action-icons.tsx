import React, { useState, useRef, useEffect } from "react"
import ReactDOM from "react-dom"
import { Download, Share2, MoreHorizontal } from "lucide-react"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"

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
}

const MENU_WIDTH = 100

const ActionIcons = ({
  onDownload,
  onShare,
  onMore,
  showDownload = true,
  className = "",
  onViewOriginalMessage,
  onDeleteForMe,
  onDeleteForEveryone,
  isSender = false,
  messageId,
}: ActionIconsProps) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  })

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreButtonRef.current && !moreButtonRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false)
      }
    }
    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showMoreMenu])

  // Tính vị trí menu khi mở
  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect()

      // Thử đặt menu bên trái trước
      let left = rect.left + window.scrollX - MENU_WIDTH

      // Kiểm tra nếu bên trái không đủ chỗ
      if (left < 8) {
        // Đặt bên phải
        left = rect.right + window.scrollX
        // Kiểm tra nếu bên phải cũng không đủ chỗ
        if (left + MENU_WIDTH > window.innerWidth) {
          // Đặt bên phải nhưng giới hạn trong màn hình
          left = window.innerWidth - MENU_WIDTH - 8
        }
      }

      let top = rect.bottom + window.scrollY + 4
      if (top + 300 > window.innerHeight) top = window.innerHeight - 320
      setMenuPosition({ top, left })
    }
    setShowMoreMenu(!showMoreMenu)
    onMore && onMore()
  }

  const handleMenuItemClick = (action?: () => void) => {
    setShowMoreMenu(false)
    action && action()
  }

  const handleViewOriginalMessage = () => {
    if (messageId) {
      // Emit event để scroll đến message media
      eventEmitter.emit(EInternalEvents.SCROLL_TO_MESSAGE_MEDIA, messageId)
    }
    setShowMoreMenu(false)
  }

  const menu = (
    <div
      style={{
        position: "absolute",
        top: menuPosition.top,
        left: menuPosition.left,
        minWidth: MENU_WIDTH,
        zIndex: 9999,
      }}
      className="bg-[#2C2E31] rounded-lg shadow-lg border border-gray-700"
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
            Xem tin nhắn gốc
          </button>
        ) : null}
        <div className="border-t border-gray-600 my-1"></div>
        <button
          className="w-full px-4 py-2 text-left text-red-400 hover:bg-[#35363A] text-sm"
          onClick={() => handleMenuItemClick(onDeleteForMe)}
        >
          Xoá chỉ ở mình tôi
        </button>
        {isSender && (
          <button
            className="w-full px-4 py-2 text-left text-red-400 hover:bg-[#35363A] text-sm"
            onClick={() => handleMenuItemClick(onDeleteForEveryone)}
          >
            Xoá ở cả người nhận (Thu hồi)
          </button>
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
          title="Tải về"
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
        title="Chia sẻ"
      >
        <Share2 className="w-5 h-5" />
      </button>
      <button
        ref={moreButtonRef}
        className="p-1 rounded hover:bg-[#232526] text-white"
        onClick={handleMoreClick}
        title="Khác"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
      {showMoreMenu && ReactDOM.createPortal(menu, document.body)}
    </div>
  )
}

export default ActionIcons
