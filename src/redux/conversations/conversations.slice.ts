import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import type {
  TConversationCard,
  TRemoveConversationState,
  TUpdateUnreadMsgCountState,
} from "@/utils/types/global"
import type { TDeepPartial, THierarchyKeyObject } from "@/utils/types/utility-types"
import { updateObjectByPath } from "@/utils/helpers"

type TDirectChatsState = {
  conversations: TConversationCard[] | null
  infoBarIsOpened: boolean
}

const initialState: TDirectChatsState = {
  conversations: null,
  infoBarIsOpened: false,
}

export const conversationsSlice = createSlice({
  name: "conversations",
  initialState: initialState,
  reducers: {
    openInfoBar: (state, action: PayloadAction<boolean>) => {
      state.infoBarIsOpened = action.payload
    },
    setConversations: (state, action: PayloadAction<TConversationCard[]>) => {
      state.conversations = action.payload
    },
    addConversations: (state, action: PayloadAction<TConversationCard[]>) => {
      state.conversations = [...(state.conversations || []), ...action.payload]
    },
    clearConversations: (state) => {
      state.conversations = null
    },
    updateSingleConversation: (
      state,
      action: PayloadAction<TDeepPartial<THierarchyKeyObject<TConversationCard>>>
    ) => {
      const updates = action.payload
      const id = updates.id
      const conversations = state.conversations
      if (id && conversations) {
        for (const conversation of conversations) {
          if (conversation.id === id) {
            updateObjectByPath(conversation, updates)
          }
        }
      }
    },
    updateUnreadMsgCountOnCard: (state, action: PayloadAction<TUpdateUnreadMsgCountState>) => {
      const { count, conversationId } = action.payload
      const conversations = state.conversations
      if (conversations) {
        for (const conversation of conversations) {
          if (conversation.id === conversationId) {
            conversation.unreadMessageCount = count
          }
        }
      }
    },
    removeConversation: (state, action: PayloadAction<TRemoveConversationState>) => {
      const { conversationId, type } = action.payload
      const conversations = state.conversations
      if (conversations && conversations.length > 0) {
        state.conversations = conversations.filter(
          (conversation) => !(conversation.id === conversationId && conversation.type === type)
        )
      }
    },
  },
})

export const {
  openInfoBar,
  setConversations,
  addConversations,
  clearConversations,
  updateSingleConversation,
  updateUnreadMsgCountOnCard,
  removeConversation,
} = conversationsSlice.actions
