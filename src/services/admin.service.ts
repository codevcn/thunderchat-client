import type {
  TAdminUsersData,
  TAdminUsersParams,
  TAdminUserActionParams,
  TAdminStatisticsData,
} from "@/utils/types/be-api"
import { getAdminUsers, lockUnlockUser, deleteUser, getAdminStatistics } from "@/apis/admin"
import type { TSuccess } from "@/utils/types/global"

class AdminService {
  async getUsers(params: TAdminUsersParams): Promise<TAdminUsersData> {
    const { data } = await getAdminUsers(params)
    return data
  }

  async lockUnlockUser(userId: number, isActive: boolean): Promise<TSuccess> {
    const { data } = await lockUnlockUser({ userId, isActive })
    return data
  }

  async deleteUser(userId: number): Promise<TSuccess> {
    const { data } = await deleteUser({ userId })
    return data
  }

  async getStatistics(): Promise<TAdminStatisticsData> {
    const { data } = await getAdminStatistics()
    return data
  }
}

export const adminService = new AdminService()
