import { useState, useEffect, useCallback } from "react"
import { pinService } from "@/services/pin.service"
import type { TStateMessage } from "@/utils/types/global"
import { toast } from "sonner"

export const usePinMessages = (directChatId: number) => {
  const [pinnedMessages, setPinnedMessages] = useState<TStateMessage[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch pinned messages
  const fetchPinnedMessages = useCallback(async () => {
    if (!directChatId) return

    setLoading(true)
    try {
      const messages = await pinService.getPinnedMessages(directChatId)
      setPinnedMessages(messages)
    } catch (error) {
      console.error("Error fetching pinned messages:", error)
      setPinnedMessages([])
    } finally {
      setLoading(false)
    }
  }, [directChatId])

  // Toggle pin message
  const togglePinMessage = useCallback(
    async (messageId: number, isPinned: boolean, message?: TStateMessage) => {
      try {
        const response = await pinService.togglePinMessage(messageId, directChatId, isPinned)

        if ("success" in response) {
          // Bỏ ghim thành công
          setPinnedMessages((prev) => prev.filter((m) => m.id !== messageId))
          toast.success("Đã bỏ ghim tin nhắn")
          return false
        } else {
          // Ghim thành công
          if (message) {
            setPinnedMessages((prev) => [...prev, message])
          }
          toast.success("Đã ghim tin nhắn")
          return true
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || "Lỗi khi ghim/bỏ ghim tin nhắn"
        toast.error(errorMessage)
        throw error
      }
    },
    [directChatId]
  )

  // Check if message is pinned
  const isMessagePinned = useCallback(
    (messageId: number) => {
      return pinnedMessages.some((msg) => msg.id === messageId)
    },
    [pinnedMessages]
  )

  // Get pinned count
  const getPinnedCount = useCallback(() => {
    return pinnedMessages.length
  }, [pinnedMessages])

  // Auto fetch when directChatId changes
  useEffect(() => {
    fetchPinnedMessages()
  }, [fetchPinnedMessages])

  return {
    pinnedMessages,
    loading,
    togglePinMessage,
    isMessagePinned,
    getPinnedCount,
    fetchPinnedMessages,
  }
}
