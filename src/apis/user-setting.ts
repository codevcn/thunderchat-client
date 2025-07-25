import { clientAxios } from "@/configs/axios"
import type { TGetUserSettingsRes, TUpdateUserSettingsReq } from "@/utils/types/fe-api"
import { requestConfig } from "@/configs/axios"

export const getUserSettings = async (): Promise<TGetUserSettingsRes> => {
  try {
    const res = await clientAxios.get<TGetUserSettingsRes>("/user-settings/me", requestConfig)
    return res.data
  } catch (error) {
    console.error("Lỗi khi gọi getUserSettings:", error)
    throw error
  }
}

export const updateUserSettings = async (
  data: TUpdateUserSettingsReq
): Promise<TGetUserSettingsRes> => {
  try {
    const res = await clientAxios.put<TGetUserSettingsRes>("/user-settings/me", data, requestConfig)
    return res.data
  } catch (error) {
    console.error("Lỗi khi gọi updateUserSettings:", error)
    throw error
  }
}
