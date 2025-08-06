import type {
  TLastSentMessageState,
  TMessageStateUpdates,
  TRemoveGroupChatMemberState,
  TStateDirectMessage,
  TStateGroupMessage,
} from "@/utils/types/global"
import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import type {
  TDirectChatData,
  TGroupChatData,
  TGroupChatMemberWithUser,
} from "@/utils/types/be-api"
import { updateObjectByPath } from "@/utils/helpers"
import type { TDeepPartial, THierarchyKeyObject } from "@/utils/types/utility-types"
import { EChatType } from "@/utils/enums"

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
    setFetchedMsgs: (state, action: PayloadAction<boolean>) => {
      state.fetchedMsgs = action.payload
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
    updateDirectChat: (
      state,
      action: PayloadAction<TDeepPartial<THierarchyKeyObject<TDirectChatData>>>
    ) => {
      const updates = action.payload
      const directChat = state.directChat
      if (directChat) {
        updateObjectByPath(directChat, updates)
      }
    },
    setLastSentMessage: (state, action: PayloadAction<TLastSentMessageState>) => {
      const { lastMessageId, chatType } = action.payload
      if (chatType === EChatType.DIRECT) {
        if (state.directChat) {
          state.directChat.lastSentMessageId = lastMessageId
        }
      } else if (chatType === EChatType.GROUP) {
        if (state.groupChat) {
          state.groupChat.lastSentMessageId = lastMessageId
        }
      }
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
    resetDirectMessages: (state) => {
      state.directMessages = null
    },
    setGroupChat: (state, action: PayloadAction<TGroupChatData>) => {
      state.groupChat = action.payload
    },
    setGroupChatMembers: (state, action: PayloadAction<TGroupChatMemberWithUser[]>) => {
      state.groupChatMembers = action.payload
    },
  },
})

export const {
  updateMessages,
  updateGroupChat,
  removeGroupChatMember,
  setDirectChat,
  setTempChatData,
  resetAllChatData,
  setFetchedMsgs,
  mergeMessages,
  updateDirectChat,
  setLastSentMessage,
  resetDirectMessages,
  setGroupChat,
  setGroupChatMembers,
} = messagesSlice.actions
