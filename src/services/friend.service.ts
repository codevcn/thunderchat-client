import { getFriends } from "@/apis/friend"
import type { TGetFriendsData, TGetFriendsParams } from "@/utils/types/be-api"

class FriendService {
   async getFriends(payload: TGetFriendsParams): Promise<TGetFriendsData[]> {
      const { data } = await getFriends(payload)
      return data
   }
}

export const friendService = new FriendService()
