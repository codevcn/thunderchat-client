import { getUserSettings, updateUserSettings } from "@/apis/user-setting"

class UserSettingService {
  async fetchUserSettings() {
    return await getUserSettings()
  }

  async updateOnlyReceiveFriendMessage(onlyReceiveFriendMessage: boolean) {
    return await updateUserSettings({ onlyReceiveFriendMessage })
  }
}

export const userSettingService = new UserSettingService()
