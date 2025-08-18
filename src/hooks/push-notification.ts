import { useCallback } from "react"
import { pushNotificationService } from "@/services/push-notification.service"
import type {
  TSubscribePushNotificationRes,
  TUnsubscribePushNotificationRes,
  TUsePushNotification,
} from "@/utils/types/global"
import { toaster } from "@/utils/toaster"
import axiosErrorHandler from "@/utils/axios-error-handler"

// Hàm chuyển đổi Base64 → Uint8Array cho VAPID key
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

const arrayBufferToBase64Url = (buffer: ArrayBuffer | null): string => {
  if (!buffer) return ""
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary) // base64
    .replace(/\+/g, "-") // URL-safe
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

export function usePushNotification(): TUsePushNotification {
  // Xin quyền
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    return await Notification.requestPermission()
  }, [])

  // Đăng ký push
  const subscribe = useCallback(async (): Promise<TSubscribePushNotificationRes | null> => {
    try {
      const perm = await requestPermission()
      if (perm !== "granted") return null

      const registration = await navigator.serviceWorker.ready

      // Kiểm tra xem đã có subscription chưa
      let sub = await registration.pushManager.getSubscription()
      if (sub) {
        const subscriptionData = await pushNotificationService.getSubscription(sub.endpoint)
        return {
          subscription: sub,
          subscriptionData,
        }
      }

      const vapidPublicKey = await pushNotificationService.getPublicVapidKey()

      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey.publicKey),
      })
      // Gửi subscription về server
      const data = await pushNotificationService.subscribe({
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64Url(sub.getKey("p256dh")),
          auth: arrayBufferToBase64Url(sub.getKey("auth")),
        },
      })
      return {
        subscription: sub,
        subscriptionData: data,
      }
    } catch (err) {
      return null
    }
  }, [])

  const unsubscribe = useCallback(async (): Promise<TUnsubscribePushNotificationRes | null> => {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.getSubscription()
    if (sub) {
      try {
        await sub.unsubscribe()
      } catch (error) {
        toaster.error((error as any).message || "Failed to unsubscribe from push notification.")
        return {
          oldSubscription: sub,
        }
      }
      try {
        await pushNotificationService.unsubscribe({ endpoint: sub.endpoint })
      } catch (err) {
        toaster.error(axiosErrorHandler.handleHttpError(err).message)
        return {
          oldSubscription: sub,
        }
      }
      return {
        oldSubscription: sub,
      }
    }
    return null
  }, [])

  const checkIfSupported = useCallback(async (): Promise<boolean> => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      await navigator.serviceWorker.register("/service.worker.js", { type: "module" })
      return true
    } else {
      return false
    }
  }, [])

  return { subscribe, unsubscribe, checkIfSupported }
}
