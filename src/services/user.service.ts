import type { TRegisterUserParams, TSearchUsersData, TUserWithProfile } from "@/utils/types/be-api"
import { getSearchUsers, getUserByEmail, postRegisterUser } from "@/apis/user"
import { EPaginations } from "@/utils/enums"
import type { TSuccess } from "@/utils/types/global"

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
}

export const userService = new UserService()
