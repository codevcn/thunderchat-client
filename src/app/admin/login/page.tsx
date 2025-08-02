"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

const AdminLoginPage = () => {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main admin page which handles the login flow
    router.replace("/admin")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-base text-white mt-5 ml-4">Redirecting to admin panel...</p>
    </div>
  )
}

export default AdminLoginPage
