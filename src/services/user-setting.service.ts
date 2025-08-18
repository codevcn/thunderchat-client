import { getUserSettings, putUpdateUserSettings } from "@/apis/user-setting"
import type { TSettingsState } from "@/utils/types/global"
import { convertToSettingsState } from "@/utils/data-convertors/user-settings-convertor"
import { TUpdateUserSettingsReq } from "@/utils/types/fe-api"

class UserSettingService {
  async fetchUserSettings(): Promise<TSettingsState> {
    const { data } = await getUserSettings()
    return convertToSettingsState(data)
  }

  async updateUserSettings(updates: Partial<TUpdateUserSettingsReq>) {
    const { data } = await putUpdateUserSettings(updates)
    return convertToSettingsState(data)
  }
}

export const userSettingService = new UserSettingService()
