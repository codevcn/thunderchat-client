"use client"

import { LoginForm } from "./login-form"
import { useEffect, useState } from "react"
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
import { AppLoading } from "@/components/layout/app-loading"
import ForgotPasswordModal from "@/components/account/forgot-password-modal"

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
  const [showForgot, setShowForgot] = useState(false)

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

  return authStatus === EAuthStatus.UNAUTHENTICATED ? (
    <div className="flex flex-col justify-center items-center min-h-screen px-4 py-8">
      <div className="flex flex-col items-center justify-center text-white p-4">
        <div className="w-20 h-20 p-4 rounded-full bg-regular-violet-cl flex items-center justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="#fff"
            viewBox="11.53 1.39 41.08 61.26"
            height="150px"
            width="150px"
          >
            <path d="M52.5,2.2c0.3-0.4-0.1-0.9-0.5-0.8L26.1,7.2c-0.1,0-0.3,0.1-0.3,0.3L13.9,29.6c-0.2,0.4,0.1,0.9,0.6,0.8l6.5-1.4  c0.4-0.1,0.8,0.4,0.6,0.7l-8.4,16.7c-0.2,0.4,0.2,0.8,0.6,0.7l5.1-1.2c0.4-0.1,0.8,0.4,0.6,0.8l-7.9,15.2c-0.3,0.5,0.4,1,0.8,0.6  l20.8-18.8c0.4-0.3,0.1-1-0.4-0.9l-2.3,0.3c-0.5,0.1-0.8-0.4-0.5-0.8L42,24.9c0.3-0.4-0.1-0.9-0.5-0.8l-4.6,1  c-0.5,0.1-0.8-0.4-0.5-0.8L52.5,2.2z M19.3,26.3c0.1,0.2,0.4,0.3,0.7,0.3l2-0.4c0.9-0.2,1.8,0.1,2.3,0.8c0.6,0.7,0.6,1.7,0.2,2.5  l-6.7,13.3l2.2-0.5c0.9-0.2,1.8,0.1,2.3,0.8c0.5,0.7,0.6,1.7,0.2,2.5l-2.5,4.7C20,50.4,20,50.6,20,50.7v2.6c0,0.3-0.1,0.6-0.4,0.8  L14,59.2L21.4,45c0.2-0.4,0.2-0.8-0.1-1.1c-0.2-0.3-0.5-0.4-0.8-0.4c-0.1,0-0.2,0-0.2,0l-4.8,1.1l7.9-15.7c0.2-0.4,0.1-0.8-0.1-1.1  c-0.2-0.3-0.7-0.5-1.1-0.4l-6.1,1.3l9.9-18.4h1.4l-8.3,15.4C19.2,25.9,19.2,26.1,19.3,26.3z"></path>
          </svg>
        </div>

        <h1 className="text-4xl font-bold mb-4">Thunder Chat</h1>

        {checkUserStatus === ECheckUserStatus.EXIST ? (
          <>
            <LoginForm typedEmail={typedEmail} onGoBack={goBack} />
            <div className="mt-3 text-center">
              <button
                className="text-[#8774E1] hover:underline text-sm"
                onClick={() => setShowForgot(true)}
              >
                Forgot password?
              </button>
            </div>
          </>
        ) : checkUserStatus === ECheckUserStatus.NOT_EXIST ? (
          <RegisterForm typedEmail={typedEmail} onGoBack={goBack} />
        ) : (
          <CheckUserForm
            onSetCheckUserStatus={handleSetCheckUserStatus}
            onSetTypedEmail={setTypedEmail}
          />
        )}
      </div>

      {/* QR Code Login Link */}
      {/* <div className="mt-4">
        <a href="#" className="text-[#8774E1] hover:underline">
          LOG IN BY QR CODE
        </a>
      </div> */}
      <ForgotPasswordModal
        open={showForgot}
        onClose={() => setShowForgot(false)}
        defaultEmail={typedEmail}
      />
    </div>
  ) : (
    <AppLoading />
  )
}

export default HomePage
