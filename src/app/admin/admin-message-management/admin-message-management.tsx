"use client"

import { useAdminAuth } from "@/hooks/admin-auth"
import { EAdminAuthStatus } from "@/utils/enums"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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

export const AdminMessageManagement = () => {
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
      toast.error("Error loading message statistics data")
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
        <div className="w-16 h-16 border-4 border-regular-violet-cl border-t-transparent rounded-full animate-spin"></div>
        <p className="text-base text-regular-white-cl mt-5 ml-4">
          Loading admin message statistics...
        </p>
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
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-regular-white-cl">User Message Statistics</h1>
              <p className="text-regular-text-secondary-cl mt-2">
                Detailed message count for each user
              </p>
            </div>
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

        {/* Search and Filters */}
        <div className="bg-regular-dark-gray-cl p-6 rounded-lg mb-6 border border-regular-hover-card-cl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-regular-text-secondary-cl w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={params.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-regular-black-cl border border-regular-hover-card-cl rounded-lg text-regular-white-cl placeholder-regular-placeholder-cl focus:outline-none focus:border-regular-violet-cl"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-regular-text-secondary-cl" />
              <span className="text-regular-text-secondary-cl text-sm">Sort by:</span>
              <select
                value={params.sortBy}
                onChange={(e) =>
                  handleSort(e.target.value as TAdminUserMessageStatsParams["sortBy"])
                }
                className="bg-regular-black-cl border border-regular-hover-card-cl rounded-lg px-3 py-2 text-regular-white-cl focus:outline-none focus:border-regular-violet-cl"
              >
                <option value="totalMessageCount">Total Messages</option>
                <option value="directMessageCount">Direct Messages</option>
                <option value="groupMessageCount">Group Messages</option>
                <option value="lastMessageAt">Last Message</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-16 h-16 border-4 border-regular-violet-cl border-t-transparent rounded-full animate-spin"></div>
            <p className="text-base text-regular-white-cl mt-5 ml-4">Loading data...</p>
          </div>
        ) : (
          <>
            {/* Statistics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Total Users Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium opacity-80">Total Users</p>
                    <p className="mt-1 text-2xl font-bold">{formatNumber(pagination.totalItems)}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-2">
                    <Users className="h-5 w-5" />
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -bottom-2 -right-2 h-16 w-16 rounded-full bg-white/5"></div>
                <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/5"></div>
              </div>

              {/* Total Messages Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium opacity-80">Total Messages</p>
                    <p className="mt-1 text-2xl font-bold">
                      {formatNumber(users.reduce((sum, user) => sum + user.totalMessageCount, 0))}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-2">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -bottom-2 -right-2 h-16 w-16 rounded-full bg-white/5"></div>
                <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/5"></div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-regular-dark-gray-cl rounded-lg overflow-hidden border border-regular-hover-card-cl">
              <div className="overflow-x-auto STYLE-styled-scrollbar">
                <table className="w-full">
                  <thead className="bg-regular-black-cl">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                        User
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider cursor-pointer hover:bg-regular-hover-card-cl"
                        onClick={() => handleSort("totalMessageCount")}
                      >
                        <div className="flex items-center gap-1">
                          Total Messages
                          {getSortIcon("totalMessageCount")}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider cursor-pointer hover:bg-regular-hover-card-cl"
                        onClick={() => handleSort("directMessageCount")}
                      >
                        <div className="flex items-center gap-1">
                          Direct Messages
                          {getSortIcon("directMessageCount")}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider cursor-pointer hover:bg-regular-hover-card-cl"
                        onClick={() => handleSort("groupMessageCount")}
                      >
                        <div className="flex items-center gap-1">
                          Group Messages
                          {getSortIcon("groupMessageCount")}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider cursor-pointer hover:bg-regular-hover-card-cl"
                        onClick={() => handleSort("lastMessageAt")}
                      >
                        <div className="flex items-center gap-1">
                          Last Message
                          {getSortIcon("lastMessageAt")}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-regular-dark-gray-cl divide-y divide-regular-hover-card-cl">
                    {users.map((user) => (
                      <tr key={user.userId} className="hover:bg-regular-hover-card-cl">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 ">
                            <div className="text-sm font-medium text-regular-white-cl">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-regular-text-secondary-cl">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-regular-white-cl font-semibold">
                          {formatNumber(user.totalMessageCount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400">
                          {formatNumber(user.directMessageCount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-400">
                          {formatNumber(user.groupMessageCount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-regular-text-secondary-cl">
                          {user.lastMessageAt ? formatDate(user.lastMessageAt) : "-"}
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
                <div className="text-sm text-regular-text-secondary-cl">
                  Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} -{" "}
                  {Math.min(
                    pagination.currentPage * pagination.itemsPerPage,
                    pagination.totalItems
                  )}{" "}
                  of {pagination.totalItems} users
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-3 py-2 bg-regular-dark-gray-cl text-regular-white-cl rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-regular-hover-card-cl border border-regular-hover-card-cl"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-2 text-regular-white-cl">
                    Page {pagination.currentPage} / {pagination.totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-2 bg-regular-dark-gray-cl text-regular-white-cl rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-regular-hover-card-cl border border-regular-hover-card-cl"
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
  )
}
