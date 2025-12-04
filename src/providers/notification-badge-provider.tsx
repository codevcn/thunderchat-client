"use client"

import { useNotificationBadge } from "@/hooks/use-notification-badge"

/**
 * Provider component để kích hoạt notification badge
 * Đặt ở root layout để hoạt động trên toàn app
 */
export function NotificationBadgeProvider({ children }: { children: React.ReactNode }) {
  useNotificationBadge()

  return <>{children}</>
}
