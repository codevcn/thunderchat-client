/// <reference lib="webworker" />
self.addEventListener("install", (event) => {
  console.log(">>> [Service Worker] Installed: ", event)
  self.skipWaiting()
})
self.addEventListener("activate", (event) => {
  console.log(">>> [Service Worker] Activated: ", event)
  event.waitUntil(self.clients.claim())
})

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
  const recipientId = data.conversation?.message?.recipientId

  if (!recipientId) {
    console.warn(">>> [Service Worker] No recipientId provided")
    return
  }

  const messageId = data.conversation?.message?.id
  const processedMessages = new Set()
  if (messageId && processedMessages.has(messageId)) {
    console.log(">>> [Service Worker] Duplicate messageId, skipping:", messageId)
    return
  }
  processedMessages.add(messageId)

  console.log(">>> [Service Worker] data analyzed:", data)

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ includeUncontrolled: true })
      let shouldShowNotification = true
      console.log("check client", allClients)
      for (const client of allClients) {
        client.postMessage({
          type: "PUSH_MESSAGE",
          payload: data,
        })

        if (client.visibilityState === "visible") {
          shouldShowNotification = false
        }
      }

      if (shouldShowNotification) {
        console.log("show notification", allClients)
        await self.registration.showNotification(data.conversation.title, {
          body: data.conversation.message.content,
          icon: "../icons/icon-128.png",
          badge: "../icons/icon-128.png",
          vibrate: [100, 50, 100],
          data,
        })
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
