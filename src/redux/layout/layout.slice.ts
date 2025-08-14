import { createSlice, PayloadAction } from "@reduxjs/toolkit"

type TLayoutState = {
  openConvsList: boolean
}

const initialState: TLayoutState = {
  openConvsList: true,
}

export const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    setOpenConvsList: (state, action: PayloadAction<boolean>) => {
      state.openConvsList = action.payload
    },
  },
})

export const { setOpenConvsList } = layoutSlice.actions
