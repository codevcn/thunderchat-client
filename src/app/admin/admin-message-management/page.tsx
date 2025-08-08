"use client"

import { AdminMessageManagement } from "./admin-message-management"
import { AdminNavigation } from "../../../components/layout/admin-navigation"
import { AdminHeader } from "../../../components/admin/admin-header"

export default function AdminMessageManagementPage() {
  return (
    <div className="flex min-h-screen bg-regular-black-cl">
      {/* Admin Navigation */}
      <AdminNavigation />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen">
        <div className="flex-1 overflow-y-auto STYLE-styled-scrollbar">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <AdminHeader
                title="Message Management"
                description="Monitor user message statistics, track communication patterns, and analyze messaging behavior"
              />

              {/* Content */}
              <div className="bg-regular-dark-gray-cl rounded-lg shadow border border-regular-hover-card-cl">
                <AdminMessageManagement />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
