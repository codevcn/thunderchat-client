import { clientAxios } from "@/configs/axios"
import type {
  TMonthlyStatistics,
  TOverallStatistics,
  TUserStatistics,
  TTopUser,
  TDashboardStatistics,
  TStatisticsParams,
  TUserStatisticsParams,
  TTopUsersParams,
} from "@/utils/types/statistics"

export const getMonthlyStatistics = async (
  params: TStatisticsParams
): Promise<TMonthlyStatistics[]> => {
  try {
    const { data } = await clientAxios.get("/statistics/monthly", {
      params,
      withCredentials: true,
    })
    return data
  } catch (error) {
    console.error("Error fetching monthly statistics:", error)
    throw new Error("Không thể tải dữ liệu thống kê theo tháng")
  }
}

export const getOverallStatistics = async (
  params: TStatisticsParams
): Promise<TOverallStatistics> => {
  try {
    const { data } = await clientAxios.get("/statistics/overall", {
      params,
      withCredentials: true,
    })
    return data
  } catch (error) {
    console.error("Error fetching overall statistics:", error)
    throw new Error("Không thể tải dữ liệu thống kê tổng quan")
  }
}

export const getUserStatistics = async (
  params: TUserStatisticsParams
): Promise<TUserStatistics> => {
  try {
    const { data } = await clientAxios.get("/statistics/users", {
      params,
      withCredentials: true,
    })
    return data
  } catch (error) {
    console.error("Error fetching user statistics:", error)
    throw new Error("Không thể tải dữ liệu thống kê người dùng")
  }
}

export const getTopUsers = async (params: TTopUsersParams): Promise<TTopUser[]> => {
  try {
    const { data } = await clientAxios.get("/statistics/top-users", {
      params,
      withCredentials: true,
    })
    return data
  } catch (error) {
    console.error("Error fetching top users:", error)
    throw new Error("Không thể tải dữ liệu top users")
  }
}

export const getDashboardStatistics = async (): Promise<TDashboardStatistics> => {
  try {
    const { data } = await clientAxios.get("/statistics/dashboard", {
      withCredentials: true,
    })
    return data
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error)
    throw new Error("Không thể tải dữ liệu dashboard")
  }
}
