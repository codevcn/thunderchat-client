"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { fetchUserStatistics } from "@/redux/statistics/statistics.thunks"
import {
   selectUserStatistics,
   selectUserStatsLoading,
   selectUserStatsError,
} from "@/redux/statistics/statistics-selectors"
import { Spinner } from "@/components/materials/spinner"

export const StatisticsUsers = () => {
   const dispatch = useAppDispatch()
   const userStats = useAppSelector(selectUserStatistics)
   const loading = useAppSelector(selectUserStatsLoading)
   const error = useAppSelector(selectUserStatsError)

   console.log('StatisticsUsers render - userStats:', userStats, 'loading:', loading, 'error:', error)

   const [userId, setUserId] = useState("1")
   const [dateRange, setDateRange] = useState({
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
   })

   const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
      setDateRange(prev => ({ ...prev, [field]: value }))
   }

   const handleFetchData = () => {
      if (userId) {
         const params = { ...dateRange, userId: parseInt(userId) }
         console.log('Fetching user statistics with params:', params)
         dispatch(fetchUserStatistics(params))
      }
   }

   useEffect(() => {
      // Chỉ fetch dữ liệu lần đầu khi component mount
      if (userId) {
         const params = { ...dateRange, userId: parseInt(userId) }
         dispatch(fetchUserStatistics(params))
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

   if (!userStats) {
      return (
         <div className="p-8 text-center text-gray-600">
            Không có dữ liệu thống kê người dùng
         </div>
      )
   }

   // Lấy object thống kê đúng (nếu là mảng thì lấy phần tử đầu tiên)
   const userStatsObj = Array.isArray(userStats) ? userStats[0] : userStats;
   const safeUserStats = {
      totalMessages: userStatsObj?.totalMessages ?? 0,
      totalFiles: userStatsObj?.totalFiles ?? 0,
      totalChats: userStatsObj?.totalChats ?? 0,
      lastActivity: userStatsObj?.lastActive ?? new Date().toISOString(),
      username: userStatsObj?.username ?? '',
      userId: userStatsObj?.userId ?? '',
   }

   return (
      <div className="p-8">
         {/* User and Date Range Picker */}
         <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chọn người dùng và khoảng thời gian</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                     User ID
                  </label>
                  <input
                     type="number"
                     value={userId}
                     onChange={(e) => setUserId(e.target.value)}
                     className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                     placeholder="Nhập User ID"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                     Từ ngày
                  </label>
                  <input
                     type="date"
                     value={dateRange.startDate}
                     onChange={(e) => handleDateChange('startDate', e.target.value)}
                     className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                     Đến ngày
                  </label>
                  <input
                     type="date"
                     value={dateRange.endDate}
                     onChange={(e) => handleDateChange('endDate', e.target.value)}
                     className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
               </div>
               <div className="flex items-end gap-2">
                  <button
                     onClick={handleFetchData}
                     disabled={loading || !userId}
                     className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {loading ? 'Đang tải...' : 'Cập nhật'}
                  </button>
               </div>
            </div>
         </div>

         {/* User Statistics */}
         {userStats ? (
            <div>
               <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Thống kê người dùng: {safeUserStats.username || `User ID: ${userId}`}
               </h3>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                     <div className="flex items-center">
                        <div className="p-2 bg-blue-500 rounded-lg">
                           <span className="text-white text-xl">💬</span>
                        </div>
                        <div className="ml-4">
                           <p className="text-sm font-medium text-blue-600">Tin nhắn đã gửi</p>
                           <p className="text-2xl font-bold text-blue-900">{safeUserStats.totalMessages.toLocaleString()}</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                     <div className="flex items-center">
                        <div className="p-2 bg-green-500 rounded-lg">
                           <span className="text-white text-xl">📁</span>
                        </div>
                        <div className="ml-4">
                           <p className="text-sm font-medium text-green-600">File đã upload</p>
                           <p className="text-2xl font-bold text-green-900">{safeUserStats.totalFiles.toLocaleString()}</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                     <div className="flex items-center">
                        <div className="p-2 bg-purple-500 rounded-lg">
                           <span className="text-white text-xl">👥</span>
                        </div>
                        <div className="ml-4">
                           <p className="text-sm font-medium text-purple-600">Cuộc trò chuyện đã tạo</p>
                           <p className="text-2xl font-bold text-purple-900">{safeUserStats.totalChats.toLocaleString()}</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                     <div className="flex items-center">
                        <div className="p-2 bg-orange-500 rounded-lg">
                           <span className="text-white text-xl">⏰</span>
                        </div>
                        <div className="ml-4">
                           <p className="text-sm font-medium text-orange-600">Hoạt động cuối</p>
                           <p className="text-sm font-bold text-orange-900">
                              {new Date(safeUserStats.lastActivity).toLocaleDateString('vi-VN')}
                           </p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* User Activity Analysis */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg border">
                     <h4 className="text-lg font-semibold text-gray-900 mb-4">Phân tích hoạt động</h4>
                     <div className="space-y-3">
                        <div className="flex justify-between">
                           <span className="text-gray-600">Tỷ lệ file/tin nhắn:</span>
                           <span className="font-semibold text-blue-600">
                              {safeUserStats.totalMessages > 0
                                 ? ((safeUserStats.totalFiles / safeUserStats.totalMessages) * 100).toFixed(1)
                                 : '0'}%
                           </span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-gray-600">Trung bình tin nhắn/chat:</span>
                           <span className="font-semibold text-green-600">
                              {safeUserStats.totalChats > 0
                                 ? (safeUserStats.totalMessages / safeUserStats.totalChats).toFixed(1)
                                 : '0'}
                           </span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-gray-600">Trung bình file/chat:</span>
                           <span className="font-semibold text-purple-600">
                              {safeUserStats.totalChats > 0
                                 ? (safeUserStats.totalFiles / safeUserStats.totalChats).toFixed(1)
                                 : '0'}
                           </span>
                        </div>
                     </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg border">
                     <h4 className="text-lg font-semibold text-gray-900 mb-4">Thông tin người dùng</h4>
                     <div className="space-y-3">
                        <div className="flex justify-between">
                           <span className="text-gray-600">User ID:</span>
                           <span className="font-semibold text-gray-900">{safeUserStats.userId}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-gray-600">Username:</span>
                           <span className="font-semibold text-gray-900">{safeUserStats.username}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-gray-600">Hoạt động cuối:</span>
                           <span className="font-semibold text-gray-900">
                              {new Date(safeUserStats.lastActivity).toLocaleString('vi-VN')}
                           </span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         ) : (
            <div className="text-center text-gray-600 py-8">
               {userId ? 'Vui lòng nhấn "Cập nhật" để xem thống kê' : 'Vui lòng chọn User ID để xem thống kê'}
            </div>
         )}
      </div>
   )
} 