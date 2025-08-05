"use client"

import { useAdminAuth } from "@/hooks/admin-auth"
import { EAdminAuthStatus } from "@/utils/enums"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminNavigation } from "@/components/layout/admin-navigation"
import { adminService } from "@/services/admin.service"
import type { TAdminUserMessageStats, TAdminUserMessageStatsParams } from "@/utils/types/be-api"
import { toast } from "sonner"
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Users,
  Calendar,
  TrendingUp,
  Filter,
  RefreshCw,
} from "lucide-react"

const AdminMessageStats = () => {
  const { adminAuthStatus } = useAdminAuth()
  const router = useRouter()
  const [users, setUsers] = useState<TAdminUserMessageStats[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [params, setParams] = useState<TAdminUserMessageStatsParams>({
    page: 1,
    limit: 10,
    search: "",
    sortBy: "totalMessageCount",
    sortOrder: "desc",
  })

  useEffect(() => {
    if (adminAuthStatus === EAdminAuthStatus.UNAUTHENTICATED) {
      router.push("/admin")
    }
  }, [adminAuthStatus, router])

  const fetchUserMessageStats = async () => {
    try {
      setLoading(true)
      const data = await adminService.getUserMessageStats(params)
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching user message stats:", error)
      toast.error("Lỗi khi tải dữ liệu thống kê tin nhắn")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (adminAuthStatus === EAdminAuthStatus.AUTHENTICATED) {
      fetchUserMessageStats()
    }
  }, [adminAuthStatus, params])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchUserMessageStats()
  }

  if (adminAuthStatus === EAdminAuthStatus.UNKNOWN) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-base text-white mt-5 ml-4">Loading admin message stats...</p>
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
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleSearch = (value: string) => {
    setParams((prev) => ({ ...prev, search: value, page: 1 }))
  }

  const handleSort = (sortBy: TAdminUserMessageStatsParams["sortBy"]) => {
    setParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === "asc" ? "desc" : "asc",
      page: 1,
    }))
  }

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }))
  }

  const getSortIcon = (field: TAdminUserMessageStatsParams["sortBy"]) => {
    if (params.sortBy !== field) return null
    return params.sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <AdminNavigation />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-red-400">Thống kê tin nhắn người dùng</h1>
                <p className="text-gray-400 mt-2">Chi tiết số lượng tin nhắn của từng người dùng</p>
              </div>
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

          {/* Search and Filters */}
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo email hoặc tên..."
                    value={params.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400 text-sm">Sắp xếp theo:</span>
                <select
                  value={params.sortBy}
                  onChange={(e) =>
                    handleSort(e.target.value as TAdminUserMessageStatsParams["sortBy"])
                  }
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="totalMessageCount">Tổng tin nhắn</option>
                  <option value="directMessageCount">Tin nhắn trực tiếp</option>
                  <option value="groupMessageCount">Tin nhắn nhóm</option>
                  <option value="lastMessageAt">Tin nhắn cuối</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-base text-white mt-5 ml-4">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <>
              {/* Statistics Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-blue-200" />
                    <div>
                      <p className="text-blue-200 text-sm">Tổng người dùng</p>
                      <p className="text-2xl font-bold text-white">
                        {formatNumber(pagination.totalItems)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-8 h-8 text-green-200" />
                    <div>
                      <p className="text-green-200 text-sm">Tổng tin nhắn</p>
                      <p className="text-2xl font-bold text-white">
                        {formatNumber(users.reduce((sum, user) => sum + user.totalMessageCount, 0))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-purple-200" />
                    <div>
                      <p className="text-purple-200 text-sm">Trung bình/người</p>
                      <p className="text-2xl font-bold text-white">
                        {pagination.totalItems > 0
                          ? formatNumber(
                              Math.round(
                                users.reduce((sum, user) => sum + user.totalMessageCount, 0) /
                                  pagination.totalItems
                              )
                            )
                          : 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tạm ẩn phần "Hoạt động gần nhất"
                <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-orange-200" />
                    <div>
                      <p className="text-orange-200 text-sm">Hoạt động gần nhất</p>
                      <p className="text-lg font-bold text-white">
                        {(() => {
                          if (users.length === 0) return 'N/A'

                          // Tìm user có lastMessageAt gần nhất
                          const mostRecentUser = users.reduce((latest, current) => {
                            const latestTime = new Date(latest.lastMessageAt).getTime()
                            const currentTime = new Date(current.lastMessageAt).getTime()
                            return currentTime > latestTime ? current : latest
                          })

                          return formatDate(mostRecentUser.lastMessageAt)
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
                */}
              </div>

              {/* Users Table */}
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Người dùng
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                          onClick={() => handleSort("totalMessageCount")}
                        >
                          <div className="flex items-center gap-1">
                            Tổng tin nhắn
                            {getSortIcon("totalMessageCount")}
                          </div>
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                          onClick={() => handleSort("directMessageCount")}
                        >
                          <div className="flex items-center gap-1">
                            Tin nhắn trực tiếp
                            {getSortIcon("directMessageCount")}
                          </div>
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                          onClick={() => handleSort("groupMessageCount")}
                        >
                          <div className="flex items-center gap-1">
                            Tin nhắn nhóm
                            {getSortIcon("groupMessageCount")}
                          </div>
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                          onClick={() => handleSort("lastMessageAt")}
                        >
                          <div className="flex items-center gap-1">
                            Tin nhắn cuối
                            {getSortIcon("lastMessageAt")}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {users.map((user) => (
                        <tr key={user.userId} className="hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={user.avatar || "/default-avatar.png"}
                                  alt={user.fullName}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">
                                  {user.fullName}
                                </div>
                                <div className="text-sm text-gray-400">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
                            {formatNumber(user.totalMessageCount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400">
                            {formatNumber(user.directMessageCount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-400">
                            {formatNumber(user.groupMessageCount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {formatDate(user.lastMessageAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-400">
                    Hiển thị {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} -{" "}
                    {Math.min(
                      pagination.currentPage * pagination.itemsPerPage,
                      pagination.totalItems
                    )}{" "}
                    của {pagination.totalItems} người dùng
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="px-3 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <span className="px-3 py-2 text-white">
                      Trang {pagination.currentPage} / {pagination.totalPages}
                    </span>

                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="px-3 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminMessageStats
