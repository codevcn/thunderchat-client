import { clientAxios, requestConfig } from "@/configs/axios"
import type { TSuccess } from "@/utils/types/global"
import type {
   TFriendRequestActionParams,
   TGetFriendRequestsData,
   TGetFriendRequestsParams,
} from "../utils/types/be-api"

export const postSendFriendRequest = (senderId: number, recipientId: number) =>
   clientAxios.post<TGetFriendRequestsData>(
      "friend-request/send-friend-request",
      { senderId, recipientId },
      requestConfig
   )

export const getFriendRequests = (payload: TGetFriendRequestsParams) =>
   clientAxios.get<TGetFriendRequestsData[]>("friend-request/get-friend-requests", {
      ...requestConfig,
      params: payload,
   })

export const postFriendRequestAction = (payload: TFriendRequestActionParams) =>
   clientAxios.post<TSuccess>("friend-request/friend-request-action", payload, requestConfig)
