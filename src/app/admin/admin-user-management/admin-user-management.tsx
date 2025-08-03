"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { adminService } from "@/services/admin.service"
import type { TAdminUser } from "@/utils/types/be-api"

// Use the types from be-api instead of local interfaces
type User = TAdminUser

// Skeleton component for table rows
const TableSkeleton = () => {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto STYLE-styled-scrollbar">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Last Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {Array.from({ length: 10 }).map((_, index) => (
              <tr key={index} className="animate-pulse">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                    </div>
                    <div className="ml-4">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-8"></div>
                  </div>
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
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 border border-border rounded-md text-sm font-medium text-foreground bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === "number" && onPageChange(page)}
            disabled={page === "..."}
            className={`px-3 py-2 border border-border rounded-md text-sm font-medium ${
              page === currentPage
                ? "bg-primary text-primary-foreground border-primary"
                : page === "..."
                  ? "text-muted-foreground cursor-default"
                  : "text-foreground bg-background hover:bg-accent"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border border-border rounded-md text-sm font-medium text-foreground bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
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
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all")
  const [itemsPerPage] = useState(10)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchUsers()
  }, [currentPage, debouncedSearchTerm, filterActive])

  const fetchUsers = async () => {
    try {
      setLoading(true)

      // Use admin service to fetch users
      const response = await adminService.getUsers({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm || undefined,
        isActive: filterActive === "all" ? undefined : filterActive,
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

  const handleLockUnlockUser = async (userId: number, isActive: boolean) => {
    try {
      // Use admin service to lock/unlock user
      await adminService.lockUnlockUser(userId, isActive)

      // Update local state with both isActive and inActiveAt
      setUsers((prevUsers) =>
        prevUsers.map((user) => {
          if (user.id === userId) {
            return {
              ...user,
              isActive,
              inActiveAt: new Date().toISOString(), // Always set to current time
            }
          }
          return user
        })
      )

      toast.success(isActive ? "Account unlocked" : "Account locked")
    } catch (err) {
      console.error("Error locking/unlocking user:", err)
      toast.error("An error occurred while performing the action")
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      // Use admin service to delete user
      await adminService.deleteUser(userId)

      // Update local state
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId))

      toast.success("User deleted")
    } catch (err) {
      console.error("Error deleting user:", err)
      toast.error("An error occurred while deleting the user")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
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
        <div className="text-red-600 mb-4">❌ {error}</div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
          <h2 className="text-xl font-semibold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">Total {users.length} users</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 h-10 border border-border rounded-lg focus:outline-none bg-background text-foreground placeholder-muted-foreground"
              style={{ minWidth: "300px" }}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          </div>

          {/* Filter */}
          <div className="relative">
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as "all" | "active" | "inactive")}
              className="px-4 pr-10 h-10 border border-border rounded-lg focus:outline-none bg-background text-foreground appearance-none cursor-pointer min-w-[120px]"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto STYLE-styled-scrollbar">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Inactive Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-accent">
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
                          <div className="text-sm font-medium text-foreground">{user.fullName}</div>
                          <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{formatDate(user.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {user.inActiveAt ? formatDate(user.inActiveAt) : "Never active"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleLockUnlockUser(user.id, !user.isActive)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            user.isActive
                              ? "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                              : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                          }`}
                        >
                          {user.isActive ? "Lock" : "Unlock"}
                        </button>
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
        <div className="text-center py-8 text-muted-foreground">No users found</div>
      )}
    </div>
  )
}
