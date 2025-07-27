import { getFriends, getSearchFriendsByKeyword, deleteRemoveFriend } from "@/apis/friend"
import type { TGetFriendsData, TGetFriendsParams } from "@/utils/types/be-api"
import type { TSuccess } from "@/utils/types/global"

class FriendService {
  async getFriends(payload: TGetFriendsParams): Promise<TGetFriendsData[]> {
    const { data } = await getFriends(payload)
    return data
  }

  async searchFriendsByKeyword(keyword: string): Promise<TGetFriendsData[]> {
    const { data } = await getSearchFriendsByKeyword(keyword)
    return data
  }

  async removeFriend(friendId: number): Promise<TSuccess> {
    const { data } = await deleteRemoveFriend(friendId)
    return data
  }
}

export const friendService = new FriendService()
