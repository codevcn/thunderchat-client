"use client"

import { useRouter } from "next/navigation"

export const useAdminRedirect = () => {
  const router = useRouter()
  return () => {
    router.push("/admin/admin-dashboard-management")
  }
}

export const useAdminRedirectToLogin = () => {
  const router = useRouter()
  return () => {
    router.push("/admin")
  }
}
