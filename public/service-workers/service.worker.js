/// <reference lib="webworker" />
self.addEventListener("install", (event) => {
  console.log(">>> [Service Worker] Installed: ", event)
  self.skipWaiting()
})
self.addEventListener("activate", (event) => {
  console.log(">>> [Service Worker] Activated: ", event)
  event.waitUntil(self.clients.claim())
})
// Listen for push event
self.addEventListener("push", (event) => {
  console.log(">>> [Service Worker] Push event received", event)
  let data = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data = { body: event.data.text() }
    }
  }

  console.log(">>> [Service Worker] data analyzed :", data)

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
        const title = data.conversation.title
        const options = {
          body: data.conversation.message.content,
          icon: "../icons/icon-128.png",
          badge: "../icons/icon-128.png",
          vibrate: [100, 50, 100],
          data,
        }
        await self.registration.showNotification(title, options)
      }
    })()
  )
})

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
export {}
