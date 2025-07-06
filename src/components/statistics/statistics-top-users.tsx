"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { fetchTopUsers } from "@/redux/statistics/statistics.thunks"
import {
  selectTopUsers,
  selectTopUsersLoading,
  selectTopUsersError,
} from "@/redux/statistics/statistics-selectors"
import { Spinner } from "@/components/materials/spinner"

export const StatisticsTopUsers = () => {
  const dispatch = useAppDispatch()
  const topUsers = useAppSelector(selectTopUsers)
  const loading = useAppSelector(selectTopUsersLoading)
  const error = useAppSelector(selectTopUsersError)

  const [limit, setLimit] = useState("10")
  const [displayLimit, setDisplayLimit] = useState(limit)

  const handleFetchData = () => {
    dispatch(fetchTopUsers({ limit: parseInt(limit) }))
    setDisplayLimit(limit)
  }

  useEffect(() => {
    // Chỉ fetch dữ liệu lần đầu khi component mount
    if (limit) {
      dispatch(fetchTopUsers({ limit: parseInt(limit) }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div className="text-red-600 mb-4">❌ Lỗi khi tải dữ liệu</div>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={handleFetchData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Thử lại
        </button>
      </div>
    )
  }

  if (!topUsers) {
    return <div className="p-8 text-center text-gray-600">Không có dữ liệu top users</div>
  }

  // Add null checks and default values
  const safeTopUsers = topUsers.map((user) => ({
    userId: user.userId,
    username: user.username,
    totalMessages: user.totalMessages ?? 0,
    totalFiles: user.totalFiles ?? 0,
    totalChats: user.totalChats ?? 0,
  }))

  return (
    <div className="p-8">
      {/* Limit Picker */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Chọn số lượng top users</h3>
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
            <select
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            >
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="50">Top 50</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleFetchData}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang tải..." : "Cập nhật"}
            </button>
          </div>
        </div>
      </div>

      {/* Top Users Table */}
      {safeTopUsers.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top {displayLimit} người dùng hoạt động
          </h3>

          <div className="bg-gray-50 rounded-lg border overflow-hidden">
            <div className="grid grid-cols-6 bg-gray-100 px-6 py-3 font-semibold text-gray-700">
              <div>Rank</div>
              <div>Username</div>
              <div className="text-center">Tin nhắn</div>
              <div className="text-center">File</div>
              <div className="text-center">Chat</div>
              <div className="text-center">Tổng điểm</div>
            </div>

            {safeTopUsers.map((user, index) => {
              const totalScore = user.totalMessages + user.totalFiles * 2 + user.totalChats * 3
              return (
                <div
                  key={user.userId}
                  className="grid grid-cols-6 px-6 py-4 border-t border-gray-200 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                    {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                    {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                    {index > 2 && (
                      <span className="text-lg font-bold text-gray-400 mr-2">#{index + 1}</span>
                    )}
                  </div>
                  <div className="font-medium text-gray-900">{user.username}</div>
                  <div className="text-center text-blue-600 font-semibold">
                    {user.totalMessages.toLocaleString()}
                  </div>
                  <div className="text-center text-green-600 font-semibold">
                    {user.totalFiles.toLocaleString()}
                  </div>
                  <div className="text-center text-purple-600 font-semibold">
                    {user.totalChats.toLocaleString()}
                  </div>
                  <div className="text-center text-orange-600 font-bold">
                    {totalScore.toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary Cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-600">Tổng tin nhắn</div>
              <div className="text-2xl font-bold text-blue-900">
                {safeTopUsers.reduce((sum, user) => sum + user.totalMessages, 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-sm font-medium text-green-600">Tổng file</div>
              <div className="text-2xl font-bold text-green-900">
                {safeTopUsers.reduce((sum, user) => sum + user.totalFiles, 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-sm font-medium text-purple-600">Tổng chat</div>
              <div className="text-2xl font-bold text-purple-900">
                {safeTopUsers.reduce((sum, user) => sum + user.totalChats, 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-sm font-medium text-orange-600">Tổng điểm</div>
              <div className="text-2xl font-bold text-orange-900">
                {safeTopUsers
                  .reduce(
                    (sum, user) =>
                      sum + user.totalMessages + user.totalFiles * 2 + user.totalChats * 3,
                    0
                  )
                  .toLocaleString()}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Phân tích</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h5 className="font-semibold text-yellow-800 mb-2">🏆 Người dùng hàng đầu</h5>
                <p className="text-sm text-yellow-700">
                  {safeTopUsers[0]?.username} là người dùng hoạt động nhiều nhất với{" "}
                  {safeTopUsers[0]?.totalMessages.toLocaleString()} tin nhắn.
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h5 className="font-semibold text-indigo-800 mb-2">📊 Trung bình hoạt động</h5>
                <p className="text-sm text-indigo-700">
                  Trung bình mỗi top user có{" "}
                  {(
                    safeTopUsers.reduce((sum, user) => sum + user.totalMessages, 0) /
                    safeTopUsers.length
                  ).toFixed(0)}{" "}
                  tin nhắn.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-600 py-8">Không có dữ liệu top users</div>
      )}
    </div>
  )
}
