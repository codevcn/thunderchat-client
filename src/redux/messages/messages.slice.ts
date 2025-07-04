import type { TMessageStateUpdates, TStateDirectMessage } from "@/utils/types/global"
import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import { fetchDirectMessagesThunk } from "./messages.thunk"
import type { TDirectChatData, TGetDirectMessagesData } from "@/utils/types/be-api"
import { fetchDirectChatThunk } from "../conversations/conversations-thunks"

type TMessagesState = {
   directChat: TDirectChatData | null
   messages: TStateDirectMessage[] | null
   fetchedMsgs: boolean
}

const initialState: TMessagesState = {
   directChat: null,
   messages: null,
   fetchedMsgs: false,
}

export const messagesSlice = createSlice({
   initialState,
   name: "messages",
   reducers: {
      pushNewMessages: (state, action: PayloadAction<TStateDirectMessage[]>) => {
         const currentMessages = state.messages
         state.messages =
            currentMessages && currentMessages.length > 0
               ? [...currentMessages, ...action.payload]
               : action.payload
      },
      updateMessages: (state, action: PayloadAction<TMessageStateUpdates[]>) => {
         const currentMessages = state.messages
         const updatesList = action.payload
         if (currentMessages && currentMessages.length > 0) {
            state.messages = currentMessages.map((msg) => {
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
            const currentMessages = state.messages
            state.messages =
               currentMessages && currentMessages.length > 0
                  ? [...action.payload.directMessages, ...currentMessages]
                  : action.payload.directMessages
            state.fetchedMsgs = true
         }
      )
   },
})

export const { pushNewMessages, updateMessages } = messagesSlice.actions
