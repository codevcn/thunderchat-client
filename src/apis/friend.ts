import { clientAxios, requestConfig } from "@/configs/axios"
import type { TGetFriendsData, TGetFriendsParams } from "../utils/types/be-api"
import type { TSuccess } from "@/utils/types/global"

export const getFriends = (payload: TGetFriendsParams) =>
  clientAxios.get<TGetFriendsData[]>("friend/get-friends", {
    ...requestConfig,
    params: payload,
  })

export const getSearchFriendsByKeyword = (keyword: string) =>
  clientAxios.get<TGetFriendsData[]>("friend/get-friends-by-keyword", {
    ...requestConfig,
    params: { keyword },
  })

export const deleteRemoveFriend = (friendId: number) =>
  clientAxios.delete<TSuccess>(`friend/remove-friend`, {
    ...requestConfig,
    params: { friendId },
  })
