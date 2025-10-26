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

  const name = data.conversation.message.Author.Profile.avatar || "../images/user/avatar.png"
  const message = data.conversation.message
  const type = message.type?.toUpperCase()
  const { Media, Sticker } = message

  let notificationBody = ""
  if (message.content && message.content.includes("<svg")) {
    type = "CALL" // Ghi đè type nếu phát hiện SVG
  }
  switch (type) {
    case EMessageTypes.TEXT:
      notificationBody = message.content || "[Không có nội dung]"
      break

    case EMessageTypes.STICKER:
      notificationBody = "Đã gửi một sticker"

      notificationImage = Sticker?.imageUrl
      break
    case EMessageTypes.MEDIA:
      if (!Media) {
        notificationBody = "[Nội dung media không hợp lệ]"
        break
      }
      const mediaType = Media.type?.toUpperCase()

      switch (mediaType) {
        case EMessageMediaTypes.IMAGE:
          notificationBody = "📷 Đã gửi một hình ảnh"
          notificationImage = Media.url
          break
        case EMessageMediaTypes.VIDEO:
          notificationBody = `🎥 Đã gửi một video: ${Media.fileName || "Không có tên"}`

          notificationImage = Media.thumbnailUrl
          break

        case EMessageMediaTypes.AUDIO:
          notificationBody = "🎤 Tin nhắn thoại"

          break

        case EMessageMediaTypes.DOCUMENT:
          notificationBody = `📎 Đã gửi tệp: ${Media.fileName || "Không có tên"}`

          break
        default:
          notificationBody = "Đã gửi một tệp đính kèm"
          break
      }
      break
    case EMessageTypes.CALL:
      notificationBody = "📞 Cuộc gọi đến từ " + (data.conversation.title || name)
      // Có thể thêm icon hoặc hình ảnh đặc trưng cho cuộc gọi
      // notificationImage = '../icons/call-icon.png'; // Nếu có icon cuộc gọi
      break
    default:
      // Fallback cho các loại không xác định hoặc nội dung HTML phức tạp
      notificationBody = message.content || "Bạn có tin nhắn mới"
      break
  }
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
          body: notificationBody,
          icon: name,
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
