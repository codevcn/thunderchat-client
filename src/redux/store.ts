import { configureStore } from "@reduxjs/toolkit"
import { authSlice } from "@/redux/auth/auth.slice"
import { adminAuthSlice } from "@/redux/auth/admin-auth.slice"
import { userSlice } from "./user/user.slice"
import { conversationsSlice } from "./conversations/conversations.slice"
import { messagesSlice } from "./messages/messages.slice"
import reportMessagesSlice, { reportMessagesSliceName } from "./messages/report-messages.slice"
import { settingsSlice } from "./settings/settings.slice"
import { searchSlice } from "./search/search.slice"
import profileSlice from "./user/profile.slice"
import { layoutSlice } from "./layout/layout.slice"
import { voiceCallSlice } from "./voice-call/layout.slice"

const store = configureStore({
  reducer: {
    [authSlice.name]: authSlice.reducer,
    [adminAuthSlice.name]: adminAuthSlice.reducer,
    [userSlice.name]: userSlice.reducer,
    [conversationsSlice.name]: conversationsSlice.reducer,
    [messagesSlice.name]: messagesSlice.reducer,
    [reportMessagesSliceName]: reportMessagesSlice,
    [settingsSlice.name]: settingsSlice.reducer,
    [searchSlice.name]: searchSlice.reducer,
    profile: profileSlice,
    [layoutSlice.name]: layoutSlice.reducer,
    [voiceCallSlice.name]: voiceCallSlice.reducer,
  },
})

export default store

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
