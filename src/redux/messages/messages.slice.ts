import type {
  TMessageStateUpdates,
  TRemoveGroupChatMemberState,
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
  TGroupChatMemberWithUser,
} from "@/utils/types/be-api"
import {
  fetchGroupChatMembersThunk,
  fetchGroupChatThunk,
} from "../conversations/conversations.thunks"
import { updateObjectByPath } from "@/utils/helpers"
import type { TDeepPartial, THierarchyKeyObject } from "@/utils/types/utility-types"

type TMessagesState = {
  directChat: TDirectChatData | null
  groupChat: TGroupChatData | null
  groupChatMembers: TGroupChatMemberWithUser[] | null
  directMessages: TStateDirectMessage[] | null
  groupMessages: TStateGroupMessage[] | null
  fetchedMsgs: boolean
  tempChatData: TDirectChatData | null
}

const initialState: TMessagesState = {
  directChat: null,
  groupChat: null,
  groupChatMembers: null,
  directMessages: null,
  groupMessages: null,
  fetchedMsgs: false,
  tempChatData: null,
}

export const messagesSlice = createSlice({
  initialState,
  name: "messages",
  reducers: {
    pushNewMessages: (state, action: PayloadAction<TStateDirectMessage[]>) => {
      const currentMessages = state.directMessages || []
      const newMessages = action.payload
      const ids = new Set(newMessages.map((m) => m.id))
      // Replace message cũ nếu trùng id, thêm mới nếu chưa có
      state.directMessages = [
        ...currentMessages.filter((m) => !ids.has(m.id)),
        ...newMessages,
      ].sort((a, b) => a.id - b.id)
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
    mergeMessages: (state, action: PayloadAction<TStateDirectMessage[]>) => {
      const currentMessages = state.directMessages || []
      const newMessages = action.payload
      const ids = new Set(currentMessages.map((m) => m.id))
      state.directMessages = [
        ...currentMessages,
        ...newMessages.filter((m) => !ids.has(m.id)),
      ].sort((a, b) => a.id - b.id)
    },
    updateGroupChat: (
      state,
      action: PayloadAction<TDeepPartial<THierarchyKeyObject<TGroupChatData>>>
    ) => {
      const updates = action.payload
      const groupChat = state.groupChat
      if (groupChat) {
        updateObjectByPath(groupChat, updates)
      }
    },
    removeGroupChatMember: (state, action: PayloadAction<TRemoveGroupChatMemberState>) => {
      const { memberId } = action.payload
      const groupChatMembers = state.groupChatMembers
      if (groupChatMembers) {
        state.groupChatMembers = groupChatMembers.filter((member) => member.id !== memberId)
      }
    },
    setDirectChat: (state, action: PayloadAction<TDirectChatData>) => {
      state.directChat = action.payload
    },
    setTempChatData: (state, action: PayloadAction<TDirectChatData>) => {
      state.tempChatData = action.payload
    },
    resetAllChatData: (state) => {
      // set all data to null except tempChatData
      state.directChat = null
      state.groupChat = null
      state.groupChatMembers = null
      state.directMessages = null
      state.groupMessages = null
      state.fetchedMsgs = false
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      fetchDirectMessagesThunk.fulfilled,
      (state, action: PayloadAction<TGetDirectMessagesData>) => {
        const currentMessages = state.directMessages
        const newMessages = action.payload.directMessages || []
        state.directMessages =
          currentMessages && currentMessages.length > 0
            ? [...newMessages, ...currentMessages]
            : newMessages
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
    builder.addCase(
      fetchGroupChatMembersThunk.fulfilled,
      (state, action: PayloadAction<TGroupChatMemberWithUser[]>) => {
        state.groupChatMembers = action.payload
      }
    )
  },
})

export const {
  pushNewMessages,
  updateMessages,
  updateGroupChat,
  removeGroupChatMember,
  setDirectChat,
  setTempChatData,
  resetAllChatData,
  mergeMessages,
} = messagesSlice.actions
