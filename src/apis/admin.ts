import type { TSuccess } from "@/utils/types/global"
import { clientAxios, requestConfig } from "@/configs/axios"
import type {
  TAdminUsersData,
  TAdminUsersParams,
  TAdminUserActionParams,
  TAdminStatisticsData,
  TUpdateUserEmailResponse,
  TAdminOverviewData,
  TAdminUserMessageStatsData,
  TAdminUserMessageStatsParams,
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

// Get admin overview statistics
export const getAdminOverview = (params?: {
  timeRange?: "day" | "week" | "month" | "year"
  startDate?: string
  endDate?: string
}) => {
  // Xử lý tham số để đảm bảo API nhận đúng format
  const apiParams: any = {}

  if (params?.startDate && params?.endDate) {
    // Ưu tiên startDate/endDate nếu có
    apiParams.startDate = params.startDate
    apiParams.endDate = params.endDate
  } else if (params?.timeRange) {
    // Sử dụng timeRange nếu không có startDate/endDate
    apiParams.timeRange = params.timeRange
  }

  return clientAxios.get<TAdminOverviewData>("/admin/overview", {
    ...requestConfig,
    params: apiParams,
  })
}

// Get admin user message statistics
export const getAdminUserMessageStats = (params: TAdminUserMessageStatsParams) =>
  clientAxios.get<TAdminUserMessageStatsData>("/admin/users/message-stats", {
    ...requestConfig,
    params,
  })
