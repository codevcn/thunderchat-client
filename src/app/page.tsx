"use client"

import { LoginForm } from "./login-form"
import { useEffect, useState } from "react"
import Image from "next/image"
import { useDebounce } from "@/hooks/debounce"
import validator from "validator"
import { userService } from "@/services/user.service"
import { ECheckUserStatus } from "./sharings"
import { Spinner } from "@/components/materials"
import { RegisterForm } from "./register-form"
import { useAuth } from "@/hooks/auth"
import { EAuthStatus } from "@/utils/enums"
import { getCurrentLocationPath, pureNavigator } from "@/utils/helpers"
import { localStorageManager } from "@/utils/local-storage"
import { toast } from "sonner"

type TLoginFormProps = {
   onSetCheckUserStatus: (status: ECheckUserStatus) => void
   onSetTypedEmail: (email: string) => void
}

const CheckUserForm = ({ onSetCheckUserStatus, onSetTypedEmail }: TLoginFormProps) => {
   const [showSubmitBtn, setShowSubmitBtn] = useState<boolean>(false)
   const [loading, setLoading] = useState<boolean>(false)
   const debounce = useDebounce()

   const handleInputChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      setShowSubmitBtn(e.target.value.length > 0)
   }, 300)

   const checkUser = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const email = e.currentTarget.email.value
      if (!validator.isEmail(email)) {
         toast.error("Please enter a valid email address.")
         return
      }
      setLoading(true)
      userService
         .getUserByEmail(email)
         .then(() => {
            onSetTypedEmail(email)
            onSetCheckUserStatus(ECheckUserStatus.EXIST)
         })
         .catch(() => {
            onSetTypedEmail(email)
            onSetCheckUserStatus(ECheckUserStatus.NOT_EXIST)
         })
         .finally(() => {
            setLoading(false)
         })
   }

   return (
      <>
         <p className="text-center text-gray-400 mb-8 max-w-md leading-tight">
            First of all, enter the email address associated with your account.
         </p>

         <form onSubmit={checkUser} className="flex flex-col items-center justify-center w-full">
            <div className="w-full max-w-md mb-6">
               <label className="block text-sm text-gray-400 mb-2 pl-2">Your email</label>
               <input
                  type="text"
                  placeholder="Enter your email..."
                  className="w-full outline-none hover:border-regular-violet-cl focus:border-regular-violet-cl focus:outline-regular-violet-cl outline-offset-0 bg-transparent border border-gray-700 rounded-lg p-4 text-white"
                  onChange={handleInputChange}
                  name="email"
               />
            </div>

            {showSubmitBtn && (
               <div className="w-full max-w-md">
                  <button
                     type="submit"
                     className="flex justify-center items-center w-full bg-regular-violet-cl text-white rounded-lg h-[40px] font-semibold hover:bg-[#8774E1] transition duration-200"
                  >
                     {loading ? <Spinner className="h-[24px]" /> : <span>Submit</span>}
                  </button>
               </div>
            )}
         </form>
      </>
   )
}

const HomePage = () => {
   const [checkUserStatus, setCheckUserStatus] = useState<ECheckUserStatus>(ECheckUserStatus.UNKOWN)
   const [typedEmail, setTypedEmail] = useState<string>("")
   const { authStatus } = useAuth()

   const handleSetCheckUserStatus = (status: ECheckUserStatus) => {
      setCheckUserStatus(status)
   }

   const goBack = () => {
      setCheckUserStatus(ECheckUserStatus.UNKOWN)
   }

   useEffect(() => {
      if (authStatus === EAuthStatus.AUTHENTICATED) {
         const lastPageAccessed = localStorageManager.getPrePageAccessed()
         if (lastPageAccessed && lastPageAccessed !== getCurrentLocationPath()) {
            pureNavigator(lastPageAccessed)
         } else {
            pureNavigator("/conversations")
         }
      }
   }, [authStatus])

   return (
      <div className="flex flex-col justify-center items-center min-h-screen px-4 py-8">
         {authStatus === EAuthStatus.UNAUTHENTICATED ? (
            <>
               <div className="flex flex-col items-center justify-center text-white p-4">
                  <div className="w-20 h-20 p-4 rounded-full bg-regular-violet-cl flex items-center justify-center mb-6">
                     <Image src="/images/logo.svg" alt="App Logo" width={150} height={150} />
                  </div>

                  <h1 className="text-4xl font-bold mb-4">Thunder Chat</h1>

                  <div hidden={checkUserStatus !== ECheckUserStatus.EXIST}>
                     <LoginForm typedEmail={typedEmail} onGoBack={goBack} />
                  </div>

                  <div hidden={checkUserStatus !== ECheckUserStatus.NOT_EXIST}>
                     <RegisterForm typedEmail={typedEmail} onGoBack={goBack} />
                  </div>

                  <div hidden={checkUserStatus !== ECheckUserStatus.UNKOWN}>
                     <CheckUserForm
                        onSetCheckUserStatus={handleSetCheckUserStatus}
                        onSetTypedEmail={setTypedEmail}
                     />
                  </div>
               </div>

               {/* QR Code Login Link */}
               <div className="mt-4">
                  <a href="#" className="text-[#8774E1] hover:underline">
                     LOG IN BY QR CODE
                  </a>
               </div>
            </>
         ) : (
            <>
               <div className="w-16 h-16 border-4 border-regular-violet-cl border-t-transparent rounded-full animate-spin"></div>
               <p className="text-base text-white mt-5">Checking your authentication status...</p>
            </>
         )}
      </div>
   )
}

export default HomePage
