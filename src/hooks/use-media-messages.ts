import { useState, useEffect, useCallback } from "react"
import { useAppSelector } from "./redux"
import { messageService } from "@/services/message.service"
import { EMessageTypes, ESortTypes, EMessageMediaTypes } from "@/utils/enums"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"
import type { TMessage, TMessageFullInfo, TMsgWithMediaSticker } from "@/utils/types/be-api"

const isUrl = (text: string) => {
  try {
    new URL(text)
    return true
  } catch {
    return false
  }
}

const isMediaMessage = (message: TMessageFullInfo): boolean => {
  return (
    message.type === EMessageTypes.MEDIA ||
    (message.type === EMessageTypes.TEXT && isUrl(message.content))
  )
}

export const useMediaMessages = () => {
  const { directChat } = useAppSelector(({ messages }) => messages)
  const [mediaMessages, setMediaMessages] = useState<TMessageFullInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statistics, setStatistics] = useState<{
    images: number
    videos: number
    files: number
    voices: number
    links: number
  }>({
    images: 0,
    videos: 0,
    files: 0,
    voices: 0,
    links: 0,
  })

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
    (message: TMessage) => {
      return (
        message.type === EMessageTypes.MEDIA ||
        (message.type === EMessageTypes.TEXT && message.content && isUrl(message.content))
      )
    },
    [isUrl]
  )

  // Hàm fetch statistics
  const fetchStatistics = useCallback(async () => {
    if (!directChat?.id) return

    try {
      const response = await messageService.getMediaStatistics(directChat.id)
      if (response.success) {
        const { images, videos, files, voices } = response.data
        setStatistics({
          images,
          videos,
          files,
          voices,
          links: 0, // Links count is not available in statistics API
        })
      }
    } catch (err) {
      console.error("Failed to fetch media statistics:", err)
    }
  }, [directChat?.id])

  // Hàm fetch media messages từ API chuyên dụng
  const fetchMediaMessages = useCallback(async () => {
    if (!directChat?.id) return

    setLoading(true)
    setError(null)

    try {
      // Fetch all media messages in one call
      const response = await messageService.getMediaMessagesWithFilters(
        directChat.id,
        {}, // No type filter, get all media types
        1, // page
        20, // limit - get more to have enough for all sections
        "desc" // sort
      )

      if (response.success) {
        // Lọc ra tin nhắn chưa bị xóa và sắp xếp theo thời gian
        const nonDeletedMessages = response.data.items
          .filter((msg: TMessage) => !msg.isDeleted)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        console.log("Filtered media messages:", nonDeletedMessages)
        console.log("Setting mediaMessages state with:", nonDeletedMessages.length, "items")
        setMediaMessages(nonDeletedMessages)
      } else {
        console.error("Media messages API error:", response)
        setError(response.message || "Failed to fetch media messages")
      }

      // Fetch statistics after media messages are updated
      await fetchStatistics()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [directChat?.id, fetchStatistics])

  // Hàm xử lý tin nhắn mới hoặc cập nhật từ socket
  const handleMessageUpdate = useCallback(
    (updatedMessage: TMessageFullInfo) => {
      setMediaMessages((prev) => {
        const existingIndex = prev.findIndex((msg) => msg.id === updatedMessage.id)

        // Nếu tin nhắn đã bị xóa và là media message, loại bỏ khỏi danh sách
        if (updatedMessage.isDeleted && isMediaMessage(updatedMessage)) {
          if (existingIndex !== -1) {
            const newMessages = prev.filter((msg) => msg.id !== updatedMessage.id)
            const sortedMessages = newMessages.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )

            // Update statistics after removing message
            setTimeout(() => fetchStatistics(), 100)

            return sortedMessages
          }
          return prev
        }

        // Nếu tin nhắn chưa bị xóa và là media message
        if (!updatedMessage.isDeleted && isMediaMessage(updatedMessage)) {
          if (existingIndex !== -1) {
            // Cập nhật tin nhắn hiện có
            const newMessages = [...prev]
            newMessages[existingIndex] = updatedMessage
            const sortedMessages = newMessages.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )

            // Update statistics after updating message
            setTimeout(() => fetchStatistics(), 100)

            return sortedMessages
          } else {
            // Thêm tin nhắn mới
            const newMediaMessages = [updatedMessage, ...prev]
            const sortedMessages = newMediaMessages.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )

            // Update statistics after adding new message
            setTimeout(() => fetchStatistics(), 100)

            return sortedMessages
          }
        }

        return prev
      })
    },
    [isMediaMessage, fetchStatistics]
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
    statistics,
    refetch: fetchMediaMessages,
  }
}
