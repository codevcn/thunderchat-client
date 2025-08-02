"use client"

import { useState } from "react"
import { ArrowLeft, Info, Shield } from "lucide-react"
import { Checkbox, CustomTooltip, Spinner } from "@/components/materials"
import validator from "validator"
import { Eye, EyeOff } from "lucide-react"
import { authService } from "@/services/auth.service"
import { extractFormData } from "@/utils/helpers"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { AdminErrorHandler } from "@/utils/admin-error-handler"
import type { TCheckboxValue } from "@/utils/types/global"
import { toast } from "sonner"
import { useAppDispatch } from "@/hooks/redux"
import { setAdminAuthStatus } from "@/redux/auth/admin-auth.slice"
import { EAdminAuthStatus } from "@/utils/enums"
import { useAdminRedirect } from "@/hooks/admin-navigation"

type TAdminLoginFormData = {
  email: string
  password: string
  keepSigned: TCheckboxValue
}

type TAdminLoginFormProps = {
  typedEmail: string
  onGoBack: () => void
}

export const AdminLoginForm = ({ typedEmail, onGoBack }: TAdminLoginFormProps) => {
  const [loading, setLoading] = useState<boolean>(false)
  const dispatch = useAppDispatch()
  const adminRedirect = useAdminRedirect()

  const handleAdminError = (error: any) => {
    const errorMessage = axiosErrorHandler.handleHttpError(error).message
    const adminErrorMessage = AdminErrorHandler.handleAdminError(errorMessage)
    toast.error(adminErrorMessage)
  }

  const loginAdmin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const { email, password, keepSigned } = extractFormData<TAdminLoginFormData>(e.currentTarget)
    if (validator.isEmail(email)) {
      setLoading(true)
      authService
        .loginAdmin(email, password, keepSigned === "on")
        .then(() => {
          dispatch(setAdminAuthStatus(EAdminAuthStatus.AUTHENTICATED))
          toast.success("Admin login successful! Welcome to admin panel.")
          // Let the admin page handle the redirect
        })
        .catch((error) => {
          handleAdminError(error)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }

  const hideShowPassword = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const target = e.currentTarget
    const input = target.closest(".input-container")?.querySelector("input") as HTMLInputElement
    if (input) {
      if (input.type === "password") {
        input.type = "text"
        target.children[0].classList.remove("hidden")
        target.children[1].classList.add("hidden")
      } else {
        input.type = "password"
        target.children[0].classList.add("hidden")
        target.children[1].classList.remove("hidden")
      }
    }
  }

  return (
    <>
      <button
        onClick={onGoBack}
        className="fixed top-5 left-5 bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition duration-200 flex items-center"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center justify-center mb-6">
        <div className="bg-red-600 p-3 rounded-full mr-3">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
      </div>

      <p className="text-center text-gray-400 mb-8 max-w-md">
        Complete admin login process by entering your credentials.
      </p>

      <form onSubmit={loginAdmin} className="flex flex-col items-center justify-center w-full">
        <div className="w-full max-w-md mb-6">
          <label className="block text-sm text-gray-400 mb-2 pl-2">Admin email</label>
          <input
            type="email"
            placeholder="Enter admin email..."
            readOnly
            defaultValue={typedEmail}
            className="w-full cursor-not-allowed outline-none bg-transparent border border-gray-700 rounded-lg p-4 text-white"
            name="email"
          />
        </div>
        <div className="w-full max-w-md mb-6">
          <label className="block text-sm text-gray-400 mb-2 pl-2">Admin password</label>
          <div className="input-container relative">
            <input
              id="password"
              type="password"
              placeholder="Enter admin password"
              className="w-full hover:border-red-600 outline-none focus:outline-red-600 focus:border-red-600 outline-offset-0 p-4 bg-transparent border border-gray-700 rounded-md text-white"
              name="password"
            />
            <button
              onClick={hideShowPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              type="button"
            >
              <span className="hidden">
                <Eye className="w-5 h-5 text-gray-400" />
              </span>
              <span>
                <EyeOff className="w-5 h-5 text-gray-400" />
              </span>
            </button>
          </div>
        </div>

        {/* Keep me signed in checkbox */}
        <div className="flex items-center gap-3 mb-8">
          <Checkbox inputId="keep-admin-signed-in-input" inputName="keepSigned" />
          <div className="flex items-center gap-1 text-gray-300">
            <label htmlFor="keep-admin-signed-in-input" className="cursor-pointer">
              Keep me signed in
            </label>
            <CustomTooltip title="This will keep you logged in even after closing the app.">
              <span>
                <Info className="w-4 h-4 text-gray-400 ml-1" />
              </span>
            </CustomTooltip>
          </div>
        </div>

        <div className="w-full max-w-md">
          <button className="flex justify-center items-center w-full bg-red-600 text-white rounded-lg h-[40px] font-semibold hover:bg-red-700 transition duration-200">
            {loading ? <Spinner className="h-[24px]" /> : <span>Admin Login</span>}
          </button>
        </div>
      </form>
    </>
  )
}
