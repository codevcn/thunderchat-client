"use client"

import { pureNavigator } from "@/utils/helpers"

export const useAdminRedirect = () => {
  return () => {
    pureNavigator("/admin/dashboard")
  }
}

export const useAdminRedirectToLogin = () => {
  return () => {
    pureNavigator("/admin")
  }
}
