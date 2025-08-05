import type { TSuccess } from "@/utils/types/global"
import { clientAxios, requestConfig } from "@/configs/axios"
import type { TLoginUserParams, TUserWithProfile } from "../utils/types/be-api"

export const postLoginUser = (data: TLoginUserParams) =>
  clientAxios.post<TSuccess>("/auth/login", data, requestConfig)

export const getCheckAuth = () =>
  clientAxios.get<TUserWithProfile>("/auth/check-auth", requestConfig)

export const postLogoutUser = () => clientAxios.post<TSuccess>("/auth/logout", {}, requestConfig)
// Admin APIs
export const postAdminLogin = (data: TLoginUserParams) =>
  clientAxios.post<TSuccess>("/auth/admin/login", data, requestConfig)

export const getAdminCheckAuth = () =>
  clientAxios.get<TUserWithProfile>("/auth/admin/check-auth", requestConfig)

// Check if email has admin privileges
export const checkEmailIsAdmin = (email: string) =>
  clientAxios.post<{ isAdmin: boolean }>("/auth/admin/check-email", { email }, requestConfig)
