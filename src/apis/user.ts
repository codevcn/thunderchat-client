import type { TSuccess } from "@/utils/types/global"
import { clientAxios, requestConfig } from "@/configs/axios"
import type {
  TBlockedUserFullInfo,
  TRegisterUserParams,
  TSearchUsersData,
  TSearchUsersParams,
  TUserWithProfile,
} from "../utils/types/be-api"
import { EBlockTypes } from "@/utils/enums"

export const getUserByEmail = (email: string) =>
  clientAxios.get<TUserWithProfile>("/user/get-user?email=" + email)

export const postRegisterUser = (data: TRegisterUserParams) =>
  clientAxios.post<TSuccess>("/user/register", data, requestConfig)

export const getSearchUsers = (params: TSearchUsersParams) =>
  clientAxios.get<TSearchUsersData[]>("/user/search-users", { ...requestConfig, params })

export const postChangePassword = (data: { oldPassword: string; newPassword: string }) =>
  clientAxios.post("/user/change-password", data, requestConfig)

export const postBlockUser = (userId: number, blockType: EBlockTypes) =>
  clientAxios.post<TSuccess>(
    "/user/block-user",
    { blockedUserId: userId, blockType },
    requestConfig
  )

export const getCheckBlockedUser = (otherUserId: number) =>
  clientAxios.get<TBlockedUserFullInfo | null>("/user/check-blocked-user", {
    ...requestConfig,
    params: { otherUserId },
  })
