"use client"

import { useState } from "react"
import { Shield } from "lucide-react"
import { useDebounce } from "@/hooks/debounce"
import validator from "validator"
import { authService } from "@/services/auth.service"
import { ECheckUserStatus } from "./sharings"
import { Spinner } from "@/components/materials"
import { toast } from "sonner"
import { AdminErrorHandler } from "@/utils/admin-error-handler"
import axiosErrorHandler from "@/utils/axios-error-handler"

type TAdminCheckUserFormProps = {
  onSetCheckUserStatus: (status: ECheckUserStatus) => void
  onSetTypedEmail: (email: string) => void
}

const AdminCheckUserForm = ({
  onSetCheckUserStatus,
  onSetTypedEmail,
}: TAdminCheckUserFormProps) => {
  const [showSubmitBtn, setShowSubmitBtn] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const debounce = useDebounce()

  const handleInputChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowSubmitBtn(e.target.value.length > 0)
  }, 300)

  const checkAdminUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const email = e.currentTarget.email.value
    if (!validator.isEmail(email)) {
      toast.error("Please enter a valid email address.")
      return
    }
    setLoading(true)

    try {
      // Kiểm tra email có quyền admin không
      const isAdmin = await authService.checkEmailIsAdmin(email)

      if (isAdmin) {
        onSetTypedEmail(email)
        onSetCheckUserStatus(ECheckUserStatus.EXIST)
      } else {
        // Reset về trạng thái ban đầu thay vì chuyển sang NOT_EXIST
        onSetCheckUserStatus(ECheckUserStatus.UNKOWN)
        toast.error("Access denied. This email does not have admin privileges.")
      }
    } catch (error) {
      // Reset về trạng thái ban đầu thay vì chuyển sang NOT_EXIST
      onSetCheckUserStatus(ECheckUserStatus.UNKOWN)
      const errorMessage = axiosErrorHandler.handleHttpError(error).message
      const adminErrorMessage = AdminErrorHandler.handleEmailCheckError(errorMessage)
      toast.error(adminErrorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-center mb-6">
        <div className="bg-red-600 p-3 rounded-full mr-3">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
      </div>

      <p className="text-center text-gray-400 mb-8 max-w-md leading-tight">
        Enter the admin email address to access the admin panel.
      </p>

      <form onSubmit={checkAdminUser} className="flex flex-col items-center justify-center w-full">
        <div className="w-full max-w-md mb-6">
          <label className="block text-sm text-gray-400 mb-2 pl-2">Admin email</label>
          <input
            type="text"
            placeholder="Enter admin email..."
            className="w-full outline-none hover:border-red-600 focus:border-red-600 focus:outline-red-600 outline-offset-0 bg-transparent border border-gray-700 rounded-lg p-4 text-white"
            onChange={handleInputChange}
            name="email"
          />
        </div>

        {showSubmitBtn && (
          <div className="w-full max-w-md">
            <button
              type="submit"
              className="flex justify-center items-center w-full bg-red-600 text-white rounded-lg h-[40px] font-semibold hover:bg-red-700 transition duration-200"
            >
              {loading ? <Spinner className="h-[24px]" /> : <span>Continue to Admin Login</span>}
            </button>
          </div>
        )}
      </form>
    </>
  )
}

export default AdminCheckUserForm
