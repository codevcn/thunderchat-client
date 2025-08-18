import type { TSettingsState } from "@/utils/types/global"
import type { TUserSettings } from "@/utils/types/be-api"

export const convertToSettingsState = (userSettings: TUserSettings): TSettingsState => {
  return {
    pushNotification: {
      enabled: userSettings.pushNotificationEnabled,
    },
    privacy: {
      onlyReceiveFriendMessage: userSettings.onlyReceiveFriendMessage,
    },
  }
}
