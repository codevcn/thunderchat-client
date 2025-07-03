import { clientAxios, requestConfig } from "@/configs/axios"
import type { TGetFriendsData, TGetFriendsParams } from "../utils/types/be-api"

export const getFriends = (payload: TGetFriendsParams) =>
   clientAxios.get<TGetFriendsData[]>("friend/get-friends", {
      ...requestConfig,
      params: payload,
   })
