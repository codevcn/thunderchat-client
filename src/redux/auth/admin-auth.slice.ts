import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import { EAdminAuthStatus } from "@/utils/enums"

type TAdminAuthState = {
  adminAuthStatus: EAdminAuthStatus
}

const initialState: TAdminAuthState = {
  adminAuthStatus: EAdminAuthStatus.UNKNOWN,
}

export const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    setAdminAuthStatus: (state, action: PayloadAction<EAdminAuthStatus>) => {
      state.adminAuthStatus = action.payload
    },
    resetAdminAuthStatus: (state) => {
      state.adminAuthStatus = EAdminAuthStatus.UNKNOWN
    },
  },
})

export const { resetAdminAuthStatus, setAdminAuthStatus } = adminAuthSlice.actions
