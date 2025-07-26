import { useState, useEffect, useCallback } from "react"
import { pinService } from "@/services/pin.service"
import type { TStateDirectMessage } from "@/utils/types/global"
import type { TPinnedDirectChat } from "@/apis/pin"
import { toast } from "sonner"

export const usePinMessages = (directChatId: number) => {
  const [pinnedMessages, setPinnedMessages] = useState<TStateDirectMessage[]>([])
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
    async (messageId: number, isPinned: boolean, message?: TStateDirectMessage) => {
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

// Hook for direct chat pinning
export const usePinDirectChats = () => {
  const [pinnedDirectChats, setPinnedDirectChats] = useState<TPinnedDirectChat[]>([])
  const [pinnedCount, setPinnedCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Fetch pinned direct chats
  const fetchPinnedDirectChats = useCallback(async () => {
    setLoading(true)
    try {
      const [chats, count] = await Promise.all([
        pinService.getPinnedDirectChats(),
        pinService.getPinnedDirectChatsCount(),
      ])
      setPinnedDirectChats(chats)
      setPinnedCount(count)
    } catch (error) {
      console.error("Error fetching pinned direct chats:", error)
      setPinnedDirectChats([])
      setPinnedCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  // Toggle pin direct chat
  const togglePinDirectChat = useCallback(
    async (directChatId: number, isPinned: boolean) => {
      try {
        const response = await pinService.togglePinDirectChat(directChatId, isPinned)

        // Always refresh from backend to ensure accuracy
        await fetchPinnedDirectChats()

        if ("success" in response) {
          toast.success("Đã bỏ ghim cuộc trò chuyện")
          return false
        } else {
          toast.success("Đã ghim cuộc trò chuyện")
          return true
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message || "Lỗi khi ghim/bỏ ghim cuộc trò chuyện"
        toast.error(errorMessage)
        throw error
      }
    },
    [fetchPinnedDirectChats]
  )

  // Check if direct chat is pinned
  const isDirectChatPinned = useCallback(
    (directChatId: number) => {
      return pinnedDirectChats.some((chat) => chat.directChatId === directChatId)
    },
    [pinnedDirectChats]
  )

  // Get pinned direct chat by ID
  const getPinnedDirectChat = useCallback(
    (directChatId: number) => {
      return pinnedDirectChats.find((chat) => chat.directChatId === directChatId)
    },
    [pinnedDirectChats]
  )

  // Auto fetch on mount
  useEffect(() => {
    fetchPinnedDirectChats()
  }, [fetchPinnedDirectChats])

  return {
    pinnedDirectChats,
    pinnedCount,
    loading,
    togglePinDirectChat,
    isDirectChatPinned,
    getPinnedDirectChat,
    fetchPinnedDirectChats,
  }
}
