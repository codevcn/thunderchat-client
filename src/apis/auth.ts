import type { TSuccess } from "@/utils/types/global"
import { clientAxios, requestConfig } from "@/configs/axios"
import type { TLoginUserParams, TUserWithProfile } from "../utils/types/be-api"

export const postLoginUser = (data: TLoginUserParams) =>
  clientAxios.post<TSuccess>("/auth/login", data, requestConfig)

export const getCheckAuth = () =>
  clientAxios.get<TUserWithProfile>("/auth/check-auth", requestConfig)
