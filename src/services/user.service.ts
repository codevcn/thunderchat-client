import type {
  TBlockedUserFullInfo,
  TRegisterUserParams,
  TSearchUsersData,
  TUserWithProfile,
} from "@/utils/types/be-api"
import {
  getSearchUsers,
  getUserByEmail,
  postRegisterUser,
  getCheckBlockedUser,
  getBlockedUsersList,
} from "@/apis/user"
import { EPaginations } from "@/utils/enums"
import type { TSuccess } from "@/utils/types/global"
import { postChangePassword, postBlockUser, postUnblockUser } from "@/apis/user"

class UserService {
  async searchUsers(keyword: string): Promise<TSearchUsersData[]> {
    const { data } = await getSearchUsers({
      keyword,
      limit: EPaginations.SEARCH_USERS_PAGE_SIZE,
    })
    return data
  }

  async getUserByEmail(email: string): Promise<TUserWithProfile> {
    const { data } = await getUserByEmail(email)
    return data
  }

  async registerUser(data: TRegisterUserParams): Promise<TSuccess> {
    await postRegisterUser(data)
    return { success: true }
  }

  async changePassword(oldPassword: string, newPassword: string) {
    const { data } = await postChangePassword({ oldPassword, newPassword })
    return data
  }

  async blockUser(userId: number): Promise<TSuccess> {
    const { data } = await postBlockUser(userId)
    return data
  }

  async checkBlockedUser(otherUserId: number): Promise<TBlockedUserFullInfo | null> {
    const { data } = await getCheckBlockedUser(otherUserId)
    return data
  }

  async unblockUser(blockedUserId: number): Promise<TSuccess> {
    const { data } = await postUnblockUser(blockedUserId)
    return data
  }

  async getBlockedUsersList(): Promise<TBlockedUserFullInfo[]> {
    const { data } = await getBlockedUsersList()
    return data
  }
}

export const userService = new UserService()
