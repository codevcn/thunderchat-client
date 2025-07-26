import { getUserSettings, updateUserSettings } from "@/apis/user-setting"

export const fetchUserSettings = async () => {
  return await getUserSettings()
}

export const updateUserSettingsService = async (onlyReceiveFriendMessage: boolean) => {
  return await updateUserSettings({ onlyReceiveFriendMessage })
}
