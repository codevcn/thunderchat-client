"use client"

import { useState } from "react"
import { PASSWORD_REGEX } from "@/utils/regex"
import type { TRegisterUserParams } from "@/utils/types/be-api"
import { DatePicker, Spinner } from "@/components/materials"
import { userService } from "@/services/user.service"
import { useAuthRedirect } from "@/hooks/navigation"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { extractFormData } from "@/utils/helpers"
import { toast } from "sonner"

type TFormFields = TRegisterUserParams & {
   confirmPassword: string
}

type TFormDataErrors = Record<keyof TFormFields, { message: string }>

type TRegisterUserFormProps = {
   typedEmail: string
   onGoBack: () => void
}

export const RegisterForm = ({ typedEmail, onGoBack }: TRegisterUserFormProps) => {
   const [errors, setErrors] = useState<Partial<TFormDataErrors>>({})
   const authRedirect = useAuthRedirect()
   const [loading, setLoading] = useState<boolean>(false)

   const validateForm = (data: TFormFields): boolean => {
      let isValid = true
      const { birthday, firstName, lastName, password, confirmPassword } = data
      if (!birthday) {
         setErrors((pre) => ({
            ...pre,
            birthday: { message: "Please select a date" },
         }))
         isValid = false
      }
      if (!firstName) {
         setErrors((pre) => ({
            ...pre,
            firstName: { message: "Please enter your first name" },
         }))
         isValid = false
      }
      if (!lastName) {
         setErrors((pre) => ({
            ...pre,
            lastName: { message: "Please enter your last name" },
         }))
         isValid = false
      }
      if (!password) {
         setErrors((pre) => ({
            ...pre,
            password: { message: "Please enter your password" },
         }))
         isValid = false
      }
      if (password && !PASSWORD_REGEX.test(password)) {
         setErrors((pre) => ({
            ...pre,
            password: { message: "Password must be at least 8 characters long" },
         }))
         isValid = false
      }
      if (!confirmPassword || (password && password !== confirmPassword)) {
         setErrors((pre) => ({
            ...pre,
            confirmPassword: { message: "Passwords do not match" },
         }))
         isValid = false
      }
      return isValid
   }

   const registerUser = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      const data = extractFormData(e.currentTarget) as TFormFields
      if (!validateForm(data)) return

      setLoading(true)
      userService
         .registerUser(data)
         .then(() => {
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
            You are in register period, please complete the register by providing the following
            details. Thank you!
         </p>

         <form onSubmit={registerUser} className="space-y-4 text-regular-black-cl">
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
                     className="bg-transparent outline-none w-full p-3 border rounded-md text-white cursor-not-allowed"
                  />
               </div>

               <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-400">Date of Birth</label>
                  <DatePicker
                     btnClassName="w-[240px] bg-transparent h-[46.2px] hover:bg-transparent hover:text-[#9ca3af] text-[#9ca3af]"
                     withAnInput
                     inputName="birthday"
                  />
                  {errors.birthday && (
                     <p className="text-sm text-red-500">{errors.birthday.message}</p>
                  )}
               </div>
            </div>

            {/* First Name and Last Name row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label htmlFor="first-name" className="block text-sm font-medium text-gray-400">
                     First Name
                  </label>
                  <input
                     id="first-name"
                     type="text"
                     placeholder="Ex: John"
                     className={`w-full p-3 hover:border-regular-violet-cl outline-none focus:outline-regular-violet-cl focus:border-regular-violet-cl outline-offset-0 bg-transparent border rounded-md text-white ${
                        errors.firstName ? "border-red-500" : "border-gray-300"
                     }`}
                     name="firstName"
                  />
                  {errors.firstName && (
                     <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
               </div>

               <div className="space-y-1">
                  <label htmlFor="last-name" className="block text-sm font-medium text-gray-400">
                     Last Name
                  </label>
                  <input
                     id="last-name"
                     type="text"
                     placeholder="Ex: Doe"
                     className={`w-full p-3 hover:border-regular-violet-cl outline-none focus:outline-regular-violet-cl focus:border-regular-violet-cl outline-offset-0 bg-transparent border rounded-md text-white ${
                        errors.lastName ? "border-red-500" : "border-gray-300"
                     }`}
                     name="lastName"
                  />
                  {errors.lastName && (
                     <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
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
                  <p className="text-xs text-gray-400">
                     Password must be at least 8 characters long.
                  </p>
               )}
            </div>

            {/* Confirm Password field */}
            <div className="space-y-1">
               <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-400"
               >
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
                  className="w-full bg-regular-violet-cl text-white rounded-lg py-3 font-semibold hover:bg-[#8774E1] transition duration-200"
               >
                  {loading ? <Spinner className="h-[24px]" /> : <span>Submit</span>}
               </button>
            </div>
         </form>
      </>
   )
}
