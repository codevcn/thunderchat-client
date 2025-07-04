import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import type { TDirectChatCard } from "@/utils/types/global"

type TDirectChatsState = {
   conversations: TDirectChatCard[] | null
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
   },
})

export const { openInfoBar } = conversationsSlice.actions
