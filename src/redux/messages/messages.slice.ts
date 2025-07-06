import type {
  TMessageStateUpdates,
  TStateDirectMessage,
  TStateGroupMessage,
} from "@/utils/types/global"
import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import { fetchDirectMessagesThunk, fetchGroupMessagesThunk } from "./messages.thunk"
import type {
  TDirectChatData,
  TGetDirectMessagesData,
  TGetGroupMessagesData,
  TGroupChatData,
} from "@/utils/types/be-api"
import { fetchDirectChatThunk, fetchGroupChatThunk } from "../conversations/conversations-thunks"

type TMessagesState = {
  directChat: TDirectChatData | null
  groupChat: TGroupChatData | null
  directMessages: TStateDirectMessage[] | null
  groupMessages: TStateGroupMessage[] | null
  fetchedMsgs: boolean
}

const initialState: TMessagesState = {
  directChat: null,
  groupChat: null,
  directMessages: null,
  groupMessages: null,
  fetchedMsgs: false,
}

export const messagesSlice = createSlice({
  initialState,
  name: "messages",
  reducers: {
    pushNewMessages: (state, action: PayloadAction<TStateDirectMessage[]>) => {
      const currentMessages = state.directMessages
      state.directMessages =
        currentMessages && currentMessages.length > 0
          ? [...currentMessages, ...action.payload]
          : action.payload
    },
    updateMessages: (state, action: PayloadAction<TMessageStateUpdates[]>) => {
      const currentMessages = state.directMessages
      const updatesList = action.payload
      if (currentMessages && currentMessages.length > 0) {
        state.directMessages = currentMessages.map((msg) => {
          const updates = updatesList.find(({ msgId }) => msgId === msg.id)?.msgUpdates
          if (updates) {
            return {
              ...msg,
              ...updates,
            }
          }
          return msg
        })
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      fetchDirectChatThunk.fulfilled,
      (state, action: PayloadAction<TDirectChatData>) => {
        state.directChat = action.payload
      }
    )
    builder.addCase(
      fetchDirectMessagesThunk.fulfilled,
      (state, action: PayloadAction<TGetDirectMessagesData>) => {
        const currentMessages = state.directMessages
        state.directMessages =
          currentMessages && currentMessages.length > 0
            ? [...action.payload.directMessages, ...currentMessages]
            : action.payload.directMessages
        state.fetchedMsgs = true
      }
    )
    builder.addCase(
      fetchGroupChatThunk.fulfilled,
      (state, action: PayloadAction<TGroupChatData>) => {
        state.groupChat = action.payload
      }
    )
    builder.addCase(
      fetchGroupMessagesThunk.fulfilled,
      (state, action: PayloadAction<TGetGroupMessagesData>) => {
        const currentMessages = state.groupMessages
        state.groupMessages =
          currentMessages && currentMessages.length > 0
            ? [...action.payload.groupMessages, ...currentMessages]
            : action.payload.groupMessages
        state.fetchedMsgs = true
      }
    )
  },
})

export const { pushNewMessages, updateMessages } = messagesSlice.actions
