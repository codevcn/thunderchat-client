"use client"

import { useState } from "react"
import { PASSWORD_REGEX } from "@/utils/regex"
import type { TRegisterUserParams } from "@/utils/types/be-api"
import { Calendar, CustomDialog, Spinner } from "@/components/materials"
import { userService } from "@/services/user.service"
import { useAuthRedirect } from "@/hooks/navigation"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { extractFormData } from "@/utils/helpers"
import { toast } from "sonner"
import dayjs from "dayjs"
import { checkkIfUnder18 } from "@/utils/date-time"
import { ClientCookieManager } from "@/utils/cookie"

type TFormFields = TRegisterUserParams & {
  confirmPassword: string
}

type TFormDataErrors = Record<keyof TFormFields, { message: string }>

type TRegisterUserFormProps = {
  typedEmail: string
  onGoBack: () => void
}

const BIRTHDAY_INPUT_FORMAT: string = "YYYY-MM-DD"

export const RegisterForm = ({ typedEmail, onGoBack }: TRegisterUserFormProps) => {
  const [errors, setErrors] = useState<Partial<TFormDataErrors>>({})
  const authRedirect = useAuthRedirect()
  const [loading, setLoading] = useState<boolean>(false)
  const [showBirthdayDialog, setShowBirthdayDialog] = useState<boolean>(false)
  const [birthday, setBirthday] = useState<Date | undefined>(undefined)

  const handleDateChange = (date: Date | undefined) => {
    setBirthday(date)
  }

  const validateForm = (data: TFormFields): boolean => {
    let isValid = true
    const { birthday, fullName, password, confirmPassword } = data
    if (checkkIfUnder18(birthday)) {
      setErrors((pre) => ({
        ...pre,
        birthday: { message: "You must be at least 18 years old" },
      }))
      isValid = false
    } else {
      setErrors((pre) => ({ ...pre, birthday: undefined }))
    }
    if (!fullName) {
      setErrors((pre) => ({
        ...pre,
        fullName: { message: "Please enter your full name" },
      }))
      isValid = false
    } else {
      setErrors((pre) => ({ ...pre, fullName: undefined }))
    }
    if (password && !PASSWORD_REGEX.test(password)) {
      setErrors((pre) => ({
        ...pre,
        password: {
          message:
            "Password must be at least 6 characters long and contain at least one uppercase letter and one number",
        },
      }))
      isValid = false
    } else {
      setErrors((pre) => ({
        ...pre,
        password: undefined,
      }))
    }
    if (!confirmPassword || (password && password !== confirmPassword)) {
      setErrors((pre) => ({
        ...pre,
        confirmPassword: { message: "Passwords do not match" },
      }))
      isValid = false
    } else {
      setErrors((pre) => ({ ...pre, confirmPassword: undefined }))
    }
    return isValid
  }

  const registerUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const data = extractFormData(e.currentTarget) as TFormFields
    if (!validateForm(data)) return
    const birthday = dayjs(data.birthday).toISOString()

    setErrors({})
    setLoading(true)
    userService
      .registerUser({ ...data, birthday })
      .then((result) => {
        ClientCookieManager.setAuthCookie(result.jwt_token)
        setTimeout(() => {
          authRedirect()
        }, 500)
      })
      .catch((err) => {
        toast.error(axiosErrorHandler.handleHttpError(err).message)
      })
      .finally(() => {
        setLoading(false)
      })
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
        className="fixed top-5 left-5 bg-regular-violet-cl text-white px-4 py-2 rounded-lg shadow-md hover:bg-[#8774E1] transition duration-200 flex items-center"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <p className="Register-Description text-center text-gray-400 mb-8 max-w-md leading-tight">
        You are in register period, please complete the register by providing the following details.
        Thank you!
      </p>

      <form onSubmit={registerUser} className="space-y-4 text-regular-black-cl max-w-md">
        {/* Email and Date of Birth row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-400">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Ex: example@email.com"
              defaultValue={typedEmail}
              readOnly
              name="email"
              className="bg-transparent outline-none p-3 border rounded-md text-white cursor-not-allowed w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-400">Date of Birth</label>
            <input
              id="birthday"
              type="text"
              placeholder="Ex: 20/01/2000"
              value={
                birthday
                  ? dayjs(birthday).format(BIRTHDAY_INPUT_FORMAT)
                  : dayjs().format(BIRTHDAY_INPUT_FORMAT)
              }
              readOnly
              name="birthday"
              className="bg-transparent outline-none p-3 border rounded-md text-white cursor-text w-full"
              onClick={() => setShowBirthdayDialog(true)}
            />
            {errors.birthday && <p className="text-sm text-red-500">{errors.birthday.message}</p>}
          </div>
        </div>

        {/* First Name and Last Name row */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1">
            <label htmlFor="full-name" className="block text-sm font-medium text-gray-400">
              Full Name
            </label>
            <input
              id="full-name"
              type="text"
              placeholder="Ex: John Doe"
              className={`w-full p-3 hover:border-regular-violet-cl outline-none focus:outline-regular-violet-cl focus:border-regular-violet-cl outline-offset-0 bg-transparent border rounded-md text-white ${
                errors.fullName ? "border-red-500" : "border-gray-300"
              }`}
              name="fullName"
            />
            {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
          </div>
        </div>

        {/* Password field */}
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-400">
            Password
          </label>
          <div className="input-container relative">
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              className={`w-full p-3 hover:border-regular-violet-cl outline-none focus:outline-regular-violet-cl focus:border-regular-violet-cl outline-offset-0 bg-transparent border rounded-md text-white ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
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
          {errors.password ? (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          ) : (
            <p className="text-xs text-gray-400">Password must be at least 8 characters long.</p>
          )}
        </div>

        {/* Confirm Password field */}
        <div className="space-y-1">
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-400">
            Confirm Password
          </label>
          <div className="input-container relative">
            <input
              id="confirm-password"
              type="password"
              placeholder="Enter your password"
              className={`w-full p-3 hover:border-regular-violet-cl outline-none focus:outline-regular-violet-cl focus:border-regular-violet-cl outline-offset-0 bg-transparent border rounded-md text-white ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
              name="confirmPassword"
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
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="flex justify-center items-center w-full bg-regular-violet-cl text-white rounded-lg h-[40px] font-semibold hover:bg-[#8774E1] transition duration-200"
          >
            {loading ? <Spinner className="h-[24px]" /> : <span>Submit</span>}
          </button>
        </div>
      </form>

      <CustomDialog
        open={showBirthdayDialog}
        onHideShow={setShowBirthdayDialog}
        dialogBody={
          <div className="flex flex-col gap-2 w-fit mt-4 mb-2">
            <div className="DatePicker-input-button w-fit">
              <Calendar
                mode="single"
                selected={birthday}
                onSelect={handleDateChange}
                captionLayout="dropdown"
                className="!text-regular-icon-cl bg-transparent border-2 border-gray-500 border-solid rounded-md"
              />
            </div>
          </div>
        }
        dialogHeader={{
          title: "Select your birthday",
        }}
      />
    </>
  )
}
