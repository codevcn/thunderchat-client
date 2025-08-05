"use client"

import { useAdminAuth } from "@/hooks/admin-auth"
import { EAdminAuthStatus } from "@/utils/enums"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminNavigation } from "@/components/layout/admin-navigation"
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
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Users,
  MessageSquare,
  Users2,
  TrendingUp,
  Calendar,
  Activity,
  UserPlus,
  MessageCircle,
  Group,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

const AdminDashboard = () => {
  const { adminAuthStatus } = useAdminAuth()
  const router = useRouter()
  const [overviewData, setOverviewData] = useState<TAdminOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ) // 30 ngày trước
  const [endDate, setEndDate] = useState<Date | undefined>(new Date()) // Hôm nay

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
      toast.error("Không thể tải dữ liệu thống kê")
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

  const handleRefresh = () => {
    setRefreshing(true)
    fetchOverviewData()
  }

  if (adminAuthStatus === EAdminAuthStatus.UNKNOWN) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-base text-white mt-5 ml-4">Loading admin dashboard...</p>
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
    <div className="flex min-h-screen bg-gray-900 text-white">
      <AdminNavigation />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-red-400">Admin Dashboard</h1>
              <p className="text-gray-400 mt-2">Tổng quan hệ thống và thống kê</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Custom Date Range */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Từ:</span>
                <DatePicker
                  initialDate={startDate}
                  onDateChange={(date: Date) => {
                    // Validation: Không cho phép chọn ngày bắt đầu sau ngày kết thúc
                    if (endDate && date > endDate) {
                      toast.error("Ngày bắt đầu không thể sau ngày kết thúc")
                      return // Không cập nhật nếu ngày bắt đầu sau ngày kết thúc
                    }
                    setStartDate(date)
                  }}
                  btnClassName="bg-gray-800 border border-gray-600 text-white text-sm"
                  withAnInput={true}
                  inputClassName="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  inputPlaceholder="Chọn ngày bắt đầu"
                  inputId="start-date"
                  inputName="startDate"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Đến:</span>
                <DatePicker
                  initialDate={endDate}
                  onDateChange={(date: Date) => {
                    // Validation: Không cho phép chọn ngày kết thúc trước ngày bắt đầu
                    if (startDate && date < startDate) {
                      toast.error("Ngày kết thúc không thể trước ngày bắt đầu")
                      return // Không cập nhật nếu ngày kết thúc trước ngày bắt đầu
                    }
                    setEndDate(date)
                  }}
                  btnClassName="bg-gray-800 border border-gray-600 text-white text-sm"
                  withAnInput={true}
                  inputClassName="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  inputPlaceholder="Chọn ngày kết thúc"
                  inputId="end-date"
                  inputName="endDate"
                />
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  loading || refreshing
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg"
                }`}
                title="Cập nhật dữ liệu"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Đang cập nhật..." : "Cập nhật"}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-base text-white mt-5 ml-4">Đang tải dữ liệu...</p>
            </div>
          ) : overviewData ? (
            <>
              {/* Time Range Info */}
              <div className="bg-gray-800 p-6 rounded-lg mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-yellow-400" />
                  Thông tin khoảng thời gian đã chọn
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Từ ngày</p>
                    <p className="text-white font-medium">
                      {startDate ? formatDate(startDate.toISOString()) : "Chưa chọn"}
                    </p>
                  </div>
                  <div>
                    <div>
                      <p className="text-gray-400 text-sm">Đến ngày</p>
                      <p className="text-white font-medium">
                        {endDate ? formatDate(endDate.toISOString()) : "Chưa chọn"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Tổng ngày</p>
                    <p className="text-white font-medium">
                      {startDate && endDate
                        ? Math.ceil(
                            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                          ) + 1
                        : 0}{" "}
                      ngày
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-200 text-sm font-medium">Tổng người dùng</p>
                      <p className="text-2xl font-bold text-white">
                        {formatNumber(overviewData.totalUsers)}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-200 text-sm font-medium">Người dùng hoạt động</p>
                      <p className="text-2xl font-bold text-white">
                        {formatNumber(overviewData.activeUsers)}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-purple-200 text-sm font-medium">Tổng tin nhắn</p>
                      <p className="text-2xl font-bold text-white">
                        {formatNumber(overviewData.totalMessages)}
                      </p>
                    </div>
                    <MessageCircle className="w-8 h-8 text-purple-200" />
                  </div>

                  {/* Breakdown */}
                  <div className="border-t border-purple-500/30 pt-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-purple-300 text-xs font-medium mb-1">Trực tiếp</p>
                        <p className="text-white text-lg font-semibold">
                          {formatNumber(overviewData.totalDirectMessages)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-purple-300 text-xs font-medium mb-1">Nhóm</p>
                        <p className="text-white text-lg font-semibold">
                          {formatNumber(overviewData.totalGroupMessages)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-200 text-sm font-medium">Nhóm chat hoạt động</p>
                      <p className="text-2xl font-bold text-white">
                        {formatNumber(overviewData.activeGroupChats)}
                      </p>
                    </div>
                    <Users2 className="w-8 h-8 text-orange-200" />
                  </div>
                </div>
              </div>

              {/* Additional Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-200 text-sm font-medium">Báo cáo vi phạm</p>
                      <p className="text-2xl font-bold text-white">
                        {formatNumber(overviewData.totalViolationReports)}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-200 text-sm font-medium">Đã giải quyết</p>
                      <p className="text-2xl font-bold text-white">
                        {formatNumber(overviewData.resolvedViolationReports)}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-emerald-200" />
                  </div>
                </div>
              </div>

              {/* Period Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <UserPlus className="w-6 h-6 text-green-400" />
                    <h3 className="text-lg font-semibold">Người dùng</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-400">
                    {formatNumber(overviewData.newUsersThisPeriod)}
                  </p>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <MessageCircle className="w-6 h-6 text-blue-400" />
                    <h3 className="text-lg font-semibold">Tin nhắn</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-400">
                    {formatNumber(overviewData.messagesThisPeriod)}
                  </p>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <Group className="w-6 h-6 text-purple-400" />
                    <h3 className="text-lg font-semibold">Nhóm chat</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-400">
                    {formatNumber(overviewData.groupChatsThisPeriod)}
                  </p>
                </div>
              </div>

              {/* Violation Reports Statistics */}
              <div className="bg-gray-800 p-6 rounded-lg mb-8">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  Thống kê báo cáo vi phạm
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Pie Chart */}
                  <div className="flex justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Đã giải quyết",
                              value: overviewData.resolvedViolationReports,
                              color: "#10B981",
                            },
                            {
                              name: "Chờ xử lý",
                              value: overviewData.pendingViolationReports,
                              color: "#F59E0B",
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                          }
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            {
                              name: "Đã giải quyết",
                              value: overviewData.resolvedViolationReports,
                              color: "#10B981",
                            },
                            {
                              name: "Chờ xử lý",
                              value: overviewData.pendingViolationReports,
                              color: "#F59E0B",
                            },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            color: "#FFFFFF",
                          }}
                          formatter={(value, name) => [formatNumber(Number(value)), name]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <span className="text-gray-300 text-sm">Tổng báo cáo</span>
                      </div>
                      <p className="text-3xl font-bold text-red-400">
                        {formatNumber(overviewData.totalViolationReports)}
                      </p>
                    </div>

                    <div className="text-center bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-gray-300 text-sm">Đã giải quyết</span>
                      </div>
                      <p className="text-3xl font-bold text-green-400">
                        {formatNumber(overviewData.resolvedViolationReports)}
                      </p>
                    </div>

                    <div className="text-center bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-yellow-400" />
                        <span className="text-gray-300 text-sm">Chờ xử lý</span>
                      </div>
                      <p className="text-3xl font-bold text-yellow-400">
                        {formatNumber(overviewData.pendingViolationReports)}
                      </p>
                    </div>

                    <div className="text-center bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-gray-300 text-sm">Tỷ lệ giải quyết</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-400">
                        {overviewData.totalViolationReports > 0
                          ? Math.round(
                              (overviewData.resolvedViolationReports /
                                overviewData.totalViolationReports) *
                                100
                            )
                          : 0}
                        %
                      </p>
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
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-400" />
                          Tăng trưởng người dùng
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={overviewData.charts.userGrowth}>
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
                            <Line
                              type="monotone"
                              dataKey="count"
                              stroke="#10B981"
                              strokeWidth={2}
                              name="Số người dùng mới"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Message Activity Chart */}
                    {overviewData.charts.messageActivity && (
                      <div className="bg-gray-800 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-blue-400" />
                          Hoạt động tin nhắn
                        </h3>
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
                              name="Số tin nhắn"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Group Chat Activity Chart */}
                  {overviewData.charts.groupChatActivity && (
                    <div className="bg-gray-800 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Group className="w-6 h-6 text-purple-400" />
                        Hoạt động nhóm chat
                      </h3>
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
                            name="Số nhóm chat mới"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">Không thể tải dữ liệu thống kê</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
