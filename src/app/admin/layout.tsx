"use client"

import { AdminAuthProvider } from "@/providers/admin-auth-provider"
import { AdminRouteGuard } from "@/components/layout/admin-route-guard"
import { NON_GUARD_ROUTES } from "@/configs/layout"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminRouteGuard nonGuardRoutes={NON_GUARD_ROUTES}>
        {children as React.ReactElement}
      </AdminRouteGuard>
    </AdminAuthProvider>
  )
}
