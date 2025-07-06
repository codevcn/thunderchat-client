import { createAsyncThunk } from "@reduxjs/toolkit"
import {
   getMonthlyStatistics,
   getOverallStatistics,
   getUserStatistics,
   getTopUsers,
   getDashboardStatistics,
} from "@/apis/statistics"
import {
   setMonthlyLoading,
   setMonthlyData,
   setMonthlyError,
   setOverallLoading,
   setOverallData,
   setOverallError,
   setUserStatsLoading,
   setUserStatsData,
   setUserStatsError,
   setTopUsersLoading,
   setTopUsersData,
   setTopUsersError,
   setDashboardLoading,
   setDashboardData,
   setDashboardError,
} from "./statistics.slice"
import type {
   TStatisticsParams,
   TUserStatisticsParams,
   TTopUsersParams,
} from "@/utils/types/statistics"

export const fetchMonthlyStatistics = createAsyncThunk(
   "statistics/fetchMonthly",
   async (params: TStatisticsParams, { dispatch }) => {
      try {
         dispatch(setMonthlyLoading(true))
         const data = await getMonthlyStatistics(params)
         dispatch(setMonthlyData(data))
         return data
      } catch (error: any) {
         const errorMessage = error.response?.data?.message || "Lỗi khi tải thống kê theo tháng"
         dispatch(setMonthlyError(errorMessage))
         throw error
      }
   }
)

export const fetchOverallStatistics = createAsyncThunk(
   "statistics/fetchOverall",
   async (params: TStatisticsParams, { dispatch }) => {
      try {
         dispatch(setOverallLoading(true))
         const data = await getOverallStatistics(params)
         dispatch(setOverallData(data))
         return data
      } catch (error: any) {
         const errorMessage = error.response?.data?.message || "Lỗi khi tải thống kê tổng quan"
         dispatch(setOverallError(errorMessage))
         throw error
      }
   }
)

export const fetchUserStatistics = createAsyncThunk(
   "statistics/fetchUserStats",
   async (params: TUserStatisticsParams, { dispatch }) => {
      try {
         console.log('fetchUserStatistics thunk called with params:', params)
         dispatch(setUserStatsLoading(true))
         const data = await getUserStatistics(params)
         console.log('fetchUserStatistics API response:', data)
         dispatch(setUserStatsData(data))
         return data
      } catch (error: any) {
         console.error('fetchUserStatistics error:', error)
         const errorMessage = error.response?.data?.message || "Lỗi khi tải thống kê user"
         dispatch(setUserStatsError(errorMessage))
         throw error
      }
   }
)

export const fetchTopUsers = createAsyncThunk(
   "statistics/fetchTopUsers",
   async (params: TTopUsersParams, { dispatch }) => {
      try {
         dispatch(setTopUsersLoading(true))
         const data = await getTopUsers(params)
         dispatch(setTopUsersData(data))
         return data
      } catch (error: any) {
         const errorMessage = error.response?.data?.message || "Lỗi khi tải top users"
         dispatch(setTopUsersError(errorMessage))
         throw error
      }
   }
)

export const fetchDashboardStatistics = createAsyncThunk(
   "statistics/fetchDashboard",
   async (_, { dispatch }) => {
      try {
         dispatch(setDashboardLoading(true))
         const data = await getDashboardStatistics()
         dispatch(setDashboardData(data))
         return data
      } catch (error: any) {
         const errorMessage = error.response?.data?.message || "Lỗi khi tải dashboard"
         dispatch(setDashboardError(errorMessage))
         throw error
      }
   }
) 