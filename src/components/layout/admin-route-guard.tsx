"use client"

import { EAdminAuthStatus } from "@/utils/enums"
import { JSX, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useAdminAuth } from "@/hooks/admin-auth"
import { AppLoading } from "./app-loading"
import { toast } from "sonner"
import { useAdminRedirectToLogin } from "@/hooks/admin-navigation"

type TAdminGuardProps = {
  children: JSX.Element
}

const AdminGuard = ({ children }: TAdminGuardProps) => {
  const { adminAuthStatus } = useAdminAuth()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const adminRedirectToLogin = useAdminRedirectToLogin()

  const checkAuthStatus = () => {
    if (adminAuthStatus === EAdminAuthStatus.AUTHENTICATED) {
      setIsAuthenticated(true)
    } else if (adminAuthStatus === EAdminAuthStatus.UNAUTHENTICATED) {
      toast.error("Admin access required!")
      adminRedirectToLogin()
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [adminAuthStatus])

  if (isAuthenticated) return children

  return <AppLoading />
}

type TAdminRouteGuardProps = {
  children: JSX.Element
  nonGuardRoutes: string[]
}

export const AdminRouteGuard = ({ children, nonGuardRoutes }: TAdminRouteGuardProps) => {
  const pathname = usePathname()

  // Admin routes that don't need authentication
  const adminNonGuardRoutes = ["/admin", "/admin/login"]

  if (nonGuardRoutes.includes(pathname) || adminNonGuardRoutes.includes(pathname)) {
    return children
  }

  return <AdminGuard>{children}</AdminGuard>
}
