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
      setMediaMessages(messages)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [directChat?.id])

  // Hàm xử lý tin nhắn mới từ socket
  const handleNewMessage = useCallback(
    (newMessage: TDirectMessage) => {
      if (isMediaMessage(newMessage)) {
        setMediaMessages((prev) => {
          // Kiểm tra xem tin nhắn đã tồn tại chưa
          const exists = prev.some((msg) => msg.id === newMessage.id)
          if (exists) return prev

          const newMediaMessages = [newMessage, ...prev]
          // Sắp xếp theo thời gian mới nhất
          return newMediaMessages.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        })
      }
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

    // Lắng nghe tin nhắn mới từ socket
    clientSocket.socket.on(ESocketEvents.send_message_direct, handleNewMessage)

    return () => {
      clientSocket.socket.removeListener(ESocketEvents.send_message_direct, handleNewMessage)
    }
  }, [directChat?.id, handleNewMessage])

  return {
    mediaMessages,
    loading,
    error,
    refetch: fetchMediaMessages,
  }
}
