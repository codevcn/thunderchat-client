import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import type { TConversationCard } from "@/utils/types/global"

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
   },
})

export const { openInfoBar, addConversations } = conversationsSlice.actions
