import { useState, useCallback, useRef, useEffect } from "react"
import { messageService } from "@/services/message.service"
import type { TMediaItem, TMediaFilters, TMessageFullInfo } from "@/utils/types/be-api"
import type { TMediaPaginationState } from "@/utils/types/fe-api"
import type { TGetMediaMessagesResponse } from "@/utils/types/be-api"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"
import { EMessageMediaTypes, EMessageTypes } from "@/utils/enums"
import type { TMessage } from "@/utils/types/be-api"

interface UseMediaPaginationProps {
  directChatId: number
  initialLimit?: number
  initialSort?: "asc" | "desc"
  initialFilters?: TMediaFilters
}

interface UseMediaPaginationReturn {
  // State
  items: TMediaItem[]
  loading: boolean
  error: string | null
  hasMore: boolean
  currentPage: number
  totalPages: number
  totalItems: number

  // Actions
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  setFilters: (filters: TMediaFilters) => void
  setSortOrder: (sort: "asc" | "desc") => void
  resetPagination: () => void

  // Cache management
  clearCache: () => void
  getCacheInfo: () => { cachedPages: number; memoryUsage: number }
}

export const useMediaPagination = ({
  directChatId,
  initialLimit = 20,
  initialSort = "desc",
  initialFilters = {},
}: UseMediaPaginationProps): UseMediaPaginationReturn => {
  // State
  const [state, setState] = useState<TMediaPaginationState>({
    items: [],
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    hasMore: false,
    loading: false,
    error: null,
    filters: initialFilters,
    sortOrder: initialSort,
  })

  // Cache management
  const cacheRef = useRef<Map<string, { data: TMediaItem[]; timestamp: number }>>(new Map())
  const cacheTimeout = 5 * 60 * 1000 // 5 minutes

  // Generate cache key
  const getCacheKey = useCallback(
    (page: number, filters: TMediaFilters, sort: string) => {
      return `${directChatId}-${page}-${JSON.stringify(filters)}-${sort}`
    },
    [directChatId]
  )

  // Check if data is cached and valid
  const getCachedData = useCallback(
    (page: number, filters: TMediaFilters, sort: string) => {
      const key = getCacheKey(page, filters, sort)
      const cached = cacheRef.current.get(key)

      if (cached && Date.now() - cached.timestamp < cacheTimeout) {
        return cached.data
      }

      if (cached) {
        cacheRef.current.delete(key) // Remove expired cache
      }

      return null
    },
    [getCacheKey, cacheTimeout]
  )

  // Cache data
  const cacheData = useCallback(
    (page: number, filters: TMediaFilters, sort: string, data: TMediaItem[]) => {
      const key = getCacheKey(page, filters, sort)
      cacheRef.current.set(key, {
        data,
        timestamp: Date.now(),
      })
    },
    [getCacheKey]
  )

  // Clear cache
  const clearCache = useCallback(() => {
    cacheRef.current.clear()
  }, [])

  // Get cache info
  const getCacheInfo = useCallback(() => {
    return {
      cachedPages: cacheRef.current.size,
      memoryUsage: JSON.stringify(cacheRef.current).length,
    }
  }, [])

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

  // Hàm xử lý tin nhắn mới hoặc cập nhật từ socket
  const handleMessageUpdate = useCallback(
    (updatedMessage: TMessageFullInfo) => {
      setState((prev) => {
        const existingIndex = prev.items.findIndex((msg) => msg.id === updatedMessage.id)

        // Nếu tin nhắn đã bị xóa và là media message, loại bỏ khỏi danh sách
        if (updatedMessage.isDeleted && isMediaMessage(updatedMessage)) {
          if (existingIndex !== -1) {
            const newItems = prev.items.filter((msg) => msg.id !== updatedMessage.id)
            return {
              ...prev,
              items: newItems,
              totalItems: Math.max(0, prev.totalItems - 1),
            }
          }
          return prev
        }

        // Nếu tin nhắn chưa bị xóa và là media message
        if (!updatedMessage.isDeleted && isMediaMessage(updatedMessage)) {
          // Kiểm tra xem message có phù hợp với filters hiện tại không
          const messageMatchesCurrentFilters = () => {
            const { filters } = prev
            const messageType = updatedMessage.Media?.type

            // Kiểm tra type filter
            if (filters.types && filters.types.length > 0) {
              // Nếu có types filter, kiểm tra message type có trong danh sách không
              const allowedTypes = filters.types
                .map((type: string) => {
                  switch (type) {
                    case EMessageMediaTypes.IMAGE:
                      return EMessageMediaTypes.IMAGE
                    case EMessageMediaTypes.VIDEO:
                      return EMessageMediaTypes.VIDEO
                    case EMessageMediaTypes.DOCUMENT:
                      return EMessageMediaTypes.DOCUMENT
                    case EMessageMediaTypes.AUDIO:
                      return EMessageMediaTypes.AUDIO
                    default:
                      return null
                  }
                })
                .filter(Boolean)

              if (!allowedTypes.includes(messageType || null)) {
                return false
              }
            } else if (filters.type) {
              // Nếu có single type filter, kiểm tra message type
              const expectedType = filters.type

              if (updatedMessage.Media?.type !== expectedType) {
                return false
              }
            }

            // Kiểm tra sender filter
            if (filters.senderId && updatedMessage.authorId !== filters.senderId) {
              return false
            }

            // Kiểm tra date filter
            if (filters.fromDate || filters.toDate) {
              const messageDate = new Date(updatedMessage.createdAt)
              if (filters.fromDate && messageDate < new Date(filters.fromDate)) {
                return false
              }
              if (filters.toDate && messageDate > new Date(filters.toDate)) {
                return false
              }
            }

            return true
          }

          if (existingIndex !== -1) {
            // Cập nhật tin nhắn hiện có
            const newItems = [...prev.items]
            newItems[existingIndex] = updatedMessage as TMediaItem
            return {
              ...prev,
              items: newItems,
            }
          } else if (messageMatchesCurrentFilters()) {
            // Chỉ thêm tin nhắn mới nếu nó phù hợp với filters hiện tại
            const newItems = [updatedMessage as TMediaItem, ...prev.items]
            return {
              ...prev,
              items: newItems,
              totalItems: prev.totalItems + 1,
            }
          }
          // Nếu message không phù hợp với filters, không thêm vào danh sách
        }

        return prev
      })
    },
    [isMediaMessage]
  )

  // Fetch media messages
  const fetchMediaMessages = useCallback(
    async (page: number, filters: TMediaFilters, sort: "asc" | "desc", append: boolean = false) => {
      try {
        // Add validation for directChatId
        if (!directChatId || directChatId <= 0) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: "Invalid direct chat ID",
          }))
          return
        }

        setState((prev) => ({ ...prev, loading: true, error: null }))

        // Check cache first
        const cachedData = getCachedData(page, filters, sort)
        if (cachedData && append) {
          setState((prev) => ({
            ...prev,
            items: [...prev.items, ...cachedData],
            currentPage: page,
            hasMore: page < prev.totalPages,
            loading: false,
          }))
          return
        }

        let response: TGetMediaMessagesResponse

        // Use multiple types for Images/Video tab
        if (filters.types && filters.types.length > 0) {
          response = await messageService.getMediaMessagesWithMultipleTypes(
            directChatId,
            filters.types,
            {
              senderId: filters.senderId,
              fromDate: filters.fromDate,
              toDate: filters.toDate,
            },
            page,
            initialLimit,
            sort
          )
        } else {
          response = await messageService.getMediaMessagesWithFilters(
            directChatId,
            filters,
            page,
            initialLimit,
            sort
          )
        }

        if (response.success) {
          const { items, pagination } = response.data

          // Cache the data
          cacheData(page, filters, sort, items)

          setState((prev) => ({
            ...prev,
            items: append ? [...prev.items, ...items] : items,
            currentPage: page,
            totalPages: pagination.totalPages,
            totalItems: pagination.totalItems,
            hasMore: pagination.hasMore,
            loading: false,
          }))
        } else {
          throw new Error(response.message || "Failed to fetch media messages")
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        }))
      }
    },
    [directChatId, initialLimit, getCachedData, cacheData]
  )

  // Load more items
  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore || !directChatId || directChatId <= 0) return

    const nextPage = state.currentPage + 1
    await fetchMediaMessages(nextPage, state.filters, state.sortOrder, true)
  }, [
    state.loading,
    state.hasMore,
    state.currentPage,
    state.filters,
    state.sortOrder,
    fetchMediaMessages,
    directChatId,
  ])

  // Refresh data
  const refresh = useCallback(async () => {
    if (!directChatId || directChatId <= 0) return

    clearCache()
    await fetchMediaMessages(1, state.filters, state.sortOrder, false)
  }, [clearCache, fetchMediaMessages, state.filters, state.sortOrder, directChatId])

  // Set filters and reset pagination
  const setFilters = useCallback(
    (filters: TMediaFilters) => {
      setState((prev) => {
        const newState = {
          ...prev,
          filters,
          currentPage: 1,
          items: [],
          hasMore: false,
          totalPages: 0,
          totalItems: 0,
        }

        // Fetch with new filters using current sort order
        if (directChatId && directChatId > 0) {
          fetchMediaMessages(1, filters, newState.sortOrder, false)
        }

        return newState
      })
    },
    [fetchMediaMessages, directChatId]
  )

  // Set sort order and reset pagination
  const setSortOrder = useCallback(
    (sort: "asc" | "desc") => {
      setState((prev) => {
        const newState = {
          ...prev,
          sortOrder: sort,
          currentPage: 1,
          items: [],
          hasMore: false,
          totalPages: 0,
          totalItems: 0,
        }

        // Fetch with new sort order using current filters
        if (directChatId && directChatId > 0) {
          fetchMediaMessages(1, newState.filters, sort, false)
        }

        return newState
      })
    },
    [fetchMediaMessages, directChatId]
  )

  // Reset pagination
  const resetPagination = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentPage: 1,
      items: [],
      hasMore: false,
      totalPages: 0,
      totalItems: 0,
      filters: initialFilters,
      sortOrder: initialSort,
    }))

    // Fetch initial data
    if (directChatId && directChatId > 0) {
      fetchMediaMessages(1, initialFilters, initialSort, false)
    }
  }, [initialFilters, initialSort, fetchMediaMessages, directChatId])

  // Initial load
  useEffect(() => {
    if (directChatId && directChatId > 0) {
      fetchMediaMessages(1, initialFilters, initialSort, false)
    }
  }, [directChatId, initialFilters, initialSort, fetchMediaMessages]) // Add directChatId and fetchMediaMessages to dependencies

  // Effect để lắng nghe socket events
  useEffect(() => {
    if (!directChatId) return

    // Lắng nghe tin nhắn mới/cập nhật từ socket
    clientSocket.socket.on(ESocketEvents.send_message_direct, handleMessageUpdate)

    return () => {
      clientSocket.socket.removeListener(ESocketEvents.send_message_direct, handleMessageUpdate)
    }
  }, [directChatId, handleMessageUpdate])

  return {
    // State
    items: state.items,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    totalItems: state.totalItems,

    // Actions
    loadMore,
    refresh,
    setFilters,
    setSortOrder,
    resetPagination,

    // Cache management
    clearCache,
    getCacheInfo,
  }
}
