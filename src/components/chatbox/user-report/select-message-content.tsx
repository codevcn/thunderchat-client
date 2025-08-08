"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import {
  fetchReportMessagesThunk,
  clearReportMessages,
  setReportConversationId,
} from "@/redux/messages/report-messages.slice"
import type { TStateMessage } from "@/utils/types/global"
import { Spinner } from "@/components/materials/spinner"
import { useUser } from "@/hooks/user"
import { SelectMessageItem } from "./select-message-item"
import { EPaginations } from "@/utils/enums"
import dayjs from "dayjs"

type TSelectMessageContentProps = {
  conversationId?: number
  conversationType: "direct" | "group"
  selectedMessages: TStateMessage[]
  onSelectedMessagesChange: (messages: TStateMessage[]) => void
  maxMessages: number
  isMessageSelected?: (messageId: number) => boolean
}

const SCROLL_ON_MESSAGES_THRESHOLD = 100

export const SelectMessageContent = ({
  conversationId,
  conversationType,
  selectedMessages,
  onSelectedMessagesChange,
  maxMessages,
  isMessageSelected,
}: TSelectMessageContentProps) => {
  const user = useUser()
  const dispatch = useAppDispatch()
  const messages = useAppSelector((state) => state.reportMessages.messages) as TStateMessage[]
  const isLoading = useAppSelector((state) => state.reportMessages.loading)
  const hasMoreMessages = useAppSelector((state) => state.reportMessages.hasMore)
  const currentConversationId = useAppSelector((state) => state.reportMessages.conversationId)
  const [msgOffset, setMsgOffset] = useState<number | undefined>(undefined)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const tempFlagUseEffectRef = useRef(true)
  const hasScrolledToBottomRef = useRef(false)

  // Local state để preserve selected messages data
  const [stableSelectedMessages, setStableSelectedMessages] = useState<TStateMessage[]>([])

  // Sync stableSelectedMessages với selectedMessages prop
  useEffect(() => {
    if (selectedMessages.length === 0) {
      setStableSelectedMessages([])
    } else if (selectedMessages.length !== stableSelectedMessages.length) {
      // Update stableSelectedMessages khi selectedMessages thay đổi từ bên ngoài
      setStableSelectedMessages(selectedMessages.map((msg) => JSON.parse(JSON.stringify(msg))))
    }
  }, [selectedMessages, stableSelectedMessages.length])

  // Filter messages for report selection
  const filteredMessages = useMemo(() => {
    const filtered = messages.filter((message: TStateMessage) => {
      const isNotDeleted = !message.isDeleted
      const isNotSticker = message.type !== "STICKER"
      const isNotPinNotice = message.type !== "PIN_NOTICE"

      return isNotDeleted && isNotSticker && isNotPinNotice
    })

    return filtered.sort((a, b) => a.id - b.id)
  }, [messages])

  // Messages are already filtered, so we can use them directly
  const allMessages = useMemo(() => filteredMessages, [filteredMessages])

  // Group messages by date for date separators
  const messagesWithDateSeparators = useMemo(() => {
    const result: Array<TStateMessage | { type: "date-separator"; date: string }> = []
    let currentDate = ""

    allMessages.forEach((message) => {
      const messageDate = dayjs(message.createdAt).format("YYYY-MM-DD")
      const displayDate = dayjs(message.createdAt).format("MMMM DD, YYYY")

      if (messageDate !== currentDate) {
        result.push({ type: "date-separator", date: displayDate })
        currentDate = messageDate
      }

      result.push(message)
    })

    return result
  }, [allMessages])

  // Handle message selection - only allow selecting other people's messages
  const handleMessageSelect = useCallback(
    (message: TStateMessage, isSelected: boolean) => {
      // Only allow selection of other people's messages
      if (message.authorId === user?.id) {
        return
      }

      // Deep clone message to prevent data loss
      const clonedMessage = JSON.parse(JSON.stringify(message))

      if (isSelected) {
        // Add message to selection
        if (stableSelectedMessages.length < maxMessages) {
          const newSelectedMessages = [...stableSelectedMessages, clonedMessage]
          setStableSelectedMessages(newSelectedMessages)
          onSelectedMessagesChange(newSelectedMessages)
        }
      } else {
        // Remove message from selection
        const newSelectedMessages = stableSelectedMessages.filter((msg) => msg.id !== message.id)
        setStableSelectedMessages(newSelectedMessages)
        onSelectedMessagesChange(newSelectedMessages)
      }
    },
    [stableSelectedMessages, maxMessages, onSelectedMessagesChange, user?.id]
  )

  // Check if message is selected - use prop if provided, otherwise use local logic
  const checkMessageSelected = useCallback(
    (messageId: number) => {
      const isSelected = isMessageSelected
        ? isMessageSelected(messageId)
        : selectedMessages.some((msg) => msg.id === messageId)
      return isSelected
    },
    [selectedMessages, isMessageSelected]
  )

  // Fetch messages
  const fetchMessages = useCallback(
    async (directChatId: number, msgOffset: number | undefined, isFirstTime: boolean) => {
      try {
        await dispatch(
          fetchReportMessagesThunk({
            conversationId: directChatId,
            offset: msgOffset,
            limit: EPaginations.DIRECT_MESSAGES_PAGE_SIZE,
          })
        ).unwrap()
      } catch (error) {
        console.error("Error fetching messages:", error)
      }
    },
    [dispatch, conversationType, conversationId]
  )

  // Clear report messages and reset states when conversation changes
  useEffect(() => {
    if (conversationId) {
      // Only clear if we have a different conversation or if this is the first time

      // Only clear if conversation actually changed (not on first mount)
      if (currentConversationId !== null && currentConversationId !== conversationId) {
        dispatch(clearReportMessages())
        dispatch(setReportConversationId(conversationId))
        onSelectedMessagesChange([]) // Clear selected messages
        tempFlagUseEffectRef.current = true // Reset temp flag
        setIsLoadingMore(false) // Reset loading state
        setMsgOffset(undefined) // Reset offset
        hasScrolledToBottomRef.current = false // Reset scroll flag
      } else if (currentConversationId === null) {
        // First time mounting, just set the conversation ID
        dispatch(setReportConversationId(conversationId))
      }
    }
  }, [conversationId, dispatch, onSelectedMessagesChange, messages.length, currentConversationId])

  // Initialize messages when component mounts or conversation changes
  useEffect(() => {
    if (conversationType === "direct" && conversationId && tempFlagUseEffectRef.current) {
      tempFlagUseEffectRef.current = false
      // Use undefined for initial fetch to get latest messages, similar to direct messages
      fetchMessages(conversationId, undefined, true)
    }
  }, [conversationId, conversationType, fetchMessages])

  // Auto-fetch more messages when filtered messages are too few (≤5)
  useEffect(() => {
    if (
      filteredMessages.length <= 5 &&
      hasMoreMessages &&
      !isLoading &&
      !isLoadingMore &&
      conversationId &&
      filteredMessages.length > 0 &&
      msgOffset === undefined
    ) {
      const oldestMessage = filteredMessages[0]

      // Set loading state to prevent multiple requests
      setIsLoadingMore(true)

      setMsgOffset(oldestMessage.id)
      fetchMessages(conversationId, oldestMessage.id, false)

      // Reset loading state after delay
      setTimeout(() => {
        setIsLoadingMore(false)
      }, 300)
    }
  }, [
    filteredMessages.length,
    hasMoreMessages,
    isLoading,
    isLoadingMore,
    conversationId,
    fetchMessages,
    msgOffset,
  ])

  // Scroll to bottom when messages are loaded for the first time (after auto-fetch if needed)
  useEffect(() => {
    if (
      messagesWithDateSeparators.length > 0 &&
      messagesContainerRef.current &&
      msgOffset === undefined &&
      !hasScrolledToBottomRef.current &&
      !isLoadingMore &&
      !isLoading
    ) {
      // Add small delay to ensure DOM is fully rendered
      setTimeout(() => {
        const container = messagesContainerRef.current
        if (container) {
          // Force scroll to bottom to show latest messages
          container.scrollTop = container.scrollHeight
          hasScrolledToBottomRef.current = true
        }
      }, 100)
    }
  }, [messagesWithDateSeparators.length, msgOffset, isLoadingMore, isLoading])

  // Scroll to bottom when initial loading is complete (only for first load)
  useEffect(() => {
    if (
      !isLoading &&
      messagesWithDateSeparators.length > 0 &&
      messagesContainerRef.current &&
      msgOffset === undefined &&
      !hasScrolledToBottomRef.current &&
      !isLoadingMore
    ) {
      // Add delay to ensure all content is rendered
      setTimeout(() => {
        const container = messagesContainerRef.current
        if (container) {
          // Force scroll to bottom
          container.scrollTop = container.scrollHeight
          hasScrolledToBottomRef.current = true
        }
      }, 200)
    }
  }, [isLoading, messagesWithDateSeparators.length, msgOffset, isLoadingMore])

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Clear report messages when component unmounts
      dispatch(clearReportMessages())
    }
  }, [dispatch])

  // Handle scroll to load more messages - use report messages API for older messages
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement
      const scrollTop = target.scrollTop

      if (
        scrollTop <= SCROLL_ON_MESSAGES_THRESHOLD &&
        hasMoreMessages &&
        !isLoading &&
        !isLoadingMore
      ) {
        // Load older messages using report messages API
        if (filteredMessages.length > 0 && conversationId) {
          const oldestMessage = filteredMessages[0]

          // Set loading state to prevent multiple requests
          setIsLoadingMore(true)

          // Store current scroll position before loading
          const scrollHeightBefore = target.scrollHeight
          const scrollTopBefore = target.scrollTop

          setMsgOffset(oldestMessage.id)
          fetchMessages(conversationId, oldestMessage.id, false)

          // After loading, adjust scroll position to maintain user's view
          setTimeout(() => {
            if (target && target.scrollHeight > scrollHeightBefore) {
              const scrollHeightAfter = target.scrollHeight
              const heightAdded = scrollHeightAfter - scrollHeightBefore
              target.scrollTop = scrollTopBefore + heightAdded
            }
            // Reset loading state
            setIsLoadingMore(false)
          }, 300)
        }
      }
    },
    [filteredMessages, hasMoreMessages, isLoading, isLoadingMore, conversationId, fetchMessages]
  )

  // Loading indicator for top
  const topLoadingIndicator = (isLoading || isLoadingMore) && msgOffset !== undefined && (
    <div className="flex justify-center py-4">
      <Spinner size="small" />
    </div>
  )

  // No messages state
  if (messagesWithDateSeparators.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-regular-white-cl text-lg font-medium mb-2">No messages to select</div>
        <div className="text-regular-text-secondary-cl text-sm">
          No messages from the other person available for selection
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto STYLE-styled-modal-scrollbar"
        onScroll={handleScroll}
      >
        <div className="p-4 space-y-2">
          {/* Top Loading Indicator */}
          {topLoadingIndicator}

          {/* Messages List with Date Separators */}
          {messagesWithDateSeparators.map((item, index: number) => {
            if ("type" in item && item.type === "date-separator") {
              return (
                <div key={`date-${index}`} className="flex justify-center py-2">
                  <span className="text-regular-white-cl text-sm">{item.date}</span>
                </div>
              )
            }

            const message = item as TStateMessage
            return (
              <SelectMessageItem
                key={`${message.id}-${index}`}
                content={message.content}
                stickerUrl={message.Sticker?.imageUrl || null}
                mediaUrl={message.Media?.url || null}
                type={message.type}
                fileName={message.Media?.fileName}
                fileType={message.Media?.type}
                fileSize={message.Media?.fileSize}
                message={message}
                user={user!}
                isSelected={checkMessageSelected(message.id)}
                onSelect={(isSelected: boolean) => handleMessageSelect(message, isSelected)}
                disabled={
                  message.authorId === user?.id ||
                  (!checkMessageSelected(message.id) && selectedMessages.length >= maxMessages)
                }
              />
            )
          })}

          {/* Bottom Loading Indicator */}
          {isLoading && msgOffset === undefined && (
            <div className="flex justify-center py-4">
              <Spinner size="small" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
