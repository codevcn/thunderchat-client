import type { TSuccess } from "@/utils/types/global"
import { clientAxios, requestConfig } from "@/configs/axios"
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
  TUserReportHistoryData,
} from "@/utils/types/be-api"
import { EViolationReportStatus, EBanType } from "@/utils/enums"

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

// Violation Reports APIs
export const getViolationReports = (params: TGetAdminViolationReportsParams) =>
  clientAxios.get<TAdminViolationReportsData>("/admin/violation-reports", {
    ...requestConfig,
    params,
  })

export const getViolationReportDetail = (reportId: number) =>
  clientAxios.get<TAdminViolationReportDetail>(
    `/admin/violation-reports/${reportId}`,
    requestConfig
  )

export const updateViolationReportStatus = (reportId: number, status: EViolationReportStatus) =>
  clientAxios.put<TUpdateAdminViolationReportStatusResponse>(
    `/admin/violation-reports/${reportId}/status`,
    { status },
    requestConfig
  )

export const banReportedUser = (
  reportId: number,
  banType: EBanType,
  reason: string,
  banDuration?: number
) =>
  clientAxios.post<TAdminBanUserResponse>(
    `/admin/violation-reports/${reportId}/ban-user`,
    { banType, reason, banDuration },
    requestConfig
  )

export const getUserReportHistory = async (
  userId: number,
  type: "reported" | "reportedBy",
  page: number = 1,
  limit: number = 10
): Promise<TUserReportHistoryData> => {
  const params = new URLSearchParams({
    type,
    page: page.toString(),
    limit: limit.toString(),
  })

  const response = await clientAxios.get(
    `/admin/users/${userId}/report-history?${params}`,
    requestConfig
  )
  return response.data
}
