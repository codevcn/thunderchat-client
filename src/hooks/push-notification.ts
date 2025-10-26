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

const SW_PATH = "/service-workers/service.worker.js"

export function usePushNotification(): TUsePushNotification {
  // Xin quyền

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    return await Notification.requestPermission()
  }, [])

  // Đăng ký push
  const subscribe = useCallback(async (): Promise<TSubscribePushNotificationRes | null> => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      for (const r of regs) {
        await r.unregister()
      }

      // Đăng ký SW (đảm bảo có file)
      const registration = await navigator.serviceWorker.register(SW_PATH, {
        type: "module",
        scope: "/service-workers/",
      })

      console.log("SW registered:", registration)
      // Xin quyền push
      const perm = await requestPermission()
      if (perm !== "granted") {
        if (perm === "denied") {
          toaster.error(
            "Please allow push notification in your browser settings to use this feature."
          )
        }
        return null
      }

      // Lấy public key từ server
      const vapidPublicKey = await pushNotificationService.getPublicVapidKey()

      // Tạo subscription mới
      const newSub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: new Uint8Array(urlBase64ToUint8Array(vapidPublicKey.publicKey)),
      })

      // Gửi subscription mới lên server
      const data = await pushNotificationService.subscribe({
        endpoint: newSub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64Url(newSub.getKey("p256dh")),
          auth: arrayBufferToBase64Url(newSub.getKey("auth")),
        },
      })

      return {
        subscription: newSub,
        subscriptionData: data,
      }
    } catch (err) {
      toaster.error((err as any).message || "Failed to subscribe to push notification.")
      return null
    }
  }, [])

  const unsubscribe = useCallback(async (): Promise<TUnsubscribePushNotificationRes | null> => {
    try {
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
    } catch (error) {
      toaster.error((error as any).message || "Failed to unsubscribe from push notification.")
    }
    return null
  }, [])

  const checkIfSupported = useCallback(async (): Promise<boolean> => {
    return "serviceWorker" in navigator && "PushManager" in window
  }, [])

  return { subscribe, unsubscribe, checkIfSupported }
}
