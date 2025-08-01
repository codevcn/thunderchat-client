import { useState, useEffect, useCallback } from "react"
import { useAppSelector } from "./redux"
import { messageService } from "@/services/message.service"
import { EMessageTypes, ESortTypes } from "@/utils/enums"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"
import type { TDirectMessage } from "@/utils/types/be-api"

export const useMediaMessages = () => {
  const { directChat } = useAppSelector(({ messages }) => messages)
  const [mediaMessages, setMediaMessages] = useState<TDirectMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hàm kiểm tra URL
  const isUrl = useCallback((text: string) => {
    try {
      new URL(text)
      return true
    } catch {
      return false
    }
  }, [])

  // Hàm kiểm tra xem tin nhắn có phải là media không
  const isMediaMessage = useCallback(
    (message: TDirectMessage) => {
      return (
        [
          EMessageTypes.IMAGE,
          EMessageTypes.VIDEO,
          EMessageTypes.DOCUMENT,
          EMessageTypes.AUDIO,
        ].includes(message.type as EMessageTypes) ||
        (message.type === EMessageTypes.TEXT && message.content && isUrl(message.content))
      )
    },
    [isUrl]
  )

  // Hàm fetch media messages từ API chuyên dụng
  const fetchMediaMessages = useCallback(async () => {
    if (!directChat?.id) return

    setLoading(true)
    setError(null)

    try {
      const messages = await messageService.fetchDirectMedia(directChat.id, 100, 0, ESortTypes.DESC)
      // Lọc ra tin nhắn chưa bị xóa
      const nonDeletedMessages = messages.filter((msg) => !msg.isDeleted)
      setMediaMessages(nonDeletedMessages)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [directChat?.id])

  // Hàm xử lý tin nhắn mới hoặc cập nhật từ socket
  const handleMessageUpdate = useCallback(
    (updatedMessage: TDirectMessage) => {
      setMediaMessages((prev) => {
        const existingIndex = prev.findIndex((msg) => msg.id === updatedMessage.id)

        // Nếu tin nhắn đã bị xóa và là media message, loại bỏ khỏi danh sách
        if (updatedMessage.isDeleted && isMediaMessage(updatedMessage)) {
          if (existingIndex !== -1) {
            const newMessages = prev.filter((msg) => msg.id !== updatedMessage.id)
            return newMessages.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          }
          return prev
        }

        // Nếu tin nhắn chưa bị xóa và là media message
        if (!updatedMessage.isDeleted && isMediaMessage(updatedMessage)) {
          if (existingIndex !== -1) {
            // Cập nhật tin nhắn hiện có
            const newMessages = [...prev]
            newMessages[existingIndex] = updatedMessage
            return newMessages.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          } else {
            // Thêm tin nhắn mới
            const newMediaMessages = [updatedMessage, ...prev]
            return newMediaMessages.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          }
        }

        return prev
      })
    },
    [isMediaMessage]
  )

  // Effect để fetch media messages ban đầu
  useEffect(() => {
    fetchMediaMessages()
  }, [fetchMediaMessages])

  // Effect để lắng nghe socket events
  useEffect(() => {
    if (!directChat?.id) return

    // Lắng nghe tin nhắn mới/cập nhật từ socket
    clientSocket.socket.on(ESocketEvents.send_message_direct, handleMessageUpdate)

    return () => {
      clientSocket.socket.removeListener(ESocketEvents.send_message_direct, handleMessageUpdate)
    }
  }, [directChat?.id, handleMessageUpdate])

  return {
    mediaMessages,
    loading,
    error,
    refetch: fetchMediaMessages,
  }
}
