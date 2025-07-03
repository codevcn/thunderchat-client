import {
   getFriendRequests,
   postFriendRequestAction,
   postSendFriendRequest,
} from "@/apis/friend-request"
import type {
   TFriendRequestActionParams,
   TGetFriendRequestsData,
   TGetFriendRequestsParams,
} from "@/utils/types/be-api"
import type { TSuccess } from "@/utils/types/global"

class FriendRequestService {
   async sendFriendRequest(userId: number, recipientId: number): Promise<TGetFriendRequestsData> {
      const { data } = await postSendFriendRequest(userId, recipientId)
      return data
   }

   async getFriendRequests(payload: TGetFriendRequestsParams): Promise<TGetFriendRequestsData[]> {
      const { data } = await getFriendRequests(payload)
      return data
   }

   async friendRequestAction(payload: TFriendRequestActionParams): Promise<TSuccess> {
      const { data } = await postFriendRequestAction(payload)
      return data
   }
}

export const friendRequestService = new FriendRequestService()
