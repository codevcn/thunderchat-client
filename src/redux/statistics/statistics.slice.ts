import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type {
   TMonthlyStatistics,
   TOverallStatistics,
   TUserStatistics,
   TTopUser,
   TDashboardStatistics,
} from "@/utils/types/statistics"

type TStatisticsState = {
   monthly: TMonthlyStatistics[]
   overall: TOverallStatistics | null
   userStats: TUserStatistics | null
   topUsers: TTopUser[]
   dashboard: TDashboardStatistics | null
   loading: {
      monthly: boolean
      overall: boolean
      userStats: boolean
      topUsers: boolean
      dashboard: boolean
   }
   error: {
      monthly: string | null
      overall: string | null
      userStats: string | null
      topUsers: string | null
      dashboard: string | null
   }
}

const initialState: TStatisticsState = {
   monthly: [],
   overall: null,
   userStats: null,
   topUsers: [],
   dashboard: null,
   loading: {
      monthly: false,
      overall: false,
      userStats: false,
      topUsers: false,
      dashboard: false,
   },
   error: {
      monthly: null,
      overall: null,
      userStats: null,
      topUsers: null,
      dashboard: null,
   },
}

const statisticsSlice = createSlice({
   name: "statistics",
   initialState,
   reducers: {
      // Monthly Statistics
      setMonthlyLoading: (state, action: PayloadAction<boolean>) => {
         state.loading.monthly = action.payload
         if (action.payload) state.error.monthly = null
      },
      setMonthlyData: (state, action: PayloadAction<TMonthlyStatistics[]>) => {
         state.monthly = action.payload
         state.loading.monthly = false
         state.error.monthly = null
      },
      setMonthlyError: (state, action: PayloadAction<string>) => {
         state.error.monthly = action.payload
         state.loading.monthly = false
      },

      // Overall Statistics
      setOverallLoading: (state, action: PayloadAction<boolean>) => {
         state.loading.overall = action.payload
         if (action.payload) state.error.overall = null
      },
      setOverallData: (state, action: PayloadAction<TOverallStatistics>) => {
         state.overall = action.payload
         state.loading.overall = false
         state.error.overall = null
      },
      setOverallError: (state, action: PayloadAction<string>) => {
         state.error.overall = action.payload
         state.loading.overall = false
      },

      // User Statistics
      setUserStatsLoading: (state, action: PayloadAction<boolean>) => {
         state.loading.userStats = action.payload
         if (action.payload) state.error.userStats = null
      },
      setUserStatsData: (state, action: PayloadAction<TUserStatistics>) => {
         state.userStats = action.payload
         state.loading.userStats = false
         state.error.userStats = null
      },
      setUserStatsError: (state, action: PayloadAction<string>) => {
         state.error.userStats = action.payload
         state.loading.userStats = false
      },

      // Top Users
      setTopUsersLoading: (state, action: PayloadAction<boolean>) => {
         state.loading.topUsers = action.payload
         if (action.payload) state.error.topUsers = null
      },
      setTopUsersData: (state, action: PayloadAction<TTopUser[]>) => {
         state.topUsers = action.payload
         state.loading.topUsers = false
         state.error.topUsers = null
      },
      setTopUsersError: (state, action: PayloadAction<string>) => {
         state.error.topUsers = action.payload
         state.loading.topUsers = false
      },

      // Dashboard
      setDashboardLoading: (state, action: PayloadAction<boolean>) => {
         state.loading.dashboard = action.payload
         if (action.payload) state.error.dashboard = null
      },
      setDashboardData: (state, action: PayloadAction<TDashboardStatistics>) => {
         state.dashboard = action.payload
         state.loading.dashboard = false
         state.error.dashboard = null
      },
      setDashboardError: (state, action: PayloadAction<string>) => {
         state.error.dashboard = action.payload
         state.loading.dashboard = false
      },

      // Clear all data
      clearStatistics: (state) => {
         state.monthly = []
         state.overall = null
         state.userStats = null
         state.topUsers = []
         state.dashboard = null
         state.loading = {
            monthly: false,
            overall: false,
            userStats: false,
            topUsers: false,
            dashboard: false,
         }
         state.error = {
            monthly: null,
            overall: null,
            userStats: null,
            topUsers: null,
            dashboard: null,
         }
      },
   },
})

export const {
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
   clearStatistics,
} = statisticsSlice.actions

export default statisticsSlice.reducer 