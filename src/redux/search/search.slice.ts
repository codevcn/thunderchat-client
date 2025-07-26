import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import type { TGlobalSearchData } from "@/utils/types/be-api"

type TSearchState = {
  globalSearchResult: TGlobalSearchData | null
  noMoreMessages: boolean
  noMoreUsers: boolean
}

const initialState: TSearchState = {
  globalSearchResult: null,
  noMoreMessages: false,
  noMoreUsers: false,
}

export const searchSlice = createSlice({
  name: "search",
  initialState: initialState,
  reducers: {
    setGlobalSearchResult: (state, action: PayloadAction<TGlobalSearchData>) => {
      state.globalSearchResult = action.payload
    },
    addMessages: (state, action: PayloadAction<TGlobalSearchData["messages"]>) => {
      if (state.globalSearchResult) {
        state.globalSearchResult.messages.push(...action.payload)
      }
    },
    addUsers: (state, action: PayloadAction<TGlobalSearchData["users"]>) => {
      if (state.globalSearchResult) {
        state.globalSearchResult.users.push(...action.payload)
      }
    },
    setNoMoreMessages: (state, action: PayloadAction<boolean>) => {
      state.noMoreMessages = action.payload
    },
    setNoMoreUsers: (state, action: PayloadAction<boolean>) => {
      state.noMoreUsers = action.payload
    },
    resetSearch: (state) => {
      state.globalSearchResult = null
      state.noMoreMessages = false
      state.noMoreUsers = false
    },
  },
})

export const {
  setGlobalSearchResult,
  addMessages,
  addUsers,
  setNoMoreMessages,
  setNoMoreUsers,
  resetSearch,
} = searchSlice.actions
