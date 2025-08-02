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
      // Fetch images/videos (6 items)
      const imagesVideosResponse = await messageService.getMediaMessagesWithMultipleTypes(
        directChat.id,
        ["image", "video"],
        {},
        1, // page
        6, // limit
        "desc" // sort
      )

      // Fetch files (3 items)
      const filesResponse = await messageService.getMediaMessagesWithFilters(
        directChat.id,
        { type: "file" },
        1, // page
        3, // limit
        "desc" // sort
      )

      // Fetch voices (3 items)
      const voicesResponse = await messageService.getMediaMessagesWithFilters(
        directChat.id,
        { type: "voice" },
        1, // page
        3, // limit
        "desc" // sort
      )

      // Fetch links (3 items) - TEXT messages with URLs
      const linksResponse = await messageService.getMediaMessagesWithFilters(
        directChat.id,
        {}, // No type filter, will filter TEXT with URLs on frontend
        1, // page
        10, // Get more to filter for URLs
        "desc" // sort
      )

      // Combine all responses
      const allMessages: TDirectMessage[] = []

      if (imagesVideosResponse.success) {
        allMessages.push(...imagesVideosResponse.data.items)
      }
      if (filesResponse.success) {
        allMessages.push(...filesResponse.data.items)
      }
      if (voicesResponse.success) {
        allMessages.push(...voicesResponse.data.items)
      }
      if (linksResponse.success) {
        // Filter for TEXT messages with URLs and limit to 3
        const linkMessages = linksResponse.data.items
          .filter(
            (msg: TDirectMessage) =>
              msg.type === EMessageTypes.TEXT &&
              msg.content &&
              (msg.content.includes("http://") || msg.content.includes("https://"))
          )
          .slice(0, 3)
        allMessages.push(...linkMessages)
      }

      // Lọc ra tin nhắn chưa bị xóa và sắp xếp theo thời gian
      const nonDeletedMessages = allMessages
        .filter((msg: TDirectMessage) => !msg.isDeleted)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

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
