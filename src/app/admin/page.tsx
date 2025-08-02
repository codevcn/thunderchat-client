"use client"

import { AdminLoginForm } from "../admin-login-form"
import { useEffect, useState } from "react"
import Image from "next/image"
import { ECheckUserStatus } from "../sharings"
import { useAdminAuth } from "@/hooks/admin-auth"
import { EAdminAuthStatus } from "@/utils/enums"
import { useAdminRedirect } from "@/hooks/admin-navigation"
import AdminCheckUserForm from "../admin-check-user-form"

const AdminPage = () => {
  const [checkUserStatus, setCheckUserStatus] = useState<ECheckUserStatus>(ECheckUserStatus.UNKOWN)
  const [typedEmail, setTypedEmail] = useState<string>("")
  const { adminAuthStatus } = useAdminAuth()
  const adminRedirect = useAdminRedirect()

  const handleSetCheckUserStatus = (status: ECheckUserStatus) => {
    setCheckUserStatus(status)
  }

  const goBack = () => {
    setCheckUserStatus(ECheckUserStatus.UNKOWN)
  }

  useEffect(() => {
    if (adminAuthStatus === EAdminAuthStatus.AUTHENTICATED) {
      adminRedirect()
    }
  }, [adminAuthStatus, adminRedirect])

  // Show loading while checking authentication
  if (adminAuthStatus === EAdminAuthStatus.UNKNOWN) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen px-4 py-8">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-base text-white mt-5">Checking admin authentication status...</p>
      </div>
    )
  }

  // If already authenticated, show loading while redirecting
  if (adminAuthStatus === EAdminAuthStatus.AUTHENTICATED) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen px-4 py-8">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-base text-white mt-5">Redirecting to admin dashboard...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen px-4 py-8">
      {adminAuthStatus === EAdminAuthStatus.UNAUTHENTICATED && (
        <>
          <div className="flex flex-col items-center justify-center text-white p-4">
            <div className="w-20 h-20 p-4 rounded-full bg-red-600 flex items-center justify-center mb-6">
              <Image src="/images/logo.svg" alt="App Logo" width={150} height={150} />
            </div>

            <h1 className="text-4xl font-bold mb-4 text-red-600">Admin Panel</h1>

            <div hidden={checkUserStatus !== ECheckUserStatus.EXIST}>
              <AdminLoginForm typedEmail={typedEmail} onGoBack={goBack} />
            </div>

            <div hidden={checkUserStatus !== ECheckUserStatus.NOT_EXIST}>
              <div className="text-center">
                <p className="text-red-400 mb-4">This email is not registered as an admin.</p>
                <button
                  onClick={goBack}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-200"
                >
                  Go Back
                </button>
              </div>
            </div>

            <div hidden={checkUserStatus !== ECheckUserStatus.UNKOWN}>
              <AdminCheckUserForm
                onSetCheckUserStatus={handleSetCheckUserStatus}
                onSetTypedEmail={setTypedEmail}
              />
            </div>
          </div>

          {/* Back to User Login */}
          <div className="mt-4">
            <a href="/" className="text-gray-400 hover:text-white underline">
              ← Back to User Login
            </a>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminPage
