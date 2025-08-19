"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Eye, EyeOff, Mail, RefreshCcw } from "lucide-react"
import { toast } from "@/components/materials"
import { userService } from "@/services/user.service"

type TForgotStep = "email" | "otp" | "reset"

interface ForgotPasswordModalProps {
  open: boolean
  onClose: () => void
  defaultEmail?: string
}

const RESEND_COOLDOWN_MS = 60_000
const OTP_LENGTH = 6

const ForgotPasswordModal = ({ open, onClose, defaultEmail }: ForgotPasswordModalProps) => {
  const [step, setStep] = useState<TForgotStep>("email")
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")

  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState("")
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""))
  const otpRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null))

  const [resetToken, setResetToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [newPasswordError, setNewPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [resendAt, setResendAt] = useState<number | null>(null)
  const [now, setNow] = useState<number>(Date.now())
  const [otpAttemptsExceeded, setOtpAttemptsExceeded] = useState(false)
  const [resendSpam, setResendSpam] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (open) {
      setStep("email")
      setEmail(defaultEmail || "")
      setEmailError("")
      setOtp("")
      setOtpDigits(Array(OTP_LENGTH).fill(""))
      setOtpError("")
      setResetToken("")
      setNewPassword("")
      setConfirmPassword("")
      setNewPasswordError("")
      setConfirmPasswordError("")
      setShowNewPassword(false)
      setShowConfirmPassword(false)
      setSubmitting(false)
      setResendAt(null)
      setOtpAttemptsExceeded(false)
      setResendSpam(false)
      setResending(false)
    }
  }, [open, defaultEmail])

  useEffect(() => {
    if (step === "otp") {
      // focus first otp box when entering OTP step
      setTimeout(() => {
        otpRefs.current[0]?.focus()
      }, 0)
    }
  }, [step])

  useEffect(() => {
    setOtp(otpDigits.join(""))
  }, [otpDigits])

  const isOtpReady = useMemo(() => {
    return /^\d{6}$/.test(otp)
  }, [otp])

  const resendLeftMs = useMemo(() => {
    if (!resendAt) return 0
    const left = Math.max(0, resendAt - now)
    return left
  }, [resendAt, now])

  useEffect(() => {
    if (!resendAt) return
    const id = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= resendAt) setResendAt(null)
    }, 500)
    return () => clearInterval(id)
  }, [resendAt])

  const validateEmail = () => {
    setEmailError("")
    if (!email) {
      setEmailError("Please enter your email")
      return false
    }
    const ok = /[^@\s]+@[^@\s]+\.[^@\s]+/.test(email)
    if (!ok) {
      setEmailError("Invalid email format")
      return false
    }
    return true
  }

  const validateOtp = () => {
    setOtpError("")
    if (!otp || otp.length !== 6) {
      setOtpError("OTP must be 6 digits")
      return false
    }
    if (!/^\d{6}$/.test(otp)) {
      setOtpError("OTP must be numeric")
      return false
    }
    return true
  }

  const focusOtpIndex = (idx: number) => {
    if (idx >= 0 && idx < OTP_LENGTH) {
      otpRefs.current[idx]?.focus()
      otpRefs.current[idx]?.select()
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(0, 1)
    const next = [...otpDigits]
    next[index] = digit
    setOtpDigits(next)
    setOtpError("")
    if (digit && index < OTP_LENGTH - 1) focusOtpIndex(index + 1)
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otpDigits[index]) {
        // clear current digit
        const next = [...otpDigits]
        next[index] = ""
        setOtpDigits(next)
      } else if (index > 0) {
        // move back and clear previous
        e.preventDefault()
        const prev = index - 1
        const next = [...otpDigits]
        next[prev] = ""
        setOtpDigits(next)
        focusOtpIndex(prev)
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      focusOtpIndex(Math.max(0, index - 1))
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      focusOtpIndex(Math.min(OTP_LENGTH - 1, index + 1))
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text").replace(/\D/g, "")
    if (!text) return
    const next = Array(OTP_LENGTH).fill("") as string[]
    for (let i = 0; i < Math.min(text.length, OTP_LENGTH); i++) {
      next[i] = text[i]
    }
    setOtpDigits(next)
    // focus last filled or last box
    const lastIdx = Math.min(text.length, OTP_LENGTH) - 1
    focusOtpIndex(Math.max(0, lastIdx))
  }

  const validateReset = () => {
    setNewPasswordError("")
    setConfirmPasswordError("")
    let valid = true
    if (!newPassword || newPassword.length < 8) {
      setNewPasswordError("New password must be at least 8 characters")
      valid = false
    }
    if (confirmPassword !== newPassword) {
      setConfirmPasswordError("Password confirmation does not match")
      valid = false
    }
    return valid
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateEmail()) return
    setSubmitting(true)
    try {
      await userService.passwordForgot(email)
      toast.success("OTP has been sent (check email)")
      setStep("otp")
      setResendAt(Date.now() + RESEND_COOLDOWN_MS)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send OTP")
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendLeftMs > 0) {
      setResendSpam(true)
      toast.info(
        `You're doing this too fast. Please wait ${Math.ceil(resendLeftMs / 1000)}s to resend OTP.`
      )
      return
    }
    if (!validateEmail()) return
    setSubmitting(true)
    setResending(true)
    try {
      await userService.passwordForgot(email)
      toast.success("Resent OTP")
      setResendAt(Date.now() + RESEND_COOLDOWN_MS)
      setOtpAttemptsExceeded(false)
      setResendSpam(false)
      setOtpDigits(Array(OTP_LENGTH).fill(""))
      setOtpError("")
      setTimeout(() => {
        otpRefs.current[0]?.focus()
      }, 0)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to resend OTP")
    } finally {
      setSubmitting(false)
      setResending(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateOtp()) return
    setSubmitting(true)
    try {
      const { resetToken } = await userService.passwordVerifyOtp(email, otp)
      setResetToken(resetToken)
      toast.success("OTP verified")
      setStep("reset")
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Wrong or expired OTP"
      toast.error(msg)
      if (
        typeof msg === "string" &&
        (msg.toLowerCase().includes("vượt quá số lần thử") ||
          msg.toLowerCase().includes("too many"))
      ) {
        setOtpAttemptsExceeded(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateReset()) return
    setSubmitting(true)
    try {
      await userService.passwordReset(resetToken, newPassword)
      toast.success("Password reset successfully")
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reset password")
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[#232526] rounded-xl p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-white" onClick={onClose}>
          ✕
        </button>
        <h2 className="text-xl font-bold text-white mb-4 text-center">Forgot Password</h2>

        {step === "email" && (
          <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-[#CFCFCF]">Email</label>
              <div className="relative">
                <input
                  type="email"
                  className={`w-full rounded-xl bg-[#2C2E31] border ${emailError ? "border-red-500" : "border-[#35363A]"} px-4 py-2 text-white pl-10`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {emailError && <div className="text-red-500 text-xs mt-1">{emailError}</div>}
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 transition text-white font-bold py-2.5 rounded-xl mt-2 shadow-lg shadow-violet-800/30 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              disabled={submitting}
            >
              <span>Send OTP</span>
              {submitting && <RefreshCcw className="w-4 h-4 animate-spin" />}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-[#CFCFCF]">Enter OTP</label>
              <div className="mb-3 rounded-lg bg-[#2C2E31] border border-[#35363A] px-3 py-2 text-xs text-[#CFCFCF]">
                {!otpAttemptsExceeded && !resendSpam && (
                  <>
                    <span>
                      OTP has been sent to <span className="font-semibold text-white">{email}</span>
                      . Please check your email.
                    </span>
                    <span className="ml-1">
                      {resendLeftMs > 0
                        ? `You can resend OTP in ${Math.ceil(resendLeftMs / 1000)}s.`
                        : "You can resend OTP now."}
                    </span>
                  </>
                )}
                {otpAttemptsExceeded && (
                  <>
                    <span className="text-yellow-400 font-medium">
                      Too many wrong OTP attempts.
                    </span>
                    <span className="ml-1">Please resend a new OTP to continue.</span>
                  </>
                )}
                {resendSpam && (
                  <>
                    <span className="text-yellow-400 font-medium">You're doing this too fast.</span>
                    <span className="ml-1">
                      Please wait {Math.ceil(resendLeftMs / 1000)}s to resend OTP.
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between gap-2" onPaste={handleOtpPaste}>
                {otpDigits.map((d, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpRefs.current[idx] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    className={`w-10 h-12 text-center rounded-lg bg-[#2C2E31] border ${otpError ? "border-red-500" : "border-[#35363A]"} text-white text-lg`}
                    value={d}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    maxLength={1}
                  />
                ))}
              </div>
              {otpError && <div className="text-red-500 text-xs mt-2">{otpError}</div>}
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleResendOtp}
                className={`inline-flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-lg bg-[#2C2E31] hover:bg-regular-hover-bgcl transition-colors ${resendLeftMs > 0 ? "opacity-60 cursor-not-allowed" : ""}`}
                disabled={resendLeftMs > 0 || submitting || resending}
              >
                <RefreshCcw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
                {resendLeftMs > 0 ? `Resend in ${Math.ceil(resendLeftMs / 1000)}s` : "Resend OTP"}
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 transition text-white font-bold py-2.5 rounded-xl shadow-lg shadow-violet-800/30 px-4 disabled:opacity-60"
                disabled={submitting || !isOtpReady || otpAttemptsExceeded}
              >
                Verify
              </button>
            </div>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-[#CFCFCF]">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className={`w-full rounded-xl bg-[#2C2E31] border ${newPasswordError ? "border-red-500" : "border-[#35363A]"} px-4 py-2 text-white pr-10`}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  onClick={() => setShowNewPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              {newPasswordError && (
                <div className="text-red-500 text-xs mt-1">{newPasswordError}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-[#CFCFCF]">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={`w-full rounded-xl bg-[#2C2E31] border ${confirmPasswordError ? "border-red-500" : "border-[#35363A]"} px-4 py-2 text-white pr-10`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              {confirmPasswordError && (
                <div className="text-red-500 text-xs mt-1">{confirmPasswordError}</div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 transition text-white font-bold py-2.5 rounded-xl mt-2 shadow-lg shadow-violet-800/30 disabled:opacity-60"
              disabled={submitting}
            >
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordModal
