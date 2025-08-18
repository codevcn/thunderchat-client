import { updateObjectByPath } from "@/utils/helpers"
import type { TDeepPartial, THierarchyKeyObject } from "@/utils/types/utility-types"
import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import type { TSettingsState } from "@/utils/types/global"

const initialState: TSettingsState = {
  pushNotification: {
    enabled: false,
  },
  privacy: {
    onlyReceiveFriendMessage: false,
  },
}

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setPushNotificationEnabled: (state, action: PayloadAction<boolean>) => {
      state.pushNotification.enabled = action.payload
    },
    setOnlyReceiveFriendMessage: (state, action: PayloadAction<boolean>) => {
      state.privacy.onlyReceiveFriendMessage = action.payload
    },
    setSettings: (
      state,
      action: PayloadAction<TDeepPartial<THierarchyKeyObject<TSettingsState>>>
    ) => {
      const updates = action.payload
      updateObjectByPath<TSettingsState>(state, updates)
    },
  },
})

export const { setPushNotificationEnabled, setOnlyReceiveFriendMessage, setSettings } =
  settingsSlice.actions
