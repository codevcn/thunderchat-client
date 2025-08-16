"use client"

import { useState } from "react"
import { CustomAvatar, Spinner, toast } from "@/components/materials"
import { useUserProfile } from "@/hooks/user-profile"
import EditProfileModal from "./EditProfileModal"
import { useAppDispatch } from "@/hooks/redux"
import { updateProfileThunk } from "@/redux/user/profile.slice"
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

export const AccountPage = ({
  showBackButton = false,
  onBack,
}: {
  showBackButton?: boolean
  onBack?: () => void
}) => {
  const { userProfile, loading: profileLoading, error, refetch } = useUserProfile()
  const dispatch = useAppDispatch()
  // State cho form
  const [showEditModal, setShowEditModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

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
      // Refetch profile data để cập nhật UI
      await refetch()
      // Close modal after successful save
      setShowEditModal(false)

      toast.success("Updated successfully!")
    } catch (err) {
      console.log(err)
      toast.error(axiosErrorHandler.handleHttpError(err).message)
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

  if (profileLoading)
    return (
      <div className="text-white flex items-center justify-center h-full">
        <Spinner size="medium" />
      </div>
    )

  if (error)
    return (
      <div className="text-white flex items-center justify-center h-full">
        Error: <span>{error}</span>
      </div>
    )

  if (!userProfile)
    return <div className="text-white flex items-center justify-center h-full">No profile data</div>

  return (
    <div className="w-full h-full bg-[#232526] flex flex-col overflow-y-auto STYLE-styled-scrollbar pb-4">
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
      <div className="flex flex-col items-center py-6 px-4">
        <CustomAvatar
          src={userProfile.Profile.avatar}
          imgSize={90}
          className="ring-2 ring-[#3A3B3C] shadow-lg rounded-full text-[30px] font-bold"
          fallback={userProfile.Profile.fullName[0]}
        />
        <div className="mt-3 text-xl font-bold text-white truncate max-w-full text-center">
          {userProfile.Profile.fullName}
        </div>
        <div className="mt-2 text-sm text-[#CFCFCF] break-words max-w-full text-center">
          {userProfile.Profile.about}
        </div>
      </div>

      {/* Info list */}
      <div className="flex flex-col gap-1 px-6">
        <div className="flex items-center gap-3 py-2 text-white ">
          <AtSign size={18} className="mt-0.5 text-[#CFCFCF]" />
          <div className="min-w-0 flex-1">
            <div className="font-bold text-white truncate max-w-full">{userProfile.email}</div>
            <div className="text-xs text-regular-placeholder-cl">Email</div>
          </div>
        </div>
        <div className="flex items-center gap-3 py-2 text-white">
          <Calendar size={18} className="mt-0.5 text-regular-placeholder-cl" />
          <div>
            <div className="font-bold text-white">
              {userProfile.Profile.birthday
                ? new Date(userProfile.Profile.birthday).toLocaleDateString("vi-VN")
                : "01/01/2000"}
            </div>
            <div className="text-xs text-regular-placeholder-cl">Birthday</div>
          </div>
        </div>
        <div className="flex items-center gap-3 py-2 text-white">
          <Info size={18} className="mt-0.5 text-regular-placeholder-cl" />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-white break-words max-w-full">
              {userProfile.Profile.about || (
                <span className="text-regular-placeholder-cl italic leading-snug">Nothing...</span>
              )}
            </div>
            <div className="text-xs text-regular-placeholder-cl">About</div>
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
