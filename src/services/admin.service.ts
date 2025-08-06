import type {
  TAdminUsersData,
  TAdminUsersParams,
  TAdminUserActionParams,
  TAdminStatisticsData,
  TUpdateUserEmailResponse,
  TAdminViolationReportsData,
  TGetAdminViolationReportsParams,
  TAdminViolationReportDetail,
  TUpdateAdminViolationReportStatusResponse,
  TAdminBanUserResponse,
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
  getViolationReports,
  getViolationReportDetail,
  updateViolationReportStatus,
  banReportedUser,
  getAdminOverview,
  getAdminUserMessageStats,
} from "@/apis/admin"
import type { TSuccess } from "@/utils/types/global"
import { EViolationReportStatus, EBanType } from "@/utils/enums"

class AdminService {
  // User Management Methods
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

  // Violation Reports Methods
  async getViolationReports(
    params: TGetAdminViolationReportsParams
  ): Promise<TAdminViolationReportsData> {
    const { data } = await getViolationReports(params)
    return data
  }

  async getViolationReportDetail(reportId: number): Promise<TAdminViolationReportDetail> {
    const { data } = await getViolationReportDetail(reportId)
    return data
  }

  async updateViolationReportStatus(
    reportId: number,
    status: EViolationReportStatus
  ): Promise<TUpdateAdminViolationReportStatusResponse> {
    const { data } = await updateViolationReportStatus(reportId, status)
    return data
  }

  async banReportedUser(
    reportId: number,
    banType: EBanType,
    reason: string,
    banDuration?: number
  ): Promise<TAdminBanUserResponse> {
    const { data } = await banReportedUser(reportId, banType, reason, banDuration)
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
