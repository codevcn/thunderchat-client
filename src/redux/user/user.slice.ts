import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import type { TUserWithoutPassword } from "@/utils/types/be-api"

type TUserState = {
   user: TUserWithoutPassword | null
}

const initialState: TUserState = {
   user: null,
}

export const userSlice = createSlice({
   name: "user",
   initialState,
   reducers: {
      setUser: (state, action: PayloadAction<TUserWithoutPassword>) => {
         state.user = action.payload
      },
      resetUser: (state) => {
         state.user = null
      },
   },
})

export const { resetUser, setUser } = userSlice.actions
