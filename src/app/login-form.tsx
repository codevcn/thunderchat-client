"use client"

import { useState } from "react"
import { ArrowLeft, Info } from "lucide-react"
import { Checkbox, CustomTooltip, Spinner } from "@/components/materials"
import validator from "validator"
import { Eye, EyeOff } from "lucide-react"
import { authService } from "@/services/auth.service"
import { extractFormData } from "@/utils/helpers"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { useAuthRedirect } from "@/hooks/navigation"
import type { TCheckboxValue } from "@/utils/types/global"
import { toast } from "sonner"

type TLoginFormData = {
   email: string
   password: string
   keepSigned: TCheckboxValue
}

type TLoginFormProps = {
   typedEmail: string
   onGoBack: () => void
}

export const LoginForm = ({ typedEmail, onGoBack }: TLoginFormProps) => {
   const [loading, setLoading] = useState<boolean>(false)
   const authRedirect = useAuthRedirect()

   const loginUser = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const { email, password, keepSigned } = extractFormData<TLoginFormData>(e.currentTarget)
      if (validator.isEmail(email)) {
         setLoading(true)
         authService
            .loginUser(email, password, keepSigned === "on")
            .then(() => {
               setTimeout(() => {
                  authRedirect()
               }, 500)
            })
            .catch((error) => {
               toast.error(axiosErrorHandler.handleHttpError(error).message)
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
            className="fixed top-5 left-5 bg-regular-violet-cl text-white px-4 py-2 rounded-lg shadow-md hover:bg-[#8774E1] transition duration-200 flex items-center"
         >
            <ArrowLeft className="w-5 h-5" />
         </button>

         <p className="text-center text-gray-400 mb-8 max-w-md">
            Complete login process by entering the password.
         </p>

         <form onSubmit={loginUser} className="flex flex-col items-center justify-center w-full">
            <div className="w-full max-w-md mb-6">
               <label className="block text-sm text-gray-400 mb-2 pl-2">Your email</label>
               <input
                  type="email"
                  placeholder="Enter your email..."
                  readOnly
                  defaultValue={typedEmail}
                  className="w-full cursor-not-allowed outline-none bg-transparent border border-gray-700 rounded-lg p-4 text-white"
                  name="email"
               />
            </div>
            <div className="w-full max-w-md mb-6">
               <label className="block text-sm text-gray-400 mb-2 pl-2">Your password</label>
               <div className="input-container relative">
                  <input
                     id="password"
                     type="password"
                     placeholder="Enter your password"
                     className="w-full hover:border-regular-violet-cl outline-none focus:outline-regular-violet-cl focus:border-regular-violet-cl outline-offset-0 p-4 bg-transparent border border-gray-700 rounded-md text-white"
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
               <Checkbox inputId="keep-user-signed-in-input" inputName="keepSigned" />
               <div className="flex items-center gap-1 text-gray-300">
                  <label htmlFor="keep-user-signed-in-input" className="cursor-pointer">
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
               <button className="flex justify-center items-center w-full bg-regular-violet-cl text-white rounded-lg h-[40px] font-semibold hover:bg-[#8774E1] transition duration-200">
                  {loading ? <Spinner className="h-[24px]" /> : <span>Submit</span>}
               </button>
            </div>
         </form>
      </>
   )
}
