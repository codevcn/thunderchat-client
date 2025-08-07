"use client"

import { useState, useEffect } from "react"
import { CustomAvatar, Spinner, toast } from "@/components/materials"
import { useUserProfile } from "@/hooks/user-profile"
import EditProfileModal from "./EditProfileModal"
import { useAppDispatch } from "@/hooks/redux"
import { updateProfileThunk, fetchProfile } from "@/redux/user/profile.slice"
import { ArrowLeft, Info, AtSign, Calendar, Pencil } from "lucide-react"
import { LogOut, Lock as LockIcon } from "lucide-react"
import { resetAuthStatus } from "@/redux/auth/auth.slice"
import { resetUser } from "@/redux/user/user.slice"
import ChangePasswordModal from "./ChangePasswordModal"
import { userService } from "@/services/user.service"
import { authService } from "@/services/auth.service"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { pureNavigator } from "@/utils/helpers"
import { clientSocket } from "@/utils/socket/client-socket"

const AccountPage = ({
  showBackButton = false,
  onBack,
}: {
  showBackButton?: boolean
  onBack?: () => void
}) => {
  const [refreshKey, setRefreshKey] = useState(0)
  const userProfile = useUserProfile(refreshKey)
  const dispatch = useAppDispatch()
  // State cho form
  const [avatar, setAvatar] = useState<string | null>(null)
  const [fullname, setFullname] = useState("")
  const [birthday, setBirthday] = useState("")
  const [about, setAbout] = useState("")
  const [showCropper, setShowCropper] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  // Khi userProfile thay đổi, set lại state form
  useEffect(() => {
    if (userProfile) {
      setAvatar(userProfile.Profile.avatar || null)
      setFullname(userProfile.Profile.fullName || "")
      setBirthday(userProfile.Profile.birthday || "")
      setAbout(userProfile.Profile.about || "")
    }
  }, [userProfile])

  // Profile update function (can reuse handleSave or write new)
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

      // Update refreshKey to force hook refetch new data
      setRefreshKey((prev) => prev + 1)

      // Close modal after successful save
      setShowEditModal(false)

      toast.success("Updated successfully!")
    } catch (err) {
      console.log(err)
      toast.error(axiosErrorHandler.handleHttpError(err).message)
    } finally {
      setLoading(false)
    }
  }

  // Handler cho logout
  const handleLogout = async () => {
    setLogoutLoading(true)
    try {
      await authService.logoutUser(clientSocket.socket.id)
      dispatch(resetAuthStatus())
      dispatch(resetUser())
      pureNavigator("/")
    } catch (err) {
      toast.error(axiosErrorHandler.handleHttpError(err).message)
    } finally {
      setLogoutLoading(false)
    }
  }

  const handleChangePassword = () => {
    setShowChangePasswordModal(true)
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
        {/* Back button on the left */}
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
        {/* Absolute centered title */}
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-white pointer-events-none"
          style={{ whiteSpace: "nowrap" }}
        >
          Profile
        </span>
        {/* Icon on the right */}
        <div className="ml-auto flex items-center gap-2 z-10">
          <button
            className="p-1 hover:bg-[#323338] rounded-full transition"
            onClick={() => setShowEditModal(true)}
          >
            <Pencil size={20} color="#CFCFCF" />
          </button>
        </div>
      </div>

      {/* Avatar + Info */}
      <div className="flex flex-col items-center py-6">
        <CustomAvatar
          src={userProfile.Profile.avatar}
          imgSize={90}
          className="ring-2 ring-[#3A3B3C] shadow-lg rounded-full text-[30px] font-bold"
          fallback={userProfile.Profile.fullName[0]}
        />
        <div
          className="mt-3 text-xl font-bold text-white truncate max-w-full"
          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {userProfile.Profile.fullName}
        </div>
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
        <div className="flex flex-col gap-4 mt-5">
          <div className="flex justify-center">
            <button
              className="text-white flex justify-center items-center gap-2 text-sm w-full p-2 rounded-md bg-[#2C2E31] hover:bg-regular-hover-bgcl transition-colors duration-300"
              onClick={handleChangePassword}
            >
              <LockIcon size={18} />
              <span>Change password</span>
            </button>
          </div>
          <div
            className="flex justify-center"
            style={{ pointerEvents: logoutLoading ? "none" : "auto" }}
          >
            <button
              className="flex justify-center items-center text-red-600 gap-2 text-sm w-full p-2 rounded-md bg-[#2C2E31] hover:bg-[#ff000034] transition-colors duration-300"
              onClick={handleLogout}
            >
              {logoutLoading ? (
                <span className="m-auto block">
                  <Spinner size="small" />
                </span>
              ) : (
                <>
                  <LogOut size={18} />
                  <span>Log out</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Avatar crop modal */}
      {showCropper && selectedImage && (
        <EditProfileModal
          open={showCropper}
          onClose={() => setShowCropper(false)}
          userProfile={userProfile}
          onSave={handleEditProfileSave}
        />
      )}

      {/* Edit modal */}
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
            toast.success("Password changed successfully!")
            setShowChangePasswordModal(false)
          } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to change password!")
          }
        }}
      />
    </div>
  )
}

export default AccountPage
