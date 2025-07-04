import type { TSuccess } from "@/utils/types/global"
import { clientAxios, requestConfig } from "@/configs/axios"
import type {
   TRegisterUserParams,
   TSearchUsersData,
   TSearchUsersParams,
   TUserWithProfile,
} from "../utils/types/be-api"

export const getUserByEmail = (email: string) =>
   clientAxios.get<TUserWithProfile>("/user/get-user?email=" + email)

export const postRegisterUser = (data: TRegisterUserParams) =>
   clientAxios.post<TSuccess>("/user/register", data, requestConfig)

export const getSearchUsers = (params: TSearchUsersParams) =>
   clientAxios.get<TSearchUsersData[]>("/user/search-users", { params })
