import type { TSuccess } from "@/utils/types/global"
import { clientAxios, requestConfig } from "@/configs/axios"
import type {
  TBlockedUserFullInfo,
  TRegisterUserParams,
  TSearchUsersData,
  TSearchUsersParams,
  TUserWithProfile,
} from "../utils/types/be-api"

export const getUserByEmail = (email: string) =>
  clientAxios.get<TUserWithProfile>("/user/get-user?email=" + email)

export const postRegisterUser = (data: TRegisterUserParams) =>
  clientAxios.post<TSuccess>("/user/register", data, requestConfig)

export const getSearchUsers = (params: TSearchUsersParams) =>
  clientAxios.get<TSearchUsersData[]>("/user/search-users", { ...requestConfig, params })

export const postChangePassword = (data: { oldPassword: string; newPassword: string }) =>
  clientAxios.post("/user/change-password", data, requestConfig)

export const postBlockUser = (userId: number) =>
  clientAxios.post<TSuccess>("/user/block-user", { blockedUserId: userId }, requestConfig)

export const getCheckBlockedUser = (otherUserId: number) =>
  clientAxios.get<TBlockedUserFullInfo | null>("/user/check-blocked-user", {
    ...requestConfig,
    params: { otherUserId },
  })

export const postUnblockUser = (blockedUserId: number) =>
  clientAxios.post<TSuccess>("/user/unblock-user", { blockedUserId }, requestConfig)

export const getBlockedUsersList = () =>
  clientAxios.get<TBlockedUserFullInfo[]>("/user/get-blocked-users-list", requestConfig)

// Forgot password flow
export const postPasswordForgot = (email: string) =>
  clientAxios.post<TSuccess>("/user/password/forgot", { email }, requestConfig)

export const postPasswordVerifyOtp = (data: { email: string; otp: string }) =>
  clientAxios.post<{ resetToken: string }>("/user/password/verify-otp", data, requestConfig)

export const postPasswordReset = (data: { resetToken: string; newPassword: string }) =>
  clientAxios.post<TSuccess>("/user/password/reset", data, requestConfig)
