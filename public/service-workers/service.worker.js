/// <reference lib="webworker" />
export const EMessageTypes = {
  TEXT: "TEXT",
  STICKER: "STICKER",
  MEDIA: "MEDIA",
  PIN_NOTICE: "PIN_NOTICE",
  CALL: "CALL",
}

export const EMessageMediaTypes = {
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  AUDIO: "AUDIO",
  DOCUMENT: "DOCUMENT",
}

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
  console.log(">>> [Service Worker] data analyzed:", data)
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

  // Hàm helper để kiểm tra chuỗi chứa substring
  function stringContains(str, search) {
    if (!str || !search) return false

    for (let i = 0; i <= str.length - search.length; i++) {
      let match = true

      for (let j = 0; j < search.length; j++) {
        if (str[i + j] !== search[j]) {
          match = false
          break
        }
      }

      if (match) return true
    }

    return false
  }

  const name = data.conversation.message.Author.Profile.avatar || "../images/user/avatar.png"
  const message = data.conversation.message
  let type = message.type?.toUpperCase()
  const { Media, Sticker } = message

  let notificationBody = message.content || "You have a new message"
  let notificationImage = null
  let iconToShow = name

  if (message.content && stringContains(message.content, "<svg")) {
    console.log(">>> [Service Worker] Detected call message with SVG")
    type = "CALL" // Override type

    // Phân biệt Call started vs Call ended
    if (stringContains(message.content, "Call started")) {
      notificationBody = "📞 Incoming call..."
    }
  }

  switch (type) {
    case EMessageTypes.TEXT:
      if (type !== "CALL") {
        notificationBody = message.content || "[No content]"
      }
      break

    case EMessageTypes.STICKER:
      notificationBody = "Sent a sticker"
      notificationImage = Sticker?.imageUrl
      break

    case EMessageTypes.MEDIA:
      if (!Media) {
        notificationBody = "[Invalid media content]"
        break
      }
      const mediaType = Media.type?.toUpperCase()

      switch (mediaType) {
        case EMessageMediaTypes.IMAGE:
          notificationBody = "📷 Sent an image"
          notificationImage = Media.url
          break
        case EMessageMediaTypes.VIDEO:
          notificationBody = `🎥 Sent a video: ${Media.fileName || "No name"}`
          notificationImage = Media.thumbnailUrl
          break
        case EMessageMediaTypes.AUDIO:
          notificationBody = "🎤 Voice message"
          break
        case EMessageMediaTypes.DOCUMENT:
          notificationBody = `📎 Sent a file: ${Media.fileName || "No name"}`
          break
        default:
          notificationBody = "Sent an attachment"
          break
      }
      break

    case EMessageTypes.CALL:
      // Đã được set ở trên khi phát hiện SVG
      notificationBody = "📞 Incoming call from " + (data.conversation.title || "Unknown")
      iconToShow = "/icons/phone.png"
      break

    default:
      notificationBody = message.content || "You have a new message"
      break
  }

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ includeUncontrolled: true })
      let shouldShowNotification = true
      console.log(">>> [Service Worker] check client", allClients)

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
        console.log(">>> [Service Worker] show notification")
        await self.registration.showNotification(data.conversation.title, {
          body: notificationBody,
          icon: iconToShow, // ✅ SỬ DỤNG iconToShow thay vì name
          badge: "../icons/icon-128.png",
          image: notificationImage, // ✅ THÊM image cho media messages
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
