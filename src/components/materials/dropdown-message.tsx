import React from "react"
import { Pin } from "lucide-react"
import { toast } from "sonner"
import { directChatService } from "@/services/direct-chat.service"

interface DropdownMessageProps {
  onPin: () => void
  isPinned: boolean
  onClose?: () => void
  content: string
  isTextMessage: boolean
  canDelete: boolean
  messageId?: number
}

export const DropdownMessage: React.FC<DropdownMessageProps> = ({
  onPin,
  isPinned,
  onClose,
  content,
  isTextMessage,
  canDelete,
  messageId,
}) => {
  // Hàm copy vào clipboard
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(content)
      toast.success("Copy thành công!")
    } catch (err) {
      // fallback
      const textarea = document.createElement("textarea")
      textarea.value = content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      toast.success("Copy thành công!")
    }
    onClose && onClose()
  }

  // Hàm thu hồi tin nhắn
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!messageId) return
    try {
      const res = await directChatService.deleteMessage(messageId)
      if (res.success) {
        toast.success("Thu hồi tin nhắn thành công")
        // Nếu có state quản lý messages, nên cập nhật lại UI ở đây
      } else {
        toast.error(res.message || "Thu hồi tin nhắn thất bại")
      }
    } catch (err: any) {
      toast.error(err?.message || "Thu hồi tin nhắn thất bại")
    }
    onClose && onClose()
  }

  return (
    <div className="bg-[#232323] rounded-lg shadow-lg border border-gray-700 min-w-[200px] py-2 z-50">
      {isTextMessage && (
        <button
          className="w-full flex items-center gap-2 px-4 py-2 text-left text-white hover:bg-[#35363A] text-sm"
          onClick={handleCopy}
        >
          <span role="img" aria-label="copy">
            📋
          </span>
          Copy tin nhắn
        </button>
      )}
      <button
        className="w-full flex items-center gap-2 px-4 py-2 text-left text-white hover:bg-[#35363A] text-sm"
        onClick={(e) => {
          e.stopPropagation()
          onPin()
          onClose && onClose()
        }}
      >
        <Pin size={16} fill={isPinned ? "#facc15" : "none"} />
        {isPinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}
      </button>
      <div className="border-t border-gray-600 my-1"></div>
      {canDelete && (
        <button
          className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-400 hover:bg-[#35363A] text-sm"
          onClick={handleDelete}
        >
          <span role="img" aria-label="delete">
            🗑️
          </span>
          Xoá (Thu hồi)
        </button>
      )}
    </div>
  )
}
