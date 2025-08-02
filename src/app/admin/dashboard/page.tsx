"use client"

import { useAdminAuth } from "@/hooks/admin-auth"
import { EAdminAuthStatus } from "@/utils/enums"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

const AdminDashboard = () => {
  const { adminAuthStatus } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (adminAuthStatus === EAdminAuthStatus.UNAUTHENTICATED) {
      router.push("/admin")
    }
  }, [adminAuthStatus, router])

  if (adminAuthStatus === EAdminAuthStatus.UNKNOWN) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-base text-white mt-5 ml-4">Loading admin dashboard...</p>
      </div>
    )
  }

  if (adminAuthStatus === EAdminAuthStatus.UNAUTHENTICATED) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-red-400">Admin Dashboard</h1>
          <button
            onClick={() => router.push("/")}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition duration-200"
          >
            Back to User App
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">User Management</h3>
            <p className="text-gray-400">Manage users, roles, and permissions</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">System Statistics</h3>
            <p className="text-gray-400">View system performance and analytics</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Content Moderation</h3>
            <p className="text-gray-400">Moderate messages and content</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Settings</h3>
            <p className="text-gray-400">Configure system settings</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Logs</h3>
            <p className="text-gray-400">View system logs and activity</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Reports</h3>
            <p className="text-gray-400">Generate and view reports</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
