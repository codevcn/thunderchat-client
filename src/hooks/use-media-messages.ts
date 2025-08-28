import { useState, useEffect, useCallback } from "react"
import { useAppSelector } from "./redux"
import { messageService } from "@/services/message.service"
import { EMessageMediaTypes } from "@/utils/enums"
import { clientSocket } from "@/utils/socket/client-socket"
import { EMessagingEvents } from "@/utils/socket/events"
import type { TMessage, TMessageFullInfo } from "@/utils/types/be-api"

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
      // ignore
    }
  }, [directChat?.id])

  // Hàm fetch media messages từ API chuyên dụng
  const fetchMediaMessages = useCallback(async () => {
    if (!directChat?.id) return

    setLoading(true)
    setError(null)

    try {
      // Gọi BE theo nhóm: 6 ảnh/video, 3 file, 3 voice
      const [mixedResp, filesResp, audiosResp] = await Promise.all([
        messageService.getMediaMessagesWithMultipleTypes(
          directChat.id,
          [EMessageMediaTypes.IMAGE, EMessageMediaTypes.VIDEO],
          {},
          1,
          6,
          "desc"
        ),
        messageService.getMediaMessagesWithFilters(
          directChat.id,
          { type: EMessageMediaTypes.DOCUMENT },
          1,
          3,
          "desc"
        ),
        messageService.getMediaMessagesWithFilters(
          directChat.id,
          { type: EMessageMediaTypes.AUDIO },
          1,
          3,
          "desc"
        ),
      ])

      const mixedItems = mixedResp.success ? mixedResp.data.items : []
      const fileItems = filesResp.success ? filesResp.data.items : []
      const audioItems = audiosResp.success ? audiosResp.data.items : []

      // Kết hợp và sắp xếp theo thời gian mới nhất
      const combined = [...mixedItems, ...fileItems, ...audioItems]
        .filter((msg: TMessage) => !msg.isDeleted)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setMediaMessages(combined)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }

    // Fetch statistics after media messages are updated
    await fetchStatistics()
  }, [directChat?.id, fetchStatistics])

  // Hàm xử lý tin nhắn mới hoặc cập nhật từ socket
  const handleMessageUpdate = useCallback(
    (updatedMessage: TMessageFullInfo) => {
      setMediaMessages((prev) => {
        const existingIndex = prev.findIndex((msg) => msg.id === updatedMessage.id)

        if (updatedMessage.isDeleted) {
          if (existingIndex !== -1) {
            const newMessages = prev.filter((msg) => msg.id !== updatedMessage.id)
            const sortedMessages = newMessages.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            setTimeout(() => fetchStatistics(), 100)
            return sortedMessages
          }
          return prev
        }

        if (!updatedMessage.isDeleted) {
          if (existingIndex !== -1) {
            const newMessages = [...prev]
            newMessages[existingIndex] = updatedMessage
            const sortedMessages = newMessages.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            setTimeout(() => fetchStatistics(), 100)
            return sortedMessages
          } else {
            const newMediaMessages = [updatedMessage, ...prev]
            const sortedMessages = newMediaMessages.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            setTimeout(() => fetchStatistics(), 100)
            return sortedMessages
          }
        }

        return prev
      })
    },
    [fetchStatistics]
  )

  // Effect để fetch media messages ban đầu
  useEffect(() => {
    fetchMediaMessages()
  }, [fetchMediaMessages])

  // Effect để lắng nghe socket events
  useEffect(() => {
    if (!directChat?.id) return

    clientSocket.socket.on(EMessagingEvents.send_message_direct, handleMessageUpdate)
    return () => {
      clientSocket.socket.removeListener(EMessagingEvents.send_message_direct, handleMessageUpdate)
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
