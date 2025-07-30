"use client"

import { AdminDashboard } from "./admin-dashboard"
import { AdminNavigation } from "../../../components/layout/admin-navigation"
import { AdminHeader } from "../../../components/admin/admin-header"

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Admin Navigation */}
      <AdminNavigation />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen">
        <div className="flex-1 overflow-y-auto STYLE-styled-scrollbar">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <AdminHeader />

              {/* Content */}
              <div className="bg-card rounded-lg shadow border border-border">
                <AdminDashboard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
