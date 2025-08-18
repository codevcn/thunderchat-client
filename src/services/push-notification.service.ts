import {
  getPublicVapidKeyForPushNotification,
  postSubscribePushNotification,
  deleteUnsubscribePushNotification,
  getSubscriptionPushNotification,
} from "@/apis/push-notification"
import type {
  TGetPublicVapidKeyRes,
  TPushNotificationSubscription,
  TSubscribePushNotificationParams,
  TUnsubscribePushNotificationParams,
} from "@/utils/types/be-api"
import type { TSuccess } from "@/utils/types/global"

class PushNotificationService {
  async subscribe(
    params: TSubscribePushNotificationParams
  ): Promise<TPushNotificationSubscription | null> {
    const { data } = await postSubscribePushNotification(params)
    return data
  }

  async unsubscribe(params: TUnsubscribePushNotificationParams): Promise<TSuccess> {
    const { data } = await deleteUnsubscribePushNotification(params)
    return data
  }

  async getPublicVapidKey(): Promise<TGetPublicVapidKeyRes> {
    const { data } = await getPublicVapidKeyForPushNotification()
    return data
  }

  async getSubscription(endpoint: string): Promise<TPushNotificationSubscription | null> {
    const { data } = await getSubscriptionPushNotification(endpoint)
    return data
  }
}

export const pushNotificationService = new PushNotificationService()
