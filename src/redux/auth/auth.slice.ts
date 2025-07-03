import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import { EAuthStatus } from "@/utils/enums"

type TAuthState = {
   authStatus: EAuthStatus
}

const initialState: TAuthState = {
   authStatus: EAuthStatus.UNKNOWN,
}

export const authSlice = createSlice({
   name: "auth",
   initialState,
   reducers: {
      setAuthStatus: (state, action: PayloadAction<EAuthStatus>) => {
         state.authStatus = action.payload
      },
      resetAuthStatus: (state) => {
         state.authStatus = EAuthStatus.UNKNOWN
      },
   },
})

export const { resetAuthStatus, setAuthStatus } = authSlice.actions
