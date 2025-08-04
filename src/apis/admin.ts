import type { TSuccess } from "@/utils/types/global"
import { clientAxios, requestConfig } from "@/configs/axios"
import type {
  TAdminUsersData,
  TAdminUsersParams,
  TAdminUserActionParams,
  TAdminStatisticsData,
  TUpdateUserEmailResponse,
} from "../utils/types/be-api"

// Get users with pagination, search, and filters
export const getAdminUsers = (params: TAdminUsersParams) =>
  clientAxios.get<TAdminUsersData>("/admin/users", { ...requestConfig, params })

// Lock/Unlock user account
export const lockUnlockUser = (data: TAdminUserActionParams) =>
  clientAxios.put<TSuccess>("/admin/users/lock-unlock", data, requestConfig)

// Delete user account
export const deleteUser = (data: { userId: number }) =>
  clientAxios.delete<TSuccess>("/admin/users", { ...requestConfig, data })

// Get admin statistics
export const getAdminStatistics = () =>
  clientAxios.get<TAdminStatisticsData>("/admin/statistics", requestConfig)

// Update user email
export const updateUserEmail = (userId: number, email: string) =>
  clientAxios.put<TUpdateUserEmailResponse>(
    `/admin/users/${userId}/email`,
    { email },
    requestConfig
  )
