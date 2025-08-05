"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Search,
  ChevronDown,
  Edit,
  X,
  Check,
  Users,
  Filter,
  Calendar,
  UserCheck,
  UserX,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { adminService } from "@/services/admin.service"
import type { TAdminUser } from "@/utils/types/be-api"

// Use the types from be-api instead of local interfaces
type User = TAdminUser

// Skeleton component for table rows
const TableSkeleton = () => {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto STYLE-styled-scrollbar">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Birthday
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                About
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Created Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {Array.from({ length: 10 }).map((_, index) => (
              <tr key={index} className="animate-pulse">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-600"></div>
                    </div>
                    <div className="ml-4">
                      <div className="h-4 bg-gray-600 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-600 rounded w-16"></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-600 rounded w-32"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-600 rounded w-20"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-600 rounded w-32"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-6 bg-gray-600 rounded-full w-16"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-600 rounded w-20"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Pagination component
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

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="mt-6 flex items-center justify-between">
      <div className="text-sm text-gray-400">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 border border-gray-600 rounded-md text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === "number" && onPageChange(page)}
            disabled={page === "..."}
            className={`px-3 py-2 border border-gray-600 rounded-md text-sm font-medium ${
              page === currentPage
                ? "bg-red-600 text-white border-red-600"
                : page === "..."
                  ? "text-gray-500 cursor-default"
                  : "text-white bg-gray-800 hover:bg-gray-700"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border border-gray-600 rounded-md text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export const AdminUserManagement = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<
    "all" | "NORMAL" | "WARNING" | "TEMPORARY_BAN" | "PERMANENT_BAN"
  >("all")
  const [itemsPerPage] = useState(10)
  const [editingEmail, setEditingEmail] = useState<number | null>(null)
  const [editingEmailValue, setEditingEmailValue] = useState("")

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchUsers()
  }, [currentPage, debouncedSearchTerm, filterStatus])

  const fetchUsers = async () => {
    try {
      setLoading(true)

      // Use admin service to fetch users
      const response = await adminService.getUsers({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm || undefined,
        status: filterStatus === "all" ? undefined : filterStatus,
      })

      setUsers(response.users)
      setTotalPages(response.pagination.totalPages)
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("Failed to load user list")
    } finally {
      setLoading(false)
    }
  }

  const handleStartEditEmail = (user: User) => {
    setEditingEmail(user.id)
    setEditingEmailValue(user.email)
  }

  const handleCancelEditEmail = () => {
    setEditingEmail(null)
    setEditingEmailValue("")
  }

  const handleSaveEmail = async (userId: number) => {
    // Client-side validation
    if (!editingEmailValue.trim()) {
      toast.error("Email cannot be empty")
      return
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editingEmailValue)) {
      toast.error("Please enter a valid email address")
      return
    }

    // Check if email has changed
    const currentUser = users.find((user) => user.id === userId)
    if (currentUser && currentUser.email === editingEmailValue.trim()) {
      toast.info("Email is unchanged")
      setEditingEmail(null)
      setEditingEmailValue("")
      return
    }

    try {
      const response = await adminService.updateUserEmail(userId, editingEmailValue)

      if (response.success) {
        // Update local state
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, email: editingEmailValue } : user
          )
        )

        setEditingEmail(null)
        setEditingEmailValue("")
        toast.success(response.message)
      } else {
        // Handle error response
        toast.error(response.message)
      }
    } catch (err) {
      console.error("Error updating email:", err)
      toast.error("An error occurred while updating the email")
    }
  }

  const formatDate = (dateString: string, isBirthday: boolean = false) => {
    const date = new Date(dateString)
    if (isBirthday) {
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    }
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusStats = () => {
    const stats = {
      normal: users.filter((u) => u.status === "NORMAL").length,
      warning: users.filter((u) => u.status === "WARNING").length,
      temporaryBan: users.filter((u) => u.status === "TEMPORARY_BAN").length,
      permanentBan: users.filter((u) => u.status === "PERMANENT_BAN").length,
    }
    return stats
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-900 text-white">
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">❌ {error}</div>
              <button
                onClick={fetchUsers}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statusStats = getStatusStats()

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-red-400">User Management</h1>
              <p className="text-gray-400 mt-2">Quản lý người dùng hệ thống</p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">Tổng người dùng</p>
                  <p className="text-2xl font-bold text-white">{users.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm font-medium">Người dùng bình thường</p>
                  <p className="text-2xl font-bold text-white">{statusStats.normal}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-200 text-sm font-medium">Cảnh báo</p>
                  <p className="text-2xl font-bold text-white">{statusStats.warning}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-200 text-sm font-medium">Bị cấm</p>
                  <p className="text-2xl font-bold text-white">
                    {statusStats.temporaryBan + statusStats.permanentBan}
                  </p>
                </div>
                <UserX className="w-8 h-8 text-red-200" />
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Danh sách người dùng
                </h3>
                <p className="text-sm text-gray-400">Tổng {users.length} người dùng</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo email hoặc tên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 h-10 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-700 text-white placeholder-gray-400"
                    style={{ minWidth: "300px" }}
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>

                {/* Filter */}
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) =>
                      setFilterStatus(
                        e.target.value as
                          | "all"
                          | "NORMAL"
                          | "WARNING"
                          | "TEMPORARY_BAN"
                          | "PERMANENT_BAN"
                      )
                    }
                    className="px-4 pr-10 h-10 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-700 text-white appearance-none cursor-pointer min-w-[120px]"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="NORMAL">Bình thường</option>
                    <option value="WARNING">Cảnh báo</option>
                    <option value="TEMPORARY_BAN">Cấm tạm thời</option>
                    <option value="PERMANENT_BAN">Cấm vĩnh viễn</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <TableSkeleton />
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto STYLE-styled-scrollbar">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Birthday
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        About
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Created Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full"
                                src={user.avatar || "/images/user/default-avatar-black.webp"}
                                alt={user.fullName}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{user.fullName}</div>
                              <div className="text-sm text-gray-400">ID: {user.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingEmail === user.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="email"
                                value={editingEmailValue}
                                onChange={(e) => setEditingEmailValue(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-700 text-white"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEmail(user.id)}
                                className="p-1 text-green-400 hover:text-green-300"
                                title="Save"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancelEditEmail}
                                className="p-1 text-red-400 hover:text-red-300"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-white">{user.email}</span>
                              <button
                                onClick={() => handleStartEditEmail(user)}
                                className="p-1 text-gray-400 hover:text-white"
                                title="Edit email"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            {user.birthday ? formatDate(user.birthday, true) : "Chưa thiết lập"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white max-w-xs truncate">
                            {user.about || ""}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.status === "NORMAL"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : user.status === "WARNING"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : user.status === "TEMPORARY_BAN"
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{formatDate(user.createdAt)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}

          {users.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-400">Không tìm thấy người dùng nào</div>
          )}
        </div>
      </div>
    </div>
  )
}
