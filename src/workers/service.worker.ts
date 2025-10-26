/// <reference lib="webworker" />

export {}

declare global {
  interface NotificationOptions {
    vibrate?: number[] | number
  }
}

// Declare for TypeScript to understand Service Worker APIs
declare const self: ServiceWorkerGlobalScope

self.addEventListener("install", (event) => {
  console.log(">>> [Service Worker] Installed: ", event)
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  console.log(">>> [Service Worker] Activated: ", event)
  event.waitUntil(self.clients.claim())
})

type TData = {
  title?: string
  body?: string
}

// Listen for push event
self.addEventListener("push", (event) => {
  console.log(">>> [Service Worker] Push event received", event)
  let data: TData = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data = { body: event.data.text() }
    }
  }

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ includeUncontrolled: true })
      if (allClients.length > 0) {
        // Có tab → gửi message cho tab
        for (const client of allClients) {
          client.postMessage({
            type: "PUSH_MESSAGE",
            payload: data,
          })
        }
      } else {
        // Không có tab → fallback Notification API
        const title = "New notification"
        const options: NotificationOptions = {
          body: "You have a new notification.",
          icon: "/public/icons/icon-128.png",
          badge: "/public/icons/icon-128.png",
          vibrate: [100, 50, 100],
          data,
        }
        await self.registration.showNotification(title, options)
      }
    })()
  )
})

// When user clicks on the notification
self.addEventListener("notificationclick", (event) => {
  console.log(">>> [Service Worker] Notification click Received.")

  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/")
      }
    })
  )
})
