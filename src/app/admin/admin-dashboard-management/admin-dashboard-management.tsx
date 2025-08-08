"use client"

import { useAdminAuth } from "@/hooks/admin-auth"
import { EAdminAuthStatus } from "@/utils/enums"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { adminService } from "@/services/admin.service"
import type { TAdminOverviewData } from "@/utils/types/be-api"
import { DatePicker } from "@/components/materials/date-picker"
import { toast } from "sonner"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"
import {
  Users,
  MessageSquare,
  Users2,
  TrendingUp,
  Activity,
  MessageCircle,
  Group,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  X,
} from "lucide-react"

// Removed unused constant COLORS

export const AdminDashboardManagement = () => {
  const { adminAuthStatus } = useAdminAuth()
  const router = useRouter()
  const [overviewData, setOverviewData] = useState<TAdminOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ) // 30 ngày trước
  const [endDate, setEndDate] = useState<Date | undefined>(new Date()) // Hôm nay

  // Individual chart date ranges
  const [userGrowthPeriod, setUserGrowthPeriod] = useState<"7days" | "month" | "year">("month")
  const [messageActivityPeriod, setMessageActivityPeriod] = useState<"7days" | "month" | "year">(
    "month"
  )
  const [groupChatPeriod, setGroupChatPeriod] = useState<"7days" | "month" | "year">("month")

  // Individual chart loading states
  const [userGrowthLoading, setUserGrowthLoading] = useState(false)
  const [messageActivityLoading, setMessageActivityLoading] = useState(false)
  const [groupChatLoading, setGroupChatLoading] = useState(false)

  // Helper function to get date range based on period
  const getDateRangeFromPeriod = (period: "7days" | "month" | "year") => {
    const endDate = new Date()
    let startDate = new Date()

    switch (period) {
      case "7days":
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "month":
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
        break
      case "year":
        startDate = new Date(endDate.getFullYear(), 0, 1)
        break
    }

    return { startDate, endDate }
  }

  // Helper function to format date for API
  const formatDateForAPI = (date: Date) => {
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const year = utcDate.getUTCFullYear()
    const month = String(utcDate.getUTCMonth() + 1).padStart(2, "0")
    const day = String(utcDate.getUTCDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Fetch data for individual charts
  const fetchUserGrowthData = async (period: "7days" | "month" | "year") => {
    try {
      setUserGrowthLoading(true)
      const { startDate, endDate } = getDateRangeFromPeriod(period)
      const apiParams = {
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
        chartType: "userGrowth",
      }

      const data = await adminService.getOverview(apiParams)
      if (data.charts && data.charts.userGrowth) {
        setOverviewData((prev) =>
          prev
            ? {
                ...prev,
                charts: {
                  ...prev.charts,
                  userGrowth: data.charts!.userGrowth,
                },
              }
            : null
        )
      }
    } catch (error) {
      console.error("Error fetching user growth data:", error)
      toast.error("Unable to update user growth data")
    } finally {
      setUserGrowthLoading(false)
    }
  }

  const fetchMessageActivityData = async (period: "7days" | "month" | "year") => {
    try {
      setMessageActivityLoading(true)
      const { startDate, endDate } = getDateRangeFromPeriod(period)
      const apiParams = {
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
        chartType: "messageActivity",
      }

      const data = await adminService.getOverview(apiParams)
      if (data.charts && data.charts.messageActivity) {
        setOverviewData((prev) =>
          prev
            ? {
                ...prev,
                charts: {
                  ...prev.charts,
                  messageActivity: data.charts!.messageActivity,
                },
              }
            : null
        )
      }
    } catch (error) {
      console.error("Error fetching message activity data:", error)
      toast.error("Unable to update message activity data")
    } finally {
      setMessageActivityLoading(false)
    }
  }

  const fetchGroupChatData = async (period: "7days" | "month" | "year") => {
    try {
      setGroupChatLoading(true)
      const { startDate, endDate } = getDateRangeFromPeriod(period)
      const apiParams = {
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
        chartType: "groupChatActivity",
      }

      const data = await adminService.getOverview(apiParams)
      if (data.charts && data.charts.groupChatActivity) {
        setOverviewData((prev) =>
          prev
            ? {
                ...prev,
                charts: {
                  ...prev.charts,
                  groupChatActivity: data.charts!.groupChatActivity,
                },
              }
            : null
        )
      }
    } catch (error) {
      console.error("Error fetching group chat data:", error)
      toast.error("Unable to update group chat activity data")
    } finally {
      setGroupChatLoading(false)
    }
  }

  useEffect(() => {
    if (adminAuthStatus === EAdminAuthStatus.UNAUTHENTICATED) {
      router.push("/admin")
    }
  }, [adminAuthStatus, router])

  const fetchOverviewData = async () => {
    try {
      setLoading(true)
      // Format ngày để tránh vấn đề múi giờ - sử dụng UTC để đảm bảo tính nhất quán
      const formatDateForAPI = (date: Date) => {
        // Chuyển đổi sang UTC để tránh vấn đề múi giờ
        const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
        const year = utcDate.getUTCFullYear()
        const month = String(utcDate.getUTCMonth() + 1).padStart(2, "0")
        const day = String(utcDate.getUTCDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
      }

      const apiParams = {
        startDate: startDate ? formatDateForAPI(startDate) : undefined,
        endDate: endDate ? formatDateForAPI(endDate) : undefined,
      }

      console.log("API Params:", apiParams)
      console.log("Selected dates:", { startDate, endDate })
      console.log("Current local time:", new Date().toLocaleString("vi-VN"))
      console.log("Current UTC time:", new Date().toISOString())

      const data = await adminService.getOverview(apiParams)
      console.log("API Response timeRange:", data.timeRange)

      setOverviewData(data)
    } catch (error) {
      console.error("Error fetching overview data:", error)
      toast.error("Unable to load statistics data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (adminAuthStatus === EAdminAuthStatus.AUTHENTICATED && startDate && endDate) {
      fetchOverviewData()
    }
  }, [adminAuthStatus, startDate, endDate])

  // Auto-update individual charts when period changes
  useEffect(() => {
    if (adminAuthStatus === EAdminAuthStatus.AUTHENTICATED && overviewData) {
      fetchUserGrowthData(userGrowthPeriod)
    }
  }, [userGrowthPeriod])

  useEffect(() => {
    if (adminAuthStatus === EAdminAuthStatus.AUTHENTICATED && overviewData) {
      fetchMessageActivityData(messageActivityPeriod)
    }
  }, [messageActivityPeriod])

  useEffect(() => {
    if (adminAuthStatus === EAdminAuthStatus.AUTHENTICATED && overviewData) {
      fetchGroupChatData(groupChatPeriod)
    }
  }, [groupChatPeriod])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchOverviewData()
  }

  if (adminAuthStatus === EAdminAuthStatus.UNKNOWN) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-regular-violet-cl border-t-transparent rounded-full animate-spin"></div>
        <p className="text-base text-regular-white-cl mt-5 ml-4">Loading admin dashboard...</p>
      </div>
    )
  }

  if (adminAuthStatus === EAdminAuthStatus.UNAUTHENTICATED) {
    return null
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN")
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-regular-white-cl">Admin Dashboard</h1>
            <p className="text-regular-text-secondary-cl mt-2">System overview and statistics</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                loading || refreshing
                  ? "bg-regular-hover-card-cl text-regular-text-secondary-cl cursor-not-allowed"
                  : "bg-regular-violet-cl hover:bg-regular-tooltip-bgcl text-regular-white-cl hover:shadow-lg"
              }`}
              title="Update data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Updating..." : "Update"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-16 h-16 border-4 border-regular-violet-cl border-t-transparent rounded-full animate-spin"></div>
            <p className="text-base text-regular-white-cl mt-5 ml-4">Loading data...</p>
          </div>
        ) : overviewData ? (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Users Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium opacity-80">Total Users</p>
                    <p className="mt-2 text-3xl font-bold">
                      {formatNumber(overviewData.totalUsers)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3">
                    <Users className="h-6 w-6" />
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-white/5"></div>
                <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-white/5"></div>
              </div>

              {/* Active Users Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium opacity-80">Active Users</p>
                    <p className="mt-2 text-3xl font-bold">
                      {formatNumber(overviewData.activeUsers)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3">
                    <Activity className="h-6 w-6" />
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-white/5"></div>
                <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-white/5"></div>
              </div>

              {/* Total Messages Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium opacity-80">Total Messages</p>
                    <p className="mt-2 text-3xl font-bold">
                      {formatNumber(overviewData.totalMessages)}
                    </p>

                    <p className="mt-1 text-xs opacity-70">
                      {formatNumber(overviewData.totalDirectMessages)} direct,{" "}
                      {formatNumber(overviewData.totalGroupMessages)} group
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-white/5"></div>
                <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-white/5"></div>
              </div>

              {/* Active Group Chats Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium opacity-80">Active Group Chats</p>
                    <p className="mt-2 text-3xl font-bold">
                      {formatNumber(overviewData.activeGroupChats)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3">
                    <Users2 className="h-6 w-6" />
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-white/5"></div>
                <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-white/5"></div>
              </div>
            </div>
            {/* Violation Reports Statistics */}
            <div className="bg-gray-800 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                Violation Reports Statistics
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Custom Pie Chart */}
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center gap-8">
                    <div className="relative h-48 w-48">
                      <svg className="h-full w-full -rotate-90 transform">
                        <circle
                          cx="96"
                          cy="96"
                          r="80"
                          fill="none"
                          stroke="#374151"
                          strokeWidth="16"
                        />
                        {[
                          {
                            name: "Resolved",
                            value: overviewData.resolvedViolationReports,
                            color: "#10b981",
                          },
                          {
                            name: "Pending",
                            value: overviewData.pendingViolationReports,
                            color: "#f59e0b",
                          },
                          {
                            name: "Dismissed",
                            value: overviewData.dismissedViolationReports,
                            color: "#ef4444",
                          },
                        ].map((item, index) => {
                          const total =
                            overviewData.resolvedViolationReports +
                            overviewData.pendingViolationReports +
                            overviewData.dismissedViolationReports
                          const percentage = (item.value / total) * 100
                          const strokeDasharray = `${percentage * 5.02} 502`
                          const strokeDashoffset = [
                            { value: overviewData.resolvedViolationReports },
                            { value: overviewData.pendingViolationReports },
                            { value: overviewData.dismissedViolationReports },
                          ]
                            .slice(0, index)
                            .reduce((offset, prevItem) => {
                              return offset - (prevItem.value / total) * 502
                            }, 0)

                          return (
                            <circle
                              key={index}
                              cx="96"
                              cy="96"
                              r="80"
                              fill="none"
                              stroke={item.color}
                              strokeWidth="16"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset || 0}
                            />
                          )
                        })}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">
                            {formatNumber(overviewData.totalViolationReports)}
                          </div>
                          <div className="text-sm text-gray-400">Total Reports</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {[
                        {
                          name: "Resolved",
                          value: overviewData.resolvedViolationReports,
                          color: "#10b981",
                        },
                        {
                          name: "Pending",
                          value: overviewData.pendingViolationReports,
                          color: "#f59e0b",
                        },
                        {
                          name: "Dismissed",
                          value: overviewData.dismissedViolationReports,
                          color: "#ef4444",
                        },
                      ].map((item, index) => {
                        const total =
                          overviewData.resolvedViolationReports +
                          overviewData.pendingViolationReports +
                          overviewData.dismissedViolationReports
                        return (
                          <div key={index} className="flex items-center gap-3">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="text-sm text-gray-300">{item.name}</span>
                            <span className="text-sm font-medium text-white">
                              <span>{formatNumber(item.value)}</span> (
                              <span>
                                {total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0"}
                              </span>
                              %)
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Statistics Cards */}
                <div className="space-y-4">
                  <div className="rounded-lg bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6" />
                      <div>
                        <p className="text-sm opacity-90">Total Reports</p>
                        <p className="text-2xl font-bold">
                          {formatNumber(overviewData.totalViolationReports)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-emerald-50 p-4 text-center">
                      <CheckCircle className="mx-auto h-6 w-6 text-emerald-600" />
                      <p className="mt-2 text-sm text-emerald-600">Resolved</p>
                      <p className="text-xl font-bold text-emerald-900">
                        {formatNumber(overviewData.resolvedViolationReports)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-amber-50 p-4 text-center">
                      <Clock className="mx-auto h-6 w-6 text-amber-600" />
                      <p className="mt-2 text-sm text-amber-600">Pending</p>
                      <p className="text-xl font-bold text-amber-900">
                        {formatNumber(overviewData.pendingViolationReports)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-red-50 p-4 text-center">
                      <X className="mx-auto h-6 w-6 text-red-600" />
                      <p className="mt-2 text-sm text-red-600">Dismissed</p>
                      <p className="text-xl font-bold text-red-900">
                        {formatNumber(overviewData.dismissedViolationReports)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            {overviewData.charts && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* User Growth Chart */}
                  {overviewData.charts.userGrowth && (
                    <div className="bg-gray-800 p-6 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-400" />
                          User Growth
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300 text-xs">Period:</span>
                          <select
                            value={userGrowthPeriod}
                            onChange={(e) => {
                              const newPeriod = e.target.value as "7days" | "month" | "year"
                              setUserGrowthPeriod(newPeriod)
                              fetchUserGrowthData(newPeriod)
                            }}
                            disabled={userGrowthLoading}
                            className="bg-gray-700 border border-gray-600 text-gray-300 text-xs px-2 py-1 rounded disabled:opacity-50"
                          >
                            <option value="7days">7 days</option>
                            <option value="month">Month</option>
                            <option value="year">Year</option>
                          </select>
                          {userGrowthLoading && (
                            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </div>
                      </div>
                      {userGrowthLoading ? (
                        <div className="flex items-center justify-center h-[300px]">
                          <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-gray-300 text-sm ml-2">Updating...</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={overviewData.charts.userGrowth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                              dataKey="date"
                              stroke="#9CA3AF"
                              tickFormatter={(value) => formatDate(value)}
                            />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1F2937",
                                border: "1px solid #374151",
                                borderRadius: "8px",
                              }}
                              labelFormatter={(value) => formatDate(value)}
                            />
                            <Legend />
                            <Area
                              type="monotone"
                              dataKey="count"
                              stroke="#10B981"
                              fill="#10B981"
                              fillOpacity={0.3}
                              name="New Users"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  )}

                  {/* Message Activity Chart */}
                  {overviewData.charts.messageActivity && (
                    <div className="bg-gray-800 p-6 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-blue-400" />
                          Message Activity
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300 text-xs">Period:</span>
                          <select
                            value={messageActivityPeriod}
                            onChange={(e) => {
                              const newPeriod = e.target.value as "7days" | "month" | "year"
                              setMessageActivityPeriod(newPeriod)
                              fetchMessageActivityData(newPeriod)
                            }}
                            disabled={messageActivityLoading}
                            className="bg-gray-700 border border-gray-600 text-gray-300 text-xs px-2 py-1 rounded disabled:opacity-50"
                          >
                            <option value="7days">7 days</option>
                            <option value="month">Month</option>
                            <option value="year">Year</option>
                          </select>
                          {messageActivityLoading && (
                            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </div>
                      </div>
                      {messageActivityLoading ? (
                        <div className="flex items-center justify-center h-[300px]">
                          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-gray-300 text-sm ml-2">Updating...</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={overviewData.charts.messageActivity}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                              dataKey="date"
                              stroke="#9CA3AF"
                              tickFormatter={(value) => formatDate(value)}
                            />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1F2937",
                                border: "1px solid #374151",
                                borderRadius: "8px",
                              }}
                              labelFormatter={(value) => formatDate(value)}
                            />
                            <Legend />
                            <Area
                              type="monotone"
                              dataKey="count"
                              stroke="#3B82F6"
                              fill="#3B82F6"
                              fillOpacity={0.3}
                              name="Message Count"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  )}
                </div>

                {/* Group Chat Activity Chart */}
                {overviewData.charts.groupChatActivity && (
                  <div className="bg-gray-800 p-6 rounded-lg mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Group className="w-6 h-6 text-purple-400" />
                        Group Chat Activity
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300 text-xs">Period:</span>
                        <select
                          value={groupChatPeriod}
                          onChange={(e) => {
                            const newPeriod = e.target.value as "7days" | "month" | "year"
                            setGroupChatPeriod(newPeriod)
                            fetchGroupChatData(newPeriod)
                          }}
                          disabled={groupChatLoading}
                          className="bg-gray-700 border border-gray-600 text-gray-300 text-xs px-2 py-1 rounded disabled:opacity-50"
                        >
                          <option value="7days">7 days</option>
                          <option value="month">Month</option>
                          <option value="year">Year</option>
                        </select>
                        {groupChatLoading && (
                          <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </div>
                    </div>
                    {groupChatLoading ? (
                      <div className="flex items-center justify-center h-[300px]">
                        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-300 text-sm ml-2">Updating...</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={overviewData.charts.groupChatActivity}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis
                            dataKey="date"
                            stroke="#9CA3AF"
                            tickFormatter={(value) => formatDate(value)}
                          />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1F2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                            }}
                            labelFormatter={(value) => formatDate(value)}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#8B5CF6"
                            fill="#8B5CF6"
                            fillOpacity={0.3}
                            name="New Group Chats"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}

                {/* Message Type Distribution and Media Message Distribution Charts - Side by side */}
                {(overviewData.charts.messageTypeDistribution ||
                  overviewData.charts.mediaMessageDistribution) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Message Type Distribution Chart - Bar Chart */}
                    {overviewData.charts.messageTypeDistribution && (
                      <div className="bg-gray-800 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-orange-400" />
                          Message Type Distribution
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={overviewData.charts.messageTypeDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                              dataKey="type"
                              stroke="#9CA3AF"
                              tickFormatter={(value) => {
                                const typeLabels: Record<string, string> = {
                                  TEXT: "Text",
                                  STICKER: "Sticker",
                                  MEDIA: "Media",
                                }
                                return typeLabels[value] || value
                              }}
                            />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1F2937",
                                border: "1px solid #374151",
                                borderRadius: "8px",
                              }}
                              formatter={(value, name) => [formatNumber(Number(value)), "Count"]}
                            />
                            <Legend />
                            <Bar
                              dataKey="count"
                              fill="var(--tdc-regular-orange-cl)"
                              name="Message Count"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Media Message Distribution Chart - Stacked Bar Chart */}
                    {overviewData.charts.mediaMessageDistribution && (
                      <div className="bg-gray-800 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-cyan-400" />
                          Media Message Distribution
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={overviewData.charts.mediaMessageDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                              dataKey="type"
                              stroke="#9CA3AF"
                              tickFormatter={(value) => {
                                const typeLabels: Record<string, string> = {
                                  IMAGE: "Image",
                                  VIDEO: "Video",
                                  AUDIO: "Audio",
                                  DOCUMENT: "Document",
                                }
                                return typeLabels[value] || value
                              }}
                            />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1F2937",
                                border: "1px solid #374151",
                                borderRadius: "8px",
                              }}
                              formatter={(value, name) => [formatNumber(Number(value)), "Count"]}
                            />
                            <Legend />
                            <Bar
                              dataKey="count"
                              fill="var(--tdc-regular-violet-cl)"
                              name="Media Count"
                            >
                              {overviewData.charts.mediaMessageDistribution.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    entry.type === "IMAGE"
                                      ? "var(--tdc-regular-green-cl)"
                                      : entry.type === "VIDEO"
                                        ? "var(--tdc-regular-violet-cl)"
                                        : entry.type === "AUDIO"
                                          ? "var(--tdc-regular-orange-cl)"
                                          : entry.type === "DOCUMENT"
                                            ? "var(--tdc-regular-red-cl)"
                                            : "var(--tdc-regular-violet-cl)"
                                  }
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-regular-text-secondary-cl">Unable to load statistics data</p>
          </div>
        )}
      </div>
    </div>
  )
}
