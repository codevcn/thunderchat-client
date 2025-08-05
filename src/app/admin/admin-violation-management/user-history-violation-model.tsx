"use client"

import { XCircle, Users, UserCheck, UserX } from "lucide-react"
import { useState, useEffect } from "react"
import type {
  TViolationReportStatus,
  TViolationReportCategory,
  TUserReportHistoryData,
} from "@/utils/types/be-api"
import { EViolationReportStatus } from "@/utils/enums"
import { getUserReportHistory } from "@/apis/admin"

// Status Badge Component
const StatusBadge = ({ status }: { status: TViolationReportStatus }) => {
  const statusConfig = {
    [EViolationReportStatus.PENDING]: {
      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      icon: "⏰",
    },
    [EViolationReportStatus.RESOLVED]: {
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      icon: "✅",
    },
    [EViolationReportStatus.DISMISSED]: {
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      icon: "❌",
    },
  }

  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${config.color}`}
    >
      <span>{config.icon}</span>
      {status}
    </span>
  )
}

// Category Badge Component
const CategoryBadge = ({ category }: { category: TViolationReportCategory }) => {
  const categoryConfig = {
    SENSITIVE_CONTENT: { color: "bg-red-500/20 text-red-400", label: "Sensitive Content" },
    BOTHER: { color: "bg-yellow-500/20 text-yellow-400", label: "Harassment" },
    FRAUD: { color: "bg-orange-500/20 text-orange-400", label: "Fraud" },
    OTHER: { color: "bg-gray-500/20 text-gray-400", label: "Other" },
  }

  const config = categoryConfig[category]

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
      {config.label}
    </span>
  )
}

interface UserReportHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  userId: number
  userName: string
  userEmail: string
}

export const UserReportHistoryModal = ({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
}: UserReportHistoryModalProps) => {
  const [activeTab, setActiveTab] = useState<"reported" | "reportedBy">("reported")
  const [loading, setLoading] = useState(false)
  const [reportedData, setReportedData] = useState<TUserReportHistoryData | null>(null)
  const [reportedByData, setReportedByData] = useState<TUserReportHistoryData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserReportHistory()
    }
  }, [isOpen, userId, activeTab])

  const fetchUserReportHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getUserReportHistory(userId, activeTab)

      if (activeTab === "reported") {
        setReportedData(result)
      } else {
        setReportedByData(result)
      }
    } catch (error: any) {
      console.error("Error fetching user report history:", error)
      setError(error.response?.data?.message || "Failed to fetch report history")
    } finally {
      setLoading(false)
    }
  }

  // Get current data based on active tab
  const currentData = activeTab === "reported" ? reportedData : reportedByData

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-regular-dark-gray-cl rounded-lg w-full max-w-4xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-regular-hover-card-cl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-regular-white-cl">User Report History</h3>
              <p className="text-regular-text-secondary-cl text-sm mt-1">
                {userName} ({userEmail})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-regular-text-secondary-cl hover:text-regular-white-cl"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-regular-hover-card-cl">
          <button
            onClick={() => setActiveTab("reported")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "reported"
                ? "text-regular-violet-cl border-b-2 border-regular-violet-cl"
                : "text-regular-text-secondary-cl hover:text-regular-white-cl"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserX className="h-4 w-4" />
              Reports made by this user ({reportedData?.reports.length || 0})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("reportedBy")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "reportedBy"
                ? "text-regular-violet-cl border-b-2 border-regular-violet-cl"
                : "text-regular-text-secondary-cl hover:text-regular-white-cl"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserCheck className="h-4 w-4" />
              Reports about this user ({reportedByData?.reports.length || 0})
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto STYLE-styled-modal-scrollbar p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-regular-violet-cl mx-auto"></div>
              <p className="text-regular-text-secondary-cl text-sm mt-2">
                Loading report history...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={fetchUserReportHistory}
                className="mt-4 px-4 py-2 bg-regular-violet-cl text-regular-white-cl rounded-lg hover:bg-regular-tooltip-bgcl transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {currentData?.reports && currentData.reports.length > 0 ? (
                currentData.reports.map((report) => (
                  <div key={report.id} className="bg-regular-hover-card-cl p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CategoryBadge category={report.reportCategory} />
                        <StatusBadge status={report.status} />
                      </div>
                      <span className="text-regular-text-secondary-cl text-xs">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {report.reasonText && (
                      <p className="text-regular-white-cl text-sm">{report.reasonText}</p>
                    )}
                    {/* Show additional info based on tab */}
                    {activeTab === "reported" && report.reportedUserName && (
                      <p className="text-regular-text-secondary-cl text-xs mt-2">
                        Reported user: {report.reportedUserName}
                      </p>
                    )}
                    {activeTab === "reportedBy" && report.reporterName && (
                      <p className="text-regular-text-secondary-cl text-xs mt-2">
                        Reporter: {report.reporterName}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-regular-text-secondary-cl mx-auto mb-3" />
                  <p className="text-regular-text-secondary-cl">
                    {activeTab === "reported"
                      ? "No reports made by this user"
                      : "No reports about this user"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
