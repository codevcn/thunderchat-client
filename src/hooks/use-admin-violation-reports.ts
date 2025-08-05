import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { adminService } from "@/services/admin.service"
import type {
  TAdminViolationReport,
  TAdminViolationReportDetail,
  TGetAdminViolationReportsParams,
} from "@/utils/types/be-api"
import { EViolationReportStatus, EBanType } from "@/utils/enums"

export const useAdminViolationReports = () => {
  const [reports, setReports] = useState<TAdminViolationReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    dismissed: 0,
  })

  const fetchReports = useCallback(async (params: TGetAdminViolationReportsParams = {}) => {
    try {
      setLoading(true)
      setError(null)

      const response = await adminService.getViolationReports({
        page: params.page || 1,
        limit: params.limit || 10,
        search: params.search,
        status: params.status || "ALL",
        category: params.category || "ALL",
        startDate: params.startDate,
        endDate: params.endDate,
        sortBy: params.sortBy || "createdAt",
        sortOrder: params.sortOrder || "desc",
      })

      setReports(response.reports)
      setPagination(response.pagination)
      setStatistics(response.statistics)
    } catch (err: any) {
      console.error("Error fetching violation reports:", err)
      setError(err?.response?.data?.message || "Failed to fetch violation reports")
      toast.error("Failed to fetch violation reports")
    } finally {
      setLoading(false)
    }
  }, [])

  const updateReportStatus = useCallback(
    async (reportId: number, status: EViolationReportStatus) => {
      try {
        const response = await adminService.updateViolationReportStatus(reportId, status)

        if (response.success) {
          toast.success(response.message)
          // Refresh the reports list
          await fetchReports()
          return true
        } else {
          toast.error(response.message)
          return false
        }
      } catch (err: any) {
        console.error("Error updating report status:", err)
        toast.error(err?.response?.data?.message || "Failed to update report status")
        return false
      }
    },
    [fetchReports]
  )

  const banUser = useCallback(
    async (reportId: number, banType: EBanType, reason: string, banDuration?: number) => {
      try {
        const response = await adminService.banReportedUser(reportId, banType, reason, banDuration)

        if (response.success) {
          toast.success(response.message)
          // Refresh the reports list
          await fetchReports()
          return true
        } else {
          toast.error(response.message)
          return false
        }
      } catch (err: any) {
        console.error("Error banning user:", err)
        toast.error(err?.response?.data?.message || "Failed to ban user")
        return false
      }
    },
    [fetchReports]
  )

  return {
    reports,
    loading,
    error,
    pagination,
    statistics,
    fetchReports,
    updateReportStatus,
    banUser,
  }
}

export const useViolationReportDetail = (reportId: number | null) => {
  const [report, setReport] = useState<TAdminViolationReportDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReportDetail = useCallback(async () => {
    if (!reportId) return

    try {
      setLoading(true)
      setError(null)

      const response = await adminService.getViolationReportDetail(reportId)
      setReport(response)
    } catch (err: any) {
      console.error("Error fetching report detail:", err)
      setError(err?.response?.data?.message || "Failed to fetch report detail")
      toast.error("Failed to fetch report detail")
    } finally {
      setLoading(false)
    }
  }, [reportId])

  useEffect(() => {
    fetchReportDetail()
  }, [fetchReportDetail])

  return {
    report,
    loading,
    error,
    refetch: fetchReportDetail,
  }
}
