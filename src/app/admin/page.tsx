"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminDashboard } from "./admin-dashboard/admin-dashboard"
import { AdminNavigation } from "../../components/layout/admin-navigation"

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard page
    router.replace("/admin/admin-dashboard")
  }, [router])

  // Show loading while redirecting
  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang chuyển hướng...</p>
        </div>
      </div>
    </div>
  )
}
