import type {
  TAdminUsersData,
  TAdminUsersParams,
  TAdminUserActionParams,
  TAdminStatisticsData,
  TUpdateUserEmailResponse,
  TAdminOverviewData,
  TAdminUserMessageStatsData,
  TAdminUserMessageStatsParams,
} from "@/utils/types/be-api"
import {
  getAdminUsers,
  lockUnlockUser,
  deleteUser,
  getAdminStatistics,
  updateUserEmail,
  getAdminOverview,
  getAdminUserMessageStats,
} from "@/apis/admin"
import type { TSuccess } from "@/utils/types/global"

class AdminService {
  async getUsers(params: TAdminUsersParams): Promise<TAdminUsersData> {
    const { data } = await getAdminUsers(params)
    return data
  }

  async lockUnlockUser(userId: number, isActive: boolean): Promise<TSuccess> {
    const { data } = await lockUnlockUser({ userId, isActive })
    return data
  }

  async deleteUser(userId: number): Promise<TSuccess> {
    const { data } = await deleteUser({ userId })
    return data
  }

  async getStatistics(): Promise<TAdminStatisticsData> {
    const { data } = await getAdminStatistics()
    return data
  }

  async updateUserEmail(userId: number, email: string): Promise<TUpdateUserEmailResponse> {
    const { data } = await updateUserEmail(userId, email)
    return data
  }

  async getOverview(params?: {
    timeRange?: "day" | "week" | "month" | "year"
    startDate?: string
    endDate?: string
  }): Promise<TAdminOverviewData> {
    // Nếu có startDate và endDate, ưu tiên sử dụng chúng thay vì timeRange
    const apiParams =
      params?.startDate && params?.endDate
        ? { startDate: params.startDate, endDate: params.endDate }
        : params

    const { data } = await getAdminOverview(apiParams)
    return data
  }

  async getUserMessageStats(
    params: TAdminUserMessageStatsParams
  ): Promise<TAdminUserMessageStatsData> {
    const { data } = await getAdminUserMessageStats(params)
    return data
  }
}

export const adminService = new AdminService()
