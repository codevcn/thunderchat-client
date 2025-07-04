import { PayloadAction, createSlice } from "@reduxjs/toolkit"

type TSettingsState = {
   theme: {
      chatBackground: string | null
   }
}

const initialState: TSettingsState = {
   theme: {
      chatBackground: null,
   },
}

export const settingsSlice = createSlice({
   name: "settings",
   initialState,
   reducers: {
      setChatBackground: (state, action: PayloadAction<string>) => {
         state.theme.chatBackground = action.payload
      },
   },
})

export const { setChatBackground } = settingsSlice.actions
