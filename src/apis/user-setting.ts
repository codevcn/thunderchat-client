import { clientAxios } from "@/configs/axios"
import type { TGetUserSettingsRes, TUpdateUserSettingsReq } from "@/utils/types/fe-api"
import { requestConfig } from "@/configs/axios"

export const getUserSettings = () =>
  clientAxios.get<TGetUserSettingsRes>("/user-settings/me", requestConfig)

export const putUpdateUserSettings = (updates: Partial<TUpdateUserSettingsReq>) =>
  clientAxios.put<TGetUserSettingsRes>("/user-settings/me", updates, requestConfig)
