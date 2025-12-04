// hooks/useNotificationBadge.ts
import { useEffect, useRef } from "react"
import { useAppSelector } from "@/hooks/redux"

/**
 * Hook để cập nhật badge notification trên browser tab
 * Hiển thị số tin nhắn chưa đọc trên favicon và title
 */
export function useNotificationBadge() {
  const conversations = useAppSelector((state) => state.conversations?.conversations || [])
  const { directChat, groupChat } = useAppSelector((state) => state.messages)
  const prevUnreadCountRef = useRef<number>(0)

  useEffect(() => {
    // Tính tổng số tin nhắn chưa đọc từ tất cả conversations
    let totalUnread = 0

    for (const conversation of conversations) {
      // Không tính chat đang mở
      const isCurrentChat =
        (directChat && conversation.id === directChat.id && conversation.type === "DIRECT") ||
        (groupChat && conversation.id === groupChat.id && conversation.type === "GROUP")

      if (!isCurrentChat) {
        totalUnread += conversation.unreadMessageCount || 0
      }
    }

    // Kiểm tra nếu có tin nhắn mới để bật animation
    const hasNewMessage = totalUnread > prevUnreadCountRef.current
    prevUnreadCountRef.current = totalUnread

    // Cập nhật document title
    updateTitle(totalUnread)

    // Cập nhật favicon với badge
    updateFavicon(totalUnread)

    // Nếu có tin nhắn mới, bật animation nhấp nháy
    if (hasNewMessage && totalUnread > 0) {
      startBlink(totalUnread)
    }

    // Cleanup khi unmount
    return () => {
      stopBlink()
    }
  }, [conversations, directChat, groupChat])

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      resetTitle()
      resetFavicon()
      stopBlink()
    }
  }, [])
}

/**
 * Cập nhật title với số tin nhắn chưa đọc
 */
function updateTitle(count: number) {
  const baseTitle = "Thunder Chat"

  if (count > 0) {
    document.title = `(${count > 99 ? "99+" : count}) ${baseTitle}`
  } else {
    document.title = baseTitle
  }
}

/**
 * Reset title về mặc định
 */
function resetTitle() {
  document.title = "Thunder Chat"
}

/**
 * Tạo favicon với badge notification
 */
function updateFavicon(count: number) {
  const canvas = document.createElement("canvas")
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext("2d")

  if (!ctx) return

  // Vẽ background circle (màu xanh của Thunder Chat)
  ctx.fillStyle = "#3b82f6"
  ctx.beginPath()
  ctx.arc(16, 16, 16, 0, 2 * Math.PI)
  ctx.fill()

  if (count > 0) {
    // Vẽ badge đỏ ở góc phải trên
    const badgeSize = count > 9 ? 17 : 20
    ctx.fillStyle = "#ef4444"
    ctx.beginPath()
    ctx.arc(24, 8, badgeSize / 2, 0, 2 * Math.PI)
    ctx.fill()

    ctx.fillStyle = "#ffffff"
    ctx.font = count > 9 ? "bold 8px Arial" : "bold 9px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    const text = count > 99 ? "99+" : count.toString()
    ctx.fillText(text, 24, 8)
  } else {
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 18px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("⚡", 16, 16)
  }

  const link =
    (document.querySelector("link[rel*='icon']") as HTMLLinkElement) || createFaviconLink()
  link.href = canvas.toDataURL()
}

function resetFavicon() {
  const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
  if (link) {
    link.href = "/public/favicon.ico"
  }
}

function createFaviconLink(): HTMLLinkElement {
  const link = document.createElement("link")
  link.rel = "icon"
  link.type = "image/x-icon"
  document.head.appendChild(link)
  return link
}

/**
 * Animation nhấp nháy cho title khi có tin nhắn mới
 */
let blinkInterval: NodeJS.Timeout | null = null
let blinkTimeout: NodeJS.Timeout | null = null

function startBlink(count: number) {
  // Clear interval cũ nếu có
  stopBlink()

  let isVisible = true
  const baseTitle = "Thunder Chat"

  blinkInterval = setInterval(() => {
    isVisible = !isVisible
    document.title = isVisible ? `(${count > 99 ? "99+" : count}) ${baseTitle}` : baseTitle
  }, 1000)

  // Dừng nhấp nháy sau 10 giây
  blinkTimeout = setTimeout(() => {
    stopBlink()
    updateTitle(count)
  }, 10000)
}

function stopBlink() {
  if (blinkInterval) {
    clearInterval(blinkInterval)
    blinkInterval = null
  }
  if (blinkTimeout) {
    clearTimeout(blinkTimeout)
    blinkTimeout = null
  }
}

export function useTitleBadge() {
  const conversations = useAppSelector((state) => state.conversations?.conversations || [])
  const { directChat, groupChat } = useAppSelector((state) => state.messages)

  useEffect(() => {
    let totalUnread = 0

    for (const conversation of conversations) {
      const isCurrentChat =
        (directChat && conversation.id === directChat.id && conversation.type === "DIRECT") ||
        (groupChat && conversation.id === groupChat.id && conversation.type === "GROUP")

      if (!isCurrentChat) {
        totalUnread += conversation.unreadMessageCount || 0
      }
    }

    updateTitle(totalUnread)

    return () => resetTitle()
  }, [conversations, directChat, groupChat])
}
