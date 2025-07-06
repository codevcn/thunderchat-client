import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "../store"

// Base selectors
const selectStatisticsState = (state: RootState) => state.statistics

// Monthly statistics selectors
export const selectMonthlyStatistics = createSelector(
  [selectStatisticsState],
  (statistics) => statistics.monthly
)

export const selectMonthlyLoading = createSelector(
  [selectStatisticsState],
  (statistics) => statistics.loading.monthly
)

export const selectMonthlyError = createSelector(
  [selectStatisticsState],
  (statistics) => statistics.error.monthly
)

// Overall statistics selectors
export const selectOverallStatistics = createSelector(
  [selectStatisticsState],
  (statistics) => statistics.overall
)

export const selectOverallLoading = createSelector(
  [selectStatisticsState],
  (statistics) => statistics.loading.overall
)

export const selectOverallError = createSelector(
  [selectStatisticsState],
  (statistics) => statistics.error.overall
)

// User statistics selectors
export const selectUserStatistics = createSelector(
  [selectStatisticsState],
  (statistics) => statistics.userStats
)

export const selectUserStatsLoading = createSelector(
  [selectStatisticsState],
  (statistics) => statistics.loading.userStats
)

export const selectUserStatsError = createSelector(
  [selectStatisticsState],
  (statistics) => statistics.error.userStats
)

// Top users selectors
export const selectTopUsers = createSelector(
  [selectStatisticsState],
  (statistics) => statistics.topUsers
)

export const selectTopUsersLoading = createSelector(
  [selectStatisticsState],
  (statistics) => statistics.loading.topUsers
)

export const selectTopUsersError = createSelector(
  [selectStatisticsState],
  (statistics) => statistics.error.topUsers
)

// Dashboard selectors
export const selectDashboardStatistics = createSelector(
  [selectStatisticsState],
  (statistics) => statistics.dashboard
)

export const selectDashboardLoading = createSelector(
  [selectStatisticsState],
  (statistics) => statistics.loading.dashboard
)

export const selectDashboardError = createSelector(
  [selectStatisticsState],
  (statistics) => statistics.error.dashboard
)

// Combined selectors
export const selectStatisticsLoading = createSelector(
  [selectStatisticsState],
  (statistics) =>
    statistics.loading.monthly ||
    statistics.loading.overall ||
    statistics.loading.userStats ||
    statistics.loading.topUsers ||
    statistics.loading.dashboard
)

export const selectStatisticsError = createSelector(
  [selectStatisticsState],
  (statistics) =>
    statistics.error.monthly ||
    statistics.error.overall ||
    statistics.error.userStats ||
    statistics.error.topUsers ||
    statistics.error.dashboard
)
