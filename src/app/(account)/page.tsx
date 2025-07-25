"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CustomAvatar, toast } from "@/components/materials"
import { useUserProfile } from "@/hooks/user-profile"
import EditProfileModal from "./EditProfileModal"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { updateProfileThunk, fetchProfile } from "@/redux/user/profile.slice"
import { uploadFile } from "@/apis/upload"
import {
  ArrowLeft,
  Bell,
  Database,
  Lock,
  Settings,
  Folder,
  Smile,
  Monitor,
  Languages,
  User as UserIcon,
  Info,
  Phone,
  AtSign,
  Calendar,
  Pencil,
  MoreVertical,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/materials/dropdown-menu"
import { LogOut, Lock as LockIcon } from "lucide-react"
import { resetAuthStatus } from "@/redux/auth/auth.slice"
import { resetUser } from "@/redux/user/user.slice"
import ChangePasswordModal from "./ChangePasswordModal"
import { userService } from "@/services/user.service"

function toDateInputValue(dateString: string) {
  if (!dateString) return ""
  // Nếu là ISO string, cắt lấy phần yyyy-MM-dd
  return dateString.slice(0, 10)
}

const AccountPage = ({
  showBackButton = false,
  onBack,
}: {
  showBackButton?: boolean
  onBack?: () => void
}) => {
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)
  const userProfile = useUserProfile(refreshKey)
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
  const [showEditModal, setShowEditModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)

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

      // Cập nhật refreshKey để ép hook refetch dữ liệu mới
      setRefreshKey((prev) => prev + 1)

      setIsEditing(false)
      toast.success("Cập nhật thành công!")
    } catch (err) {
      console.log(err)
      toast.error("Cập nhật thất bại!")
    } finally {
      setLoading(false)
    }
  }

  // Hàm cập nhật profile (có thể dùng lại handleSave hoặc viết mới)
  const handleEditProfileSave = async ({
    avatar,
    fullname,
    birthday,
    about,
  }: {
    avatar: string | null
    fullname: string
    birthday: string
    about: string
  }) => {
    setLoading(true)
    try {
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

      // Cập nhật refreshKey để ép hook refetch dữ liệu mới
      setRefreshKey((prev) => prev + 1)

      // Đóng modal sau khi lưu thành công
      setShowEditModal(false)

      toast.success("Cập nhật thành công!")
    } catch (err) {
      console.log(err)
      toast.error("Cập nhật thất bại!")
    } finally {
      setLoading(false)
    }
  }

  // Handler cho logout
  const handleLogout = () => {
    // dispatch(resetAuthStatus())
    // dispatch(resetUser())
    // router.push("/")
  }

  if (!userProfile)
    return <div className="text-white flex items-center justify-center h-full">Loading...</div>

  return (
    <div className="w-full h-full bg-[#232526] flex flex-col">
      {/* Header */}
      <div
        className="relative flex items-center px-4 py-3 border-b border-[#35363A] bg-[#232526] z-10"
        style={{ position: "sticky", top: 0 }}
      >
        {/* Nút back bên trái */}
        {showBackButton && (
          <button
            onClick={onBack}
            className="p-1 rounded-full hover:bg-[#323338] transition z-10"
            style={{
              minWidth: 36,
              minHeight: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={22} color="#CFCFCF" />
          </button>
        )}
        {/* Tiêu đề absolute giữa */}
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-white pointer-events-none"
          style={{ whiteSpace: "nowrap" }}
        >
          Settings
        </span>
        {/* Icon bên phải */}
        <div className="ml-auto flex items-center gap-2 z-10">
          <button
            className="p-1 hover:bg-[#323338] rounded-full transition"
            onClick={() => setShowEditModal(true)}
          >
            <Pencil size={20} color="#CFCFCF" />
          </button>
          {/* More menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-[#323338] rounded-full transition">
                <MoreVertical size={20} color="#CFCFCF" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowChangePasswordModal(true)}>
                <LockIcon className="mr-2" size={18} /> Đổi mật khẩu
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2" size={18} /> Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Avatar + Info */}
      <div className="flex flex-col items-center py-6">
        <CustomAvatar
          src={userProfile.Profile.avatar || "/images/user/default-avatar-black.webp"}
          imgSize={90}
          className="ring-2 ring-[#3A3B3C] shadow-lg rounded-full"
        />
        <div
          className="mt-3 text-xl font-bold text-white truncate max-w-full"
          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {userProfile.Profile.fullName}
        </div>
        <div className="text-sm text-green-400">online</div>
        <div
          className="mt-2 text-sm text-[#CFCFCF] truncate max-w-full"
          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {userProfile.Profile.about}
        </div>
      </div>

      {/* Info list */}
      <div className="flex flex-col gap-1 px-6">
        <div className="flex items-start gap-3 py-2 text-white ">
          <AtSign size={18} className="mt-0.5 text-[#CFCFCF]" />
          <div className="min-w-0 flex-1">
            <div
              className="font-bold text-white truncate max-w-full"
              style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {userProfile.Profile.fullName || "Username"}
            </div>
            <div className="text-xs text-[#CFCFCF]">Username</div>
          </div>
        </div>
        <div className="flex items-start gap-3 py-2 text-white">
          <Calendar size={18} className="mt-0.5 text-[#CFCFCF]" />
          <div>
            <div className="font-bold text-white">
              {userProfile.Profile.birthday
                ? new Date(userProfile.Profile.birthday).toLocaleDateString("vi-VN")
                : "01/01/2000"}
            </div>
            <div className="text-xs text-[#CFCFCF]">Birthday</div>
          </div>
        </div>
        <div className="flex items-start gap-3 py-2 text-white">
          <Info size={18} className="mt-0.5 text-[#CFCFCF]" />
          <div className="min-w-0 flex-1">
            <div
              className="font-bold text-white truncate max-w-full"
              style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {userProfile.Profile.about || "About"}
            </div>
            <div className="text-xs text-[#CFCFCF]">Bio</div>
          </div>
        </div>
      </div>

      {/* Settings list */}
      <div className="flex flex-col gap-1 mt-6 border-t border-[#35363A] pt-4 px-2">
        {[
          { icon: <Bell size={18} />, label: "Notifications and Sounds" },
          { icon: <Database size={18} />, label: "Data and Storage" },
          { icon: <Lock size={18} />, label: "Privacy and Security" },
          { icon: <Settings size={18} />, label: "General Settings" },
          { icon: <Folder size={18} />, label: "Chat Folders" },
          { icon: <Smile size={18} />, label: "Stickers and Emoji" },
          { icon: <Monitor size={18} />, label: "Devices", right: "2" },
          { icon: <Languages size={18} />, label: "Language", right: "English" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[#323338] rounded-lg cursor-pointer transition"
          >
            {item.icon}
            <span className="flex-1 text-white">{item.label}</span>
            {item.right && <span className="text-[#CFCFCF] text-sm">{item.right}</span>}
          </div>
        ))}
      </div>

      {/* Modal crop avatar */}
      {showCropper && selectedImage && (
        <EditProfileModal
          open={showCropper}
          onClose={() => setShowCropper(false)}
          userProfile={userProfile}
          onSave={handleEditProfileSave}
        />
      )}

      {/* Modal chỉnh sửa */}
      <EditProfileModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        userProfile={userProfile}
        onSave={handleEditProfileSave}
      />

      <ChangePasswordModal
        open={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSave={async ({ oldPassword, newPassword }) => {
          try {
            await userService.changePassword(oldPassword, newPassword)
            toast.success("Đổi mật khẩu thành công!")
            setShowChangePasswordModal(false)
          } catch (err: any) {
            toast.error(err?.response?.data?.message || "Đổi mật khẩu thất bại!")
          }
        }}
      />
    </div>
  )
}

export default AccountPage
