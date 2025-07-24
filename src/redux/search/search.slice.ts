import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import type { TGlobalSearchData } from "@/utils/types/be-api"

type TSearchState = {
  globalSearchResult: TGlobalSearchData | null
}

const initialState: TSearchState = {
  globalSearchResult: null,
}

export const searchSlice = createSlice({
  name: "search",
  initialState: initialState,
  reducers: {
    setGlobalSearchResult: (state, action: PayloadAction<TGlobalSearchData>) => {
      state.globalSearchResult = action.payload
    },
    clearGlobalSearchResult: (state) => {
      state.globalSearchResult = null
    },
  },
})

export const { setGlobalSearchResult, clearGlobalSearchResult } = searchSlice.actions
