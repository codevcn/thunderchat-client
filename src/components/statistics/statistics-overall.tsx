"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { fetchOverallStatistics } from "@/redux/statistics/statistics.thunks"
import {
   selectOverallStatistics,
   selectOverallLoading,
   selectOverallError,
} from "@/redux/statistics/statistics-selectors"
import { Spinner } from "@/components/materials/spinner"

export const StatisticsOverall = () => {
   const dispatch = useAppDispatch()
   const overall = useAppSelector(selectOverallStatistics)
   const loading = useAppSelector(selectOverallLoading)
   const error = useAppSelector(selectOverallError)

   const [dateRange, setDateRange] = useState({
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
   })

   const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
      setDateRange(prev => ({ ...prev, [field]: value }))
   }

   const handleFetchData = () => {
      dispatch(fetchOverallStatistics(dateRange))
   }

   useEffect(() => {
      // Chỉ load dữ liệu lần đầu khi component mount
      if (!overall) {
         handleFetchData()
      }
   }, [dispatch])

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

   if (!overall) {
      return (
         <div className="p-8 text-center text-gray-600">
            Không có dữ liệu thống kê tổng quan
         </div>
      )
   }

   // Add null checks and default values
   const safeOverall = {
      totalMessages: overall?.totalMessages ?? 0,
      totalUsers: overall?.totalUsers ?? 0,
      totalFiles: overall?.totalFiles ?? 0,
      totalChats: overall?.totalChats ?? 0,
      avgMessagesPerChat: overall?.avgMessagesPerChat ?? 0,
      avgFilesPerChat: overall?.avgFilesPerChat ?? 0,
   }

   return (
      <div className="p-8">
         {/* Date Range Picker */}
         <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chọn khoảng thời gian</h3>
            <div className="flex flex-col sm:flex-row gap-4">
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
               <div className="flex items-end">
                  <button
                     onClick={handleFetchData}
                     disabled={loading}
                     className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {loading ? 'Đang tải...' : 'Cập nhật'}
                  </button>
               </div>
            </div>
         </div>

         {/* Overall Statistics */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main Statistics */}
            <div>
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê tổng quan</h3>
               <div className="space-y-4">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-sm font-medium text-blue-600">Tổng tin nhắn</p>
                           <p className="text-3xl font-bold text-blue-900">{safeOverall.totalMessages.toLocaleString()}</p>
                        </div>
                        <div className="text-4xl">💬</div>
                     </div>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-sm font-medium text-green-600">Tổng người dùng</p>
                           <p className="text-3xl font-bold text-green-900">{safeOverall.totalUsers.toLocaleString()}</p>
                        </div>
                        <div className="text-4xl">👥</div>
                     </div>
                  </div>

                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-sm font-medium text-purple-600">Tổng file</p>
                           <p className="text-3xl font-bold text-purple-900">{safeOverall.totalFiles.toLocaleString()}</p>
                        </div>
                        <div className="text-4xl">📁</div>
                     </div>
                  </div>

                  <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-sm font-medium text-orange-600">Tổng cuộc trò chuyện</p>
                           <p className="text-3xl font-bold text-orange-900">{safeOverall.totalChats.toLocaleString()}</p>
                        </div>
                        <div className="text-4xl">💬</div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Averages */}
            <div>
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Chỉ số trung bình</h3>
               <div className="space-y-4">
                  <div className="bg-gray-50 p-6 rounded-lg border">
                     <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">Trung bình tin nhắn/chat</p>
                        <p className="text-4xl font-bold text-blue-600">{safeOverall.totalChats > 0 ? (safeOverall.totalMessages / safeOverall.totalChats).toFixed(1) : "--"}</p>
                        <p className="text-xs text-gray-500 mt-1">tin nhắn mỗi cuộc trò chuyện</p>
                     </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg border">
                     <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">Trung bình file/chat</p>
                        <p className="text-4xl font-bold text-green-600">{safeOverall.totalChats > 0 ? (safeOverall.totalFiles / safeOverall.totalChats).toFixed(1) : "--"}</p>
                        <p className="text-xs text-gray-500 mt-1">file mỗi cuộc trò chuyện</p>
                     </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg border">
                     <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">Tỷ lệ file/tin nhắn</p>
                        <p className="text-4xl font-bold text-purple-600">
                           {safeOverall.totalMessages > 0 ? ((safeOverall.totalFiles / safeOverall.totalMessages) * 100).toFixed(1) : '--'}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">phần trăm tin nhắn có file</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Insights */}
         <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân tích</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">📊 Hoạt động trung bình</h4>
                  <p className="text-sm text-yellow-700">
                     Mỗi cuộc trò chuyện có trung bình {safeOverall.totalChats > 0 ? (safeOverall.totalMessages / safeOverall.totalChats).toFixed(1) : "--"} tin nhắn và {safeOverall.totalChats > 0 ? (safeOverall.totalFiles / safeOverall.totalChats).toFixed(1) : "--"} file.
                  </p>
               </div>
               <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h4 className="font-semibold text-indigo-800 mb-2">📈 Tỷ lệ sử dụng</h4>
                  <p className="text-sm text-indigo-700">
                     {safeOverall.totalUsers > 0 ? ((safeOverall.totalChats / safeOverall.totalUsers) * 100).toFixed(1) : '0'}% người dùng đã tạo cuộc trò chuyện.
                  </p>
               </div>
            </div>
         </div>
      </div>
   )
} 