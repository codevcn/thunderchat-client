import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import type { TConversationCard } from "@/utils/types/global"
import { TDeepPartial, THierarchyKeyObject } from "@/utils/types/utility-types"
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
    addConversations: (state, action: PayloadAction<TConversationCard[]>) => {
      state.conversations = [...(state.conversations || []), ...action.payload]
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
  },
})

export const { openInfoBar, addConversations, updateSingleConversation } =
  conversationsSlice.actions
