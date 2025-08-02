"use client"

import { AdminAuthProvider } from "@/providers/admin-auth-provider"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthProvider>{children as React.ReactElement}</AdminAuthProvider>
}
