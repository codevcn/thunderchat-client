import { configureStore } from "@reduxjs/toolkit"
import { authSlice } from "@/redux/auth/auth.slice"
import { userSlice } from "./user/user.slice"
import { conversationsSlice } from "./conversations/conversations-slice"
import { messagesSlice } from "./messages/messages.slice"
import { settingsSlice } from "./settings/settings.slice"

const store = configureStore({
   reducer: {
      [authSlice.name]: authSlice.reducer,
      [userSlice.name]: userSlice.reducer,
      [conversationsSlice.name]: conversationsSlice.reducer,
      [messagesSlice.name]: messagesSlice.reducer,
      [settingsSlice.name]: settingsSlice.reducer,
   },
})

export default store

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
