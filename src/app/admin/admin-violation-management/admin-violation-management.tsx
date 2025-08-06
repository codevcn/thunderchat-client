"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { ViolationDetailModal } from "./violation-detail-model"
import { useAdminViolationReports } from "@/hooks/use-admin-violation-reports"
import type {
  TAdminViolationReport,
  TViolationReportStatus,
  TViolationReportCategory,
} from "@/utils/types/be-api"
import { EViolationReportStatus, EReportCategory, EBanType } from "@/utils/enums"

// Statistics Card Component
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  icon: LucideIcon
  color: string
}) => (
  <div className="bg-regular-hover-card-cl p-6 rounded-lg border border-regular-hover-card-cl">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-regular-text-secondary-cl text-sm font-medium">{title}</p>
        <p className="text-regular-white-cl text-2xl font-bold">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="h-6 w-6 text-regular-white-cl" />
      </div>
    </div>
  </div>
)

// Status Badge Component
const StatusBadge = ({ status }: { status: TViolationReportStatus }) => {
  const statusConfig = {
    [EViolationReportStatus.PENDING]: {
      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      icon: Clock,
    },
    [EViolationReportStatus.RESOLVED]: {
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      icon: CheckCircle,
    },
    [EViolationReportStatus.DISMISSED]: {
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      icon: XCircle,
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${config.color}`}
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  )
}

// Category Badge Component
const CategoryBadge = ({ category }: { category: TViolationReportCategory }) => {
  const categoryConfig = {
    [EReportCategory.SENSITIVE_CONTENT]: {
      color: "bg-red-500/20 text-red-400",
      label: "Sensitive Content",
    },
    [EReportCategory.BOTHER]: { color: "bg-yellow-500/20 text-yellow-400", label: "Harassment" },
    [EReportCategory.FRAUD]: { color: "bg-orange-500/20 text-orange-400", label: "Fraud" },
    [EReportCategory.OTHER]: { color: "bg-gray-500/20 text-gray-400", label: "Other" },
  }

  const config = categoryConfig[category]

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
      {config.label}
    </span>
  )
}

// Pagination Component
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) => {
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-regular-hover-card-cl">
      <div className="text-sm text-regular-text-secondary-cl">
        Page {currentPage} of {totalPages}
      </div>

      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-2 text-sm border border-regular-hover-card-cl rounded-lg text-regular-text-secondary-cl hover:text-regular-white-cl hover:bg-regular-hover-card-cl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page Numbers */}
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 text-sm border rounded-lg ${
              page === currentPage
                ? "bg-regular-violet-cl text-regular-white-cl border-regular-violet-cl"
                : "border-regular-hover-card-cl text-regular-text-secondary-cl hover:text-regular-white-cl hover:bg-regular-hover-card-cl"
            }`}
          >
            {page}
          </button>
        ))}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-2 text-sm border border-regular-hover-card-cl rounded-lg text-regular-text-secondary-cl hover:text-regular-white-cl hover:bg-regular-hover-card-cl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export const AdminViolationManagement = () => {
  const {
    reports,
    loading,
    error,
    pagination,
    statistics,
    fetchReports,
    updateReportStatus,
    banUser,
  } = useAdminViolationReports()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<TViolationReportStatus | "ALL">("ALL")
  const [categoryFilter, setCategoryFilter] = useState<TViolationReportCategory | "ALL">("ALL")
  const [selectedViolation, setSelectedViolation] = useState<TAdminViolationReport | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Load initial data
  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // Filter violations
  useEffect(() => {
    fetchReports({
      search: searchTerm,
      status: statusFilter,
      category: categoryFilter,
    })
  }, [searchTerm, statusFilter, categoryFilter, fetchReports])

  const handleViewDetails = (violation: TAdminViolationReport) => {
    setSelectedViolation(violation)
    setIsDetailModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsDetailModalOpen(false)
    setSelectedViolation(null)
  }

  const handleUpdateStatus = async (reportId: number, status: TViolationReportStatus) => {
    const success = await updateReportStatus(reportId, status)
    if (success) {
      handleCloseModal()
    }
  }

  const handleBanUser = async (
    reportId: number,
    banType: EBanType,
    reason: string,
    banDuration?: number
  ) => {
    const success = await banUser(reportId, banType, reason, banDuration)
    if (success) {
      handleCloseModal()
    }
  }

  const handlePageChange = (page: number) => {
    fetchReports({
      page,
      search: searchTerm,
      status: statusFilter,
      category: categoryFilter,
    })
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-400 mb-4">❌ {error}</div>
        <button
          onClick={() => fetchReports()}
          className="px-4 py-2 bg-regular-violet-cl text-regular-white-cl rounded hover:bg-regular-tooltip-bgcl"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Reports"
          value={statistics.total}
          icon={FileText}
          color="bg-blue-500"
        />
        <StatCard title="Pending" value={statistics.pending} icon={Clock} color="bg-yellow-500" />
        <StatCard
          title="Resolved"
          value={statistics.resolved}
          icon={CheckCircle}
          color="bg-green-500"
        />
        <StatCard
          title="Dismissed"
          value={statistics.dismissed}
          icon={AlertTriangle}
          color="bg-blue-500"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 h-10 border border-regular-hover-card-cl rounded-lg focus:outline-none bg-regular-dark-gray-cl text-regular-white-cl placeholder-regular-placeholder-cl"
              style={{ minWidth: "300px" }}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-regular-text-secondary-cl" />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TViolationReportStatus | "ALL")}
            className="px-4 pr-10 h-10 border border-regular-hover-card-cl rounded-lg focus:outline-none bg-regular-dark-gray-cl text-regular-white-cl appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="ALL">All Status</option>
            <option value={EViolationReportStatus.PENDING}>Pending</option>
            <option value={EViolationReportStatus.RESOLVED}>Resolved</option>
            <option value={EViolationReportStatus.DISMISSED}>Dismissed</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as TViolationReportCategory | "ALL")}
            className="px-4 pr-10 h-10 border border-regular-hover-card-cl rounded-lg focus:outline-none bg-regular-dark-gray-cl text-regular-white-cl appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="ALL">All Categories</option>
            <option value={EReportCategory.SENSITIVE_CONTENT}>Sensitive Content</option>
            <option value={EReportCategory.BOTHER}>Harassment</option>
            <option value={EReportCategory.FRAUD}>Fraud</option>
            <option value={EReportCategory.OTHER}>Other</option>
          </select>
        </div>

        <div className="text-regular-text-secondary-cl text-sm">
          {reports.length} of {pagination.totalItems} reports
        </div>
      </div>

      {/* Violations Table */}
      <div className="bg-regular-dark-gray-cl border border-regular-hover-card-cl rounded-lg overflow-hidden">
        <div className="overflow-x-auto STYLE-styled-scrollbar">
          <table className="min-w-full divide-y divide-regular-hover-card-cl">
            <thead className="bg-regular-black-cl sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                  Report ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                  Reporter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                  Reported User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                  Evidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-regular-dark-gray-cl divide-y divide-regular-hover-card-cl">
              {loading
                ? // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-regular-hover-card-cl rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-regular-hover-card-cl rounded w-24 mb-1"></div>
                        <div className="h-3 bg-regular-hover-card-cl rounded w-32"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-regular-hover-card-cl rounded w-24 mb-1"></div>
                        <div className="h-3 bg-regular-hover-card-cl rounded w-32"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-6 bg-regular-hover-card-cl rounded-full w-20"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-6 bg-regular-hover-card-cl rounded-full w-16"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-regular-hover-card-cl rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-regular-hover-card-cl rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-regular-hover-card-cl rounded w-4"></div>
                      </td>
                    </tr>
                  ))
                : reports.map((violation) => (
                    <tr key={violation.id} className="hover:bg-regular-hover-card-cl">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-regular-white-cl">
                          #{violation.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-regular-white-cl">
                            {violation.reporterName}
                          </div>
                          <div className="text-sm text-regular-text-secondary-cl">
                            {violation.reporterEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-regular-white-cl">
                            {violation.reportedUserName}
                          </div>
                          <div className="text-sm text-regular-text-secondary-cl">
                            {violation.reportedUserEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CategoryBadge category={violation.reportCategory} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={violation.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-regular-white-cl">
                          {violation.evidenceCount.messages} msgs, {violation.evidenceCount.images}{" "}
                          imgs
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-regular-white-cl">
                          {new Date(violation.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetails(violation)}
                          className="text-regular-violet-cl hover:text-regular-tooltip-bgcl"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {reports.length === 0 && !loading && (
        <div className="text-center py-8 text-regular-text-secondary-cl">
          No violation reports found
        </div>
      )}

      {/* Detail Modal */}
      <ViolationDetailModal
        violation={selectedViolation}
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
        onUpdateStatus={handleUpdateStatus}
        onBanUser={handleBanUser}
      />
    </div>
  )
}
