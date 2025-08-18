import { clientAxios, requestConfig } from "@/configs/axios"
import type {
  TGetPublicVapidKeyRes,
  TPushNotificationSubscription,
  TSubscribePushNotificationParams,
  TUnsubscribePushNotificationParams,
} from "@/utils/types/be-api"
import type { TSuccess } from "@/utils/types/global"

export const postSubscribePushNotification = (params: TSubscribePushNotificationParams) => {
  return clientAxios.post<TPushNotificationSubscription | null>(
    "/push-notification/subscribe",
    params,
    requestConfig
  )
}

export const getPublicVapidKeyForPushNotification = () => {
  return clientAxios.get<TGetPublicVapidKeyRes>(
    "/push-notification/get-public-vapid-key",
    requestConfig
  )
}

export const deleteUnsubscribePushNotification = (params: TUnsubscribePushNotificationParams) => {
  return clientAxios.delete<TSuccess>("/push-notification/unsubscribe", {
    params,
    ...requestConfig,
  })
}

export const getSubscriptionPushNotification = (endpoint: string) => {
  return clientAxios.get<TPushNotificationSubscription | null>(
    "/push-notification/get-subscription",
    {
      params: { endpoint },
      ...requestConfig,
    }
  )
}
