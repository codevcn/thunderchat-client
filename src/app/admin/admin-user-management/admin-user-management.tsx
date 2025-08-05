"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, ChevronDown, Edit, X, Check } from "lucide-react"
import { toast } from "sonner"
import { adminService } from "@/services/admin.service"
import type { TAdminUser } from "@/utils/types/be-api"

// Use the types from be-api instead of local interfaces
type User = TAdminUser

// Skeleton component for table rows
const TableSkeleton = () => {
  return (
    <div className="bg-regular-dark-gray-cl border border-regular-hover-card-cl rounded-lg overflow-hidden">
      <div className="overflow-x-auto STYLE-styled-scrollbar">
        <table className="min-w-full divide-y divide-regular-hover-card-cl">
          <thead className="bg-regular-black-cl sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                Birthday
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                About
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                Created Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-regular-dark-gray-cl divide-y divide-regular-hover-card-cl">
            {Array.from({ length: 10 }).map((_, index) => (
              <tr key={index} className="animate-pulse">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-regular-hover-card-cl"></div>
                    </div>
                    <div className="ml-4">
                      <div className="h-4 bg-regular-hover-card-cl rounded w-24 mb-2"></div>
                      <div className="h-3 bg-regular-hover-card-cl rounded w-16"></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-regular-hover-card-cl rounded w-32"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-regular-hover-card-cl rounded w-20"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-regular-hover-card-cl rounded w-32"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-6 bg-regular-hover-card-cl rounded-full w-16"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-regular-hover-card-cl rounded w-20"></div>
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
      <div className="text-sm text-regular-text-secondary-cl">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 border border-regular-hover-card-cl rounded-md text-sm font-medium text-regular-white-cl bg-regular-dark-gray-cl hover:bg-regular-hover-card-cl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === "number" && onPageChange(page)}
            disabled={page === "..."}
            className={`px-3 py-2 border border-regular-hover-card-cl rounded-md text-sm font-medium ${
              page === currentPage
                ? "bg-regular-violet-cl text-regular-white-cl border-regular-violet-cl"
                : page === "..."
                  ? "text-regular-text-secondary-cl cursor-default"
                  : "text-regular-white-cl bg-regular-dark-gray-cl hover:bg-regular-hover-card-cl"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border border-regular-hover-card-cl rounded-md text-sm font-medium text-regular-white-cl bg-regular-dark-gray-cl hover:bg-regular-hover-card-cl disabled:opacity-50 disabled:cursor-not-allowed"
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

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-400 mb-4">❌ {error}</div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-regular-violet-cl text-regular-white-cl rounded hover:bg-regular-tooltip-bgcl"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header with search and filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-regular-white-cl">User Management</h2>
          <p className="text-sm text-regular-text-secondary-cl">Total {users.length} users</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 h-10 border border-regular-hover-card-cl rounded-lg focus:outline-none bg-regular-dark-gray-cl text-regular-white-cl placeholder-regular-placeholder-cl"
              style={{ minWidth: "300px" }}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-regular-text-secondary-cl" />
          </div>

          {/* Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(
                  e.target.value as "all" | "NORMAL" | "WARNING" | "TEMPORARY_BAN" | "PERMANENT_BAN"
                )
              }
              className="px-4 pr-10 h-10 border border-regular-hover-card-cl rounded-lg focus:outline-none bg-regular-dark-gray-cl text-regular-white-cl appearance-none cursor-pointer min-w-[120px]"
            >
              <option value="all">All Status</option>
              <option value="NORMAL">Normal</option>
              <option value="WARNING">Warning</option>
              <option value="TEMPORARY_BAN">Temporary Ban</option>
              <option value="PERMANENT_BAN">Permanent Ban</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-regular-text-secondary-cl pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="bg-regular-dark-gray-cl border border-regular-hover-card-cl rounded-lg overflow-hidden">
          <div className="overflow-x-auto STYLE-styled-scrollbar">
            <table className="min-w-full divide-y divide-regular-hover-card-cl">
              <thead className="bg-regular-black-cl sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                    Birthday
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                    About
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-regular-text-secondary-cl uppercase tracking-wider">
                    Created Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-regular-dark-gray-cl divide-y divide-regular-hover-card-cl">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-regular-hover-card-cl">
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
                          <div className="text-sm font-medium text-regular-white-cl">
                            {user.fullName}
                          </div>
                          <div className="text-sm text-regular-text-secondary-cl">
                            ID: {user.id}
                          </div>
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
                            className="flex-1 px-2 py-1 text-sm border border-regular-hover-card-cl rounded focus:outline-none focus:ring-2 focus:ring-regular-violet-cl bg-regular-dark-gray-cl text-regular-white-cl"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEmail(user.id)}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEditEmail}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-regular-white-cl">{user.email}</span>
                          <button
                            onClick={() => handleStartEditEmail(user)}
                            className="p-1 text-regular-text-secondary-cl hover:text-regular-white-cl"
                            title="Edit email"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-regular-white-cl">
                        {user.birthday ? formatDate(user.birthday, true) : "Not set"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-regular-white-cl max-w-xs truncate">
                        {user.about || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === "NORMAL"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
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
                      <div className="text-sm text-regular-white-cl">
                        {formatDate(user.createdAt)}
                      </div>
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
        <div className="text-center py-8 text-regular-text-secondary-cl">No users found</div>
      )}
    </div>
  )
}
