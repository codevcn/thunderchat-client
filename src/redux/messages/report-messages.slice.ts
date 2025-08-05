import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { EMessageTypes, ESortTypes, EPaginations } from "@/utils/enums"
import { messageService } from "@/services/message.service"
import type { TStateDirectMessage } from "@/utils/types/global"

// Types
export interface TReportMessagesState {
  messages: TStateDirectMessage[]
  loading: boolean
  hasMore: boolean
  error: string | null
  conversationId: number | null
}

// Async thunk để fetch report messages
export const fetchReportMessagesThunk = createAsyncThunk(
  "reportMessages/fetchMessages",
  async ({
    conversationId,
    offset = undefined,
    limit = EPaginations.DIRECT_MESSAGES_PAGE_SIZE,
  }: {
    conversationId: number
    offset?: number | undefined
    limit?: number
  }) => {
    const response = await messageService.fetchDirectMessages({
      directChatId: conversationId, // Use directChatId instead of conversationId
      msgOffset: offset, // Có thể là undefined cho initial fetch
      limit,
      sortType: ESortTypes.ASC,
      isFirstTime: offset === undefined || offset === 0,
    })

    return response
  }
)

// Initial state
const initialState: TReportMessagesState = {
  messages: [],
  loading: false,
  hasMore: true,
  error: null,
  conversationId: null,
}

// Slice
const reportMessagesSlice = createSlice({
  name: "reportMessages",
  initialState,
  reducers: {
    // Clear messages khi đổi conversation
    clearReportMessages: (state) => {
      state.messages = []
      state.hasMore = true
      state.error = null
      state.conversationId = null
    },
    // Set conversation ID
    setReportConversationId: (state, action: PayloadAction<number>) => {
      state.conversationId = action.payload
    },
    // Clear error
    clearReportError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch messages pending
      .addCase(fetchReportMessagesThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      // Fetch messages fulfilled
      .addCase(fetchReportMessagesThunk.fulfilled, (state, action) => {
        const currentMessages = state.messages || []
        const newMessages = action.payload.directMessages || []

        // Filter out unwanted message types from new messages first
        const filteredNewMessages = newMessages.filter(
          (msg: TStateDirectMessage) =>
            !msg.isDeleted &&
            msg.type !== EMessageTypes.STICKER &&
            msg.type !== EMessageTypes.PIN_NOTICE
        )

        // Merge và remove duplicates
        const allMessages = [...filteredNewMessages, ...currentMessages]
        const uniqueMessages = allMessages.reduce((acc: TStateDirectMessage[], current) => {
          const exists = acc.find((msg) => msg.id === current.id)
          if (!exists) {
            acc.push(current)
          }
          return acc
        }, [])

        state.messages = uniqueMessages.sort((a, b) => a.id - b.id)
        state.loading = false
        state.hasMore = newMessages.length === EPaginations.DIRECT_MESSAGES_PAGE_SIZE
      })
      // Fetch messages rejected
      .addCase(fetchReportMessagesThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch messages"
      })
  },
})

// Export actions
export const { clearReportMessages, setReportConversationId, clearReportError } =
  reportMessagesSlice.actions

// Export slice name and reducer
export const reportMessagesSliceName = reportMessagesSlice.name
export default reportMessagesSlice.reducer
