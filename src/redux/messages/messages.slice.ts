import type {
  TLastSentMessageState,
  TMessageStateUpdates,
  TRemoveGroupChatMemberState,
  TStateMessage,
} from "@/utils/types/global"
import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import type {
  TDirectChatData,
  TGroupChatData,
  TGroupChatMember,
  TGroupChatMemberWithUser,
  TGroupChatPermissionState,
} from "@/utils/types/be-api"
import { updateObjectByPath } from "@/utils/helpers"
import type { TDeepPartial, THierarchyKeyObject } from "@/utils/types/utility-types"
import { EChatType } from "@/utils/enums"

type TMessagesState = {
  directChat: TDirectChatData | null
  groupChat: TGroupChatData | null
  directMessages: TStateMessage[] | null
  groupMessages: TStateMessage[] | null
  fetchedMsgs: boolean
  blockedUserId: number | null
  groupChatPermissions: TGroupChatPermissionState | null
  userInGroupChat: TGroupChatMember | null
}

const initialState: TMessagesState = {
  directChat: null,
  groupChat: null,
  directMessages: null,
  groupMessages: null,
  fetchedMsgs: false,
  blockedUserId: null,
  groupChatPermissions: null,
  userInGroupChat: null,
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
    updateGroupMessages: (state, action: PayloadAction<TMessageStateUpdates[]>) => {
      const currentMessages = state.groupMessages
      const updatesList = action.payload
      if (currentMessages && currentMessages.length > 0) {
        state.groupMessages = currentMessages.map((msg) => {
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
    mergeMessages: (state, action: PayloadAction<TStateMessage[]>) => {
      const currentMessages = state.directMessages || []
      const newMessages = action.payload
      const ids = new Set(currentMessages.map((m) => m.id))
      state.directMessages = [
        ...currentMessages,
        ...newMessages.filter((m) => !ids.has(m.id)),
      ].sort((a, b) => a.id - b.id)
    },
    mergeGroupMessages: (state, action: PayloadAction<TStateMessage[]>) => {
      const currentMessages = state.groupMessages || []
      const newMessages = action.payload
      const ids = new Set(currentMessages.map((m) => m.id))
      state.groupMessages = [...currentMessages, ...newMessages.filter((m) => !ids.has(m.id))].sort(
        (a, b) => a.id - b.id
      )
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
      const { memberIds } = action.payload
      const groupChat = state.groupChat
      if (groupChat) {
        state.groupChat = {
          ...groupChat,
          Members: groupChat.Members.filter((member) => !memberIds.includes(member.User.id)),
        }
      }
    },
    addGroupChatMembers: (state, action: PayloadAction<TGroupChatMemberWithUser[]>) => {
      const members = action.payload
      const groupChat = state.groupChat
      if (groupChat) {
        state.groupChat = {
          ...groupChat,
          Members: [...(groupChat.Members || []), ...members],
        }
      }
    },
    setDirectChat: (state, action: PayloadAction<TDirectChatData | null>) => {
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
    resetAllChatData: (state) => {
      // set all data to null
      state.directChat = null
      state.groupChat = null
      state.directMessages = null
      state.groupMessages = null
      state.fetchedMsgs = false
      state.blockedUserId = null
    },
    resetDirectMessages: (state) => {
      state.directMessages = null
    },
    resetGroupMessages: (state) => {
      state.groupMessages = null
    },
    setGroupChat: (state, action: PayloadAction<TGroupChatData | null>) => {
      state.groupChat = action.payload
    },
    setBlockedUserId: (state, action: PayloadAction<number | null>) => {
      state.blockedUserId = action.payload
    },
    setGroupChatPermissions: (state, action: PayloadAction<TGroupChatPermissionState>) => {
      state.groupChatPermissions = action.payload
    },
    setUserInGroupChat: (state, action: PayloadAction<TGroupChatMember | null>) => {
      state.userInGroupChat = action.payload
    },
  },
})

export const {
  updateMessages,
  updateGroupMessages,
  updateGroupChat,
  removeGroupChatMember,
  setDirectChat,
  resetAllChatData,
  setFetchedMsgs,
  mergeMessages,
  mergeGroupMessages,
  updateDirectChat,
  setLastSentMessage,
  resetDirectMessages,
  resetGroupMessages,
  setGroupChat,
  addGroupChatMembers,
  setBlockedUserId,
  setGroupChatPermissions,
  setUserInGroupChat,
} = messagesSlice.actions
