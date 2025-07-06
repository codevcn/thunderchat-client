"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { fetchDashboardStatistics } from "@/redux/statistics/statistics.thunks"
import {
  selectDashboardStatistics,
  selectDashboardLoading,
  selectDashboardError,
} from "@/redux/statistics/statistics-selectors"
import { Spinner } from "@/components/materials/spinner"
import { TMonthlyStatistics } from "@/utils/types/statistics"

export const StatisticsDashboard = () => {
  const dispatch = useAppDispatch()
  const dashboard = useAppSelector(selectDashboardStatistics)
  const loading = useAppSelector(selectDashboardLoading)
  const error = useAppSelector(selectDashboardError)

  useEffect(() => {
    if (!dashboard) {
      dispatch(fetchDashboardStatistics())
    }
  }, [dispatch, dashboard])

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
        <div className="text-red-600 mb-4">❌ Lỗi khi tải dữ liệu</div>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => dispatch(fetchDashboardStatistics())}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Thử lại
        </button>
      </div>
    )
  }

  if (!dashboard) {
    return <div className="p-8 text-center text-gray-600">Không có dữ liệu thống kê</div>
  }

  const { overall, monthly, topUsers } = dashboard

  // Add comprehensive null checks and default values
  const safeOverall = {
    totalMessages: overall?.totalMessages ?? 0,
    totalUsers: overall?.totalUsers ?? 0,
    totalFiles: overall?.totalFiles ?? 0,
    totalChats: overall?.totalChats ?? 0,
    avgMessagesPerChat: overall?.avgMessagesPerChat ?? 0,
    avgFilesPerChat: overall?.avgFilesPerChat ?? 0,
  }

  const safeMonthly = monthly ?? []
  const safeTopUsers = topUsers ?? []

  return (
    <div className="p-8">
      {/* Overall Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg">
              <span className="text-white text-xl">💬</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Tổng tin nhắn</p>
              <p className="text-2xl font-bold text-blue-900">
                {safeOverall.totalMessages.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <span className="text-white text-xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Tổng người dùng</p>
              <p className="text-2xl font-bold text-green-900">
                {safeOverall.totalUsers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500 rounded-lg">
              <span className="text-white text-xl">📁</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Tổng file</p>
              <p className="text-2xl font-bold text-purple-900">
                {safeOverall.totalFiles.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-500 rounded-lg">
              <span className="text-white text-xl">💬</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Tổng cuộc trò chuyện</p>
              <p className="text-2xl font-bold text-orange-900">
                {safeOverall.totalChats.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Averages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trung bình tin nhắn/chat</h3>
          <p className="text-3xl font-bold text-blue-600">
            {safeOverall.totalChats > 0
              ? (safeOverall.totalMessages / safeOverall.totalChats).toFixed(1)
              : "--"}
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trung bình file/chat</h3>
          <p className="text-3xl font-bold text-green-600">
            {safeOverall.totalChats > 0
              ? (safeOverall.totalFiles / safeOverall.totalChats).toFixed(1)
              : "--"}
          </p>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê theo tháng</h3>
        <div className="bg-gray-50 p-6 rounded-lg border">
          <div className="space-y-4">
            {safeMonthly.slice(-6).map((month: TMonthlyStatistics) => (
              <div key={month.month} className="flex items-center justify-between">
                <span className="font-medium text-gray-700">{month.month}</span>
                <div className="flex space-x-6">
                  <span className="text-sm text-blue-600">
                    💬 {(month.totalMessages ?? 0).toLocaleString()}
                  </span>
                  <span className="text-sm text-green-600">
                    📁 {(month.totalFiles ?? 0).toLocaleString()}
                  </span>
                  <span className="text-sm text-purple-600">
                    👥 {(month.totalChats ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Users */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 người dùng hoạt động</h3>
        <div className="bg-gray-50 p-6 rounded-lg border">
          <div className="space-y-4">
            {safeTopUsers.slice(0, 5).map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg font-bold text-gray-400 mr-3">#{index + 1}</span>
                  <span className="font-medium text-gray-900">{user.username}</span>
                </div>
                <div className="flex space-x-4">
                  <span className="text-sm text-blue-600">
                    💬 {(user.totalMessages ?? 0).toLocaleString()}
                  </span>
                  <span className="text-sm text-green-600">
                    📁 {(user.totalFiles ?? 0).toLocaleString()}
                  </span>
                  <span className="text-sm text-purple-600">
                    👥 {(user.totalChats ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
