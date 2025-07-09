"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CustomAvatar, toast } from "@/components/materials"
import { useUserProfile } from "@/hooks/user-profile"
import AvatarCropperModal from "@/components/materials/AvatarCropperModal"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { updateProfileThunk, fetchProfile } from "@/redux/user/profile.slice"
import { uploadFile } from "@/apis/upload"

function toDateInputValue(dateString: string) {
  if (!dateString) return ""
  // Nếu là ISO string, cắt lấy phần yyyy-MM-dd
  return dateString.slice(0, 10)
}

const AccountPage = () => {
  const router = useRouter()
  const userProfile = useUserProfile()
  const dispatch = useAppDispatch()
  // State cho form
  const [avatar, setAvatar] = useState<string | null>(null)
  const [fullname, setFullname] = useState("")
  const [birthday, setBirthday] = useState("")
  const [about, setAbout] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [fullnameError, setFullnameError] = useState("")
  const [birthdayError, setBirthdayError] = useState("")

  // Khi userProfile thay đổi, set lại state form
  useEffect(() => {
    if (userProfile) {
      setAvatar(userProfile.Profile.avatar || null)
      setFullname(userProfile.Profile.fullName || "")
      setBirthday(userProfile.Profile.birthday || "")
      setAbout(userProfile.Profile.about || "")
    }
  }, [userProfile])

  // Xử lý chọn avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setSelectedImage(ev.target?.result as string)
        setShowCropper(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropConfirm = async (croppedDataUrl: string) => {
    setUploadingAvatar(true)
    try {
      // Convert data URL to File object
      const response = await fetch(croppedDataUrl)
      const blob = await response.blob()

      // Create file with proper name and type
      const file = new File([blob], `avatar-${Date.now()}.png`, {
        type: "image/png",
      })

      // Check file size (limit to 5MB for avatar)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ảnh avatar không được vượt quá 5MB!")
        return
      }

      // Upload to AWS S3
      const { url, fileName, fileType } = await uploadFile(file)

      // Set avatar URL from AWS
      setAvatar(url)
      setShowCropper(false)
      setSelectedImage(null)

      toast.success("Cập nhật avatar thành công!")
    } catch (error) {
      console.error("Upload avatar error:", error)
      toast.error("Lỗi khi upload avatar!")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    setSelectedImage(null)
  }

  const validate = () => {
    let valid = true
    setFullnameError("")
    setBirthdayError("")
    if (!fullname.trim()) {
      setFullnameError("Họ và tên không được để trống")
      valid = false
    }
    if (birthday) {
      const birthDate = new Date(birthday)
      const now = new Date()
      const age =
        now.getFullYear() -
        birthDate.getFullYear() -
        (now < new Date(birthDate.setFullYear(now.getFullYear())) ? 1 : 0)
      if (age < 18) {
        setBirthdayError("Bạn phải trên 18 tuổi")
        valid = false
      }
    } else {
      setBirthdayError("Vui lòng chọn ngày sinh")
      valid = false
    }
    return valid
  }

  // Handler lưu dữ liệu
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      // Chỉ gửi avatar URL nếu nó là URL từ AWS (không phải data URL)
      const avatarToSend = avatar && avatar.startsWith("http") ? avatar : undefined

      await dispatch(
        updateProfileThunk({
          fullName: fullname,
          birthday: birthday ? birthday : undefined,
          about,
          avatar: avatarToSend,
        })
      ).unwrap()
      await dispatch(fetchProfile())
      setIsEditing(false)
      toast.success("Cập nhật thành công!")
    } catch (err) {
      console.log(err)
      toast.error("Cập nhật thất bại!")
    } finally {
      setLoading(false)
    }
  }

  if (!userProfile)
    return <div className="text-white flex items-center justify-center h-screen">Loading...</div>

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#232526] to-[#18191A]">
      {/* Nút quay về trang chủ */}
      <button
        type="button"
        onClick={() => router.push("/")}
        className="fixed top-8 left-8 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-[#202124]/90 hover:bg-[#2d2d2f] text-white font-semibold shadow-md transition"
      >
        {/* Icon mũi tên trái */}
        <svg
          className="w-5 h-5 mr-1"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Quay về trang chủ
      </button>
      <div className="relative bg-[#232526] rounded-2xl shadow-2xl w-full max-w-md px-8 pt-16 pb-10 flex flex-col items-center">
        {/* Nút bút chỉnh sửa */}
        <button
          type="button"
          className="absolute right-6 top-6 z-10 p-2 rounded-full bg-[#26272a] hover:bg-[#323338] transition shadow"
          onClick={() => setIsEditing((v) => !v)}
          title={isEditing ? "Đang chỉnh sửa" : "Chỉnh sửa"}
        >
          {/* SVG icon bút */}
          <svg
            className={`w-5 h-5 ${isEditing ? "text-violet-400" : "text-white"} transition`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.535 3.535L7.5 21H3v-4.5L16.732 3.732z"
            />
          </svg>
        </button>
        {/* Avatar + upload */}
        <div
          className={`absolute -top-16 left-1/2 -translate-x-1/2 group cursor-pointer z-10 ${!isEditing ? "pointer-events-none opacity-70" : ""}`}
          onClick={() => {
            if (!isEditing) return
            if (selectedImage) {
              setShowCropper(true) // Mở lại cropper với ảnh cũ
            } else {
              fileInputRef.current?.click() // Nếu chưa có ảnh thì chọn file mới
            }
          }}
        >
          <div className="relative transition-transform group-hover:scale-105 group-active:scale-95">
            <div className="relative">
              <CustomAvatar
                src={avatar || "/images/user/default-avatar-black.webp"}
                imgSize={128}
                className="ring-4 ring-[#3A3B3C] shadow-lg rounded-full"
              />
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
                </div>
              )}
            </div>
            {/* Overlay icon camera */}
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 17a5 5 0 100-10 5 5 0 000 10zm8-7h-2.586l-1.707-1.707A1 1 0 0015.586 8H8.414a1 1 0 00-.707.293L6 10H4a1 1 0 000 2h16a1 1 0 100-2z"
                  />
                </svg>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              disabled={!isEditing}
            />
          </div>
        </div>
        {/* Title */}
        <h2 className="mt-2 mb-6 text-2xl font-bold text-center tracking-tight text-white">
          Cập nhật thông tin cá nhân
        </h2>
        {/* Form fields */}
        <form className="flex flex-col gap-5 w-full" onSubmit={handleSave}>
          <div>
            <label className="block text-sm font-semibold mb-1 text-[#CFCFCF] flex items-center gap-2">
              {/* User icon */}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z"
                />
              </svg>
              Họ và tên
            </label>
            <input
              type="text"
              className="w-full rounded-xl bg-[#2C2E31] border border-[#35363A] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium placeholder:text-gray-400 transition"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              placeholder="Họ và tên"
              autoComplete="off"
              readOnly={!isEditing}
            />
            {fullnameError && <div className="text-red-500 text-xs mt-1">{fullnameError}</div>}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-[#CFCFCF] flex items-center gap-2">
              {/* Birthday icon */}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="4" width="18" height="18" rx="4" stroke="currentColor" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              Ngày sinh
            </label>
            <input
              type="date"
              className="w-full rounded-xl bg-[#2C2E31] border border-[#35363A] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium placeholder:text-gray-400 transition"
              value={toDateInputValue(birthday)}
              onChange={(e) => setBirthday(e.target.value)}
              required
              readOnly={!isEditing}
              disabled={!isEditing}
            />
            {birthdayError && <div className="text-red-500 text-xs mt-1">{birthdayError}</div>}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-[#CFCFCF] flex items-center gap-2">
              {/* Info icon */}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
              </svg>
              Giới thiệu bản thân{" "}
              <span className="text-xs text-gray-400 font-normal">(không bắt buộc)</span>
            </label>
            <textarea
              className="w-full rounded-xl bg-[#2C2E31] border border-[#35363A] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium placeholder:text-gray-400 transition resize-none min-h-[60px]"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Bạn muốn mọi người biết gì về mình?"
              maxLength={200}
              readOnly={!isEditing}
            />
          </div>
          {/* Nút lưu chỉ hiện khi đang edit */}
          {isEditing && (
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 transition text-white font-bold py-2.5 rounded-xl mt-2 shadow-lg shadow-violet-800/30"
              disabled={loading}
            >
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          )}
        </form>
        {/* Render AvatarCropperModal */}
        <AvatarCropperModal
          open={showCropper}
          image={selectedImage}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
          uploading={uploadingAvatar}
        />
      </div>
    </div>
  )
}

export default AccountPage
