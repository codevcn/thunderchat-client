"use client"

import { useEffect, useState } from "react"
import { Spinner } from "@/components/materials/spinner"

interface SystemStats {
  totalUsers: number
  activeUsers: number
  lockedUsers: number
  newUsersToday: number
  totalMessages: number
  totalChats: number
  totalFiles: number
  systemHealth: "good" | "warning" | "error"
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate API call - replace with actual API call
    const fetchStats = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API call
        // const response = await fetch('/api/admin/statistics')
        // const data = await response.json()

        // Mock data for now
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const mockStats: SystemStats = {
          totalUsers: 1250,
          activeUsers: 1180,
          lockedUsers: 70,
          newUsersToday: 15,
          totalMessages: 45678,
          totalChats: 2340,
          totalFiles: 890,
          systemHealth: "good",
        }

        setStats(mockStats)
      } catch (err) {
        setError("Không thể tải dữ liệu thống kê")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Spinner size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">❌ {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Thử lại
        </button>
      </div>
    )
  }

  if (!stats) {
    return <div className="p-8 text-center text-gray-600">Không có dữ liệu thống kê</div>
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case "good":
        return "text-green-600 bg-green-50 border-green-200"
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "error":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "good":
        return "✅"
      case "warning":
        return "⚠️"
      case "error":
        return "❌"
      default:
        return "❓"
    }
  }

  return (
    <div className="p-8">
      {/* System Health Status */}
      <div className="mb-8">
        <div className={`p-4 rounded-lg border ${getHealthColor(stats.systemHealth)}`}>
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getHealthIcon(stats.systemHealth)}</span>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Trạng thái hệ thống</h3>
              <p className="text-sm text-muted-foreground">
                {stats.systemHealth === "good" && "Hệ thống hoạt động bình thường"}
                {stats.systemHealth === "warning" && "Hệ thống có cảnh báo"}
                {stats.systemHealth === "error" && "Hệ thống gặp sự cố"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg">
              <span className="text-white text-xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Tổng người dùng</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalUsers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <span className="text-white text-xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Người dùng hoạt động</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.activeUsers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="p-2 bg-red-500 rounded-lg">
              <span className="text-white text-xl">🔒</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Tài khoản bị khóa</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.lockedUsers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500 rounded-lg">
              <span className="text-white text-xl">🆕</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Người dùng mới hôm nay</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.newUsersToday.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-500 rounded-lg">
              <span className="text-white text-xl">💬</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Tổng tin nhắn</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalMessages.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <span className="text-white text-xl">💬</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Tổng cuộc trò chuyện</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalChats.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="p-2 bg-teal-500 rounded-lg">
              <span className="text-white text-xl">📁</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Tổng file</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalFiles.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Thao tác nhanh</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-accent rounded-lg border border-border hover:bg-accent/80 transition-colors">
            <div className="text-center">
              <div className="text-2xl mb-2">👥</div>
              <div className="font-medium text-foreground">Quản lý người dùng</div>
              <div className="text-sm text-muted-foreground">Xem và quản lý tài khoản</div>
            </div>
          </button>

          <button className="p-4 bg-accent rounded-lg border border-border hover:bg-accent/80 transition-colors">
            <div className="text-center">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="font-medium text-foreground">Quản lý vi phạm</div>
              <div className="text-sm text-muted-foreground">Xử lý báo cáo vi phạm</div>
            </div>
          </button>

          <button className="p-4 bg-accent rounded-lg border border-border hover:bg-accent/80 transition-colors">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium text-foreground">Báo cáo chi tiết</div>
              <div className="text-sm text-muted-foreground">Xem báo cáo hệ thống</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
