import { useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"

interface ChangePasswordModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: { oldPassword: string; newPassword: string }) => void
}

const ChangePasswordModal = ({ open, onClose, onSave }: ChangePasswordModalProps) => {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [oldPasswordError, setOldPasswordError] = useState("")
  const [newPasswordError, setNewPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (open) {
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setOldPasswordError("")
      setNewPasswordError("")
      setConfirmPasswordError("")
      setSubmitting(false)
      setShowOldPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    }
  }, [open])

  const validate = () => {
    let valid = true
    setOldPasswordError("")
    setNewPasswordError("")
    setConfirmPasswordError("")

    if (!oldPassword) {
      setOldPasswordError("Vui lòng nhập mật khẩu cũ")
      valid = false
    }
    if (!newPassword || newPassword.length < 8) {
      setNewPasswordError("Mật khẩu mới phải từ 8 ký tự trở lên")
      valid = false
    }
    if (confirmPassword !== newPassword) {
      setConfirmPasswordError("Xác nhận mật khẩu không khớp")
      valid = false
    }
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    onSave({ oldPassword, newPassword })
    setSubmitting(false)
    onClose()
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[#232526] rounded-xl p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-white" onClick={onClose}>
          ✕
        </button>
        <h2 className="text-xl font-bold text-white mb-4">Đổi mật khẩu</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-[#CFCFCF]">Mật khẩu cũ</label>
            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                className={`w-full rounded-xl bg-[#2C2E31] border ${oldPasswordError ? "border-red-500" : "border-[#35363A]"} px-4 py-2 text-white pr-10`}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                onClick={() => setShowOldPassword((v) => !v)}
                tabIndex={-1}
              >
                {showOldPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
            {oldPasswordError && (
              <div className="text-red-500 text-xs mt-1">{oldPasswordError}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-[#CFCFCF]">Mật khẩu mới</label>
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
              Xác nhận mật khẩu mới
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
            Đổi mật khẩu
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChangePasswordModal
