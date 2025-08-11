import { ArrowLeft, Camera, Check, Plus, RefreshCw } from "lucide-react"
import { updateSingleConversation } from "@/redux/conversations/conversations.slice"
import { useAppDispatch } from "@/hooks/redux"
import { IconButton } from "@/components/materials/icon-button"
import { CustomAvatar } from "@/components/materials/avatar"
import type {
  TGroupChatData,
  TGroupChatMemberWithUser,
  TUpdateGroupChatParams,
  TUser,
} from "@/utils/types/be-api"
import { useEffect, useRef, useState } from "react"
import { CustomTooltip, Spinner, TextField } from "@/components/materials"
import { toaster } from "@/utils/toaster"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { groupChatService } from "@/services/group-chat.service"
import { updateGroupChat } from "@/redux/messages/messages.slice"
import { GroupActions } from "./group-actions"
import { checkIfGroupChatCreator } from "@/utils/helpers"

type TLoading = "upload-avatar" | "delete-avatar" | "save-updates"

type TUpdateFields = "avatar" | "name"

type TEditGroupProps = {
  open: boolean
  onClose: () => void
  groupChat: TGroupChatData
  members: TGroupChatMemberWithUser[]
  user: TUser
}

export const EditGroup = ({ open, onClose, groupChat, members, user }: TEditGroupProps) => {
  const { name, avatarUrl } = groupChat
  const [loading, setLoading] = useState<TLoading>()
  const [avatar, setAvatar] = useState<string | undefined>(avatarUrl)
  const [updateFields, setUpdateFields] = useState<TUpdateFields[]>([])
  const dispatch = useAppDispatch()
  const formRef = useRef<HTMLFormElement>(null)

  const isGroupChatCreator = checkIfGroupChatCreator(user.id, groupChat)

  const handlePickGroupPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return
    if (avatar) {
      try {
        await handleDeleteAvatar()
      } catch (error) {
        toaster.error("Failed to delete the previous avatar")
        return
      }
    }
    setLoading("upload-avatar")
    try {
      const res = await groupChatService.uploadGroupAvatar(file)
      setAvatar(res.avatarUrl)
      setUpdateFields((prev) => [...prev, "avatar"])
    } catch (err) {
      toaster.error(axiosErrorHandler.handleHttpError(err).message)
    } finally {
      setLoading(undefined)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!avatar || loading === "delete-avatar") return
    setLoading("delete-avatar")
    try {
      await groupChatService.deleteGroupAvatar(avatar)
      setAvatar(undefined)
      dispatch(updateGroupChat({ avatarUrl: undefined }))
    } catch (err) {
      toaster.error(axiosErrorHandler.handleHttpError(err).message)
    } finally {
      setLoading(undefined)
    }
  }

  const handleUpdateGroupChatUIData = (updates: Partial<TUpdateGroupChatParams>) => {
    const { avatarUrl, groupName } = updates
    dispatch(
      updateGroupChat({
        avatarUrl,
        name: groupName,
      })
    )
    dispatch(
      updateSingleConversation({
        id: groupChat.id,
        "avatar.src": avatarUrl,
        title: groupName,
      })
    )
  }

  const handleSaveUpdates = async () => {
    if (updateFields.length > 0) {
      setLoading("save-updates")
      const formData = formRef.current ? new FormData(formRef.current) : null
      if (!formData) return
      const groupName = (formData.get("group-name") as string | undefined) || undefined
      try {
        await groupChatService.updateGroupChat(groupChat.id, {
          groupName,
          avatarUrl: avatar,
        })
        handleUpdateGroupChatUIData({ avatarUrl: avatar, groupName })
      } catch (err) {
        toaster.error(axiosErrorHandler.handleHttpError(err).message)
      } finally {
        setLoading(undefined)
      }
    }
  }

  const handleChangeGroupName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const value = input.value
    if (value && value.length > 0 && value !== name) {
      setUpdateFields((prev) => [...prev, "name"])
    } else {
      setUpdateFields((prev) => prev.filter((update) => update !== "name"))
    }
  }

  useEffect(() => {
    const form = formRef.current
    const handleSubmit = (e: Event) => {
      e.preventDefault()
    }
    if (form) {
      form.addEventListener("submit", handleSubmit)
    }
    return () => {
      if (form) {
        form.removeEventListener("submit", handleSubmit)
      }
    }
  }, [])

  return (
    <div
      className={`${open ? "left-0" : "left-full"} flex flex-col bg-black top-0 z-[70] absolute h-full w-full transition-[left] duration-[0.4s] screen-large-chatting:duration-300 ease-slide-info-bar-timing`}
    >
      <div className="flex items-center px-4 py-2 bg-regular-info-bar-bgcl">
        <IconButton
          className="flex justify-center items-center h-10 w-10 text-regular-icon-cl"
          onClick={onClose}
        >
          <ArrowLeft size={24} />
        </IconButton>
        <h1 className="text-lg pl-2">Edit</h1>
      </div>

      <div className="grow overflow-y-auto STYLE-styled-scrollbar">
        {/* Group Avatar */}
        <div className="flex justify-center bg-regular-info-bar-bgcl px-6 pt-2">
          <CustomTooltip title="Upload group photo" placement="left" align="center" arrow>
            <div className="group w-[100px] h-[100px] bg-regular-violet-cl rounded-full flex items-center justify-center cursor-pointer">
              <input
                type="file"
                id="update-group-avatar-input"
                hidden
                onChange={handlePickGroupPhoto}
                accept="image/*"
              />
              {loading === "upload-avatar" ? (
                <div className="w-full h-full bg-regular-violet-cl rounded-full flex items-center justify-center">
                  <Spinner size="medium" />
                </div>
              ) : avatar ? (
                <div className="w-full h-full bg-regular-violet-cl rounded-full relative transition-colors duration-200">
                  <CustomAvatar
                    src={avatar}
                    fallback={name[0]}
                    alt="Group Avatar"
                    className="w-full h-full object-cover rounded-full text-5xl"
                  />
                  <label
                    htmlFor="update-group-avatar-input"
                    className="hidden items-center justify-center rounded-full group-hover:flex group-hover:bg-white/20 absolute top-0 left-0 h-full w-full cursor-pointer"
                  >
                    <Camera className="w-12 h-12 text-white" />
                    <span className="absolute left-[55%] top-[55%] bg-white rounded-full">
                      <RefreshCw className="w-4 h-4 text-regular-violet-cl" />
                    </span>
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="update-group-avatar-input"
                  className="flex items-center justify-center group-hover:scale-110 transition-transform duration-200 relative h-full w-full cursor-pointer"
                >
                  <Camera className="w-12 h-12 text-white" />
                  <span className="absolute left-[55%] top-[55%] bg-white rounded-full">
                    <Plus className="w-5 h-5 text-regular-violet-cl" />
                  </span>
                </label>
              )}
            </div>
          </CustomTooltip>
        </div>

        {/* Group Name */}
        <form ref={formRef} className="space-y-2 bg-regular-info-bar-bgcl px-6 py-6">
          <label className="text-sm text-zinc-400">Group Name</label>
          <TextField
            placeholder="Group Name..."
            defaultValue={name}
            onChange={handleChangeGroupName}
            name="group-name"
          />
        </form>

        {isGroupChatCreator && <GroupActions groupChat={groupChat} members={members} />}
      </div>
      {/* Save Updates */}
      <div
        className={`${updateFields.length > 0 ? "bottom-8" : "-bottom-14"} right-8 absolute z-[90] transition-[right,bottom] duration-200`}
      >
        {loading === "save-updates" ? (
          <div className="flex justify-center items-center w-[50px] h-[50px] rounded-full bg-regular-violet-cl">
            <Spinner size="medium" />
          </div>
        ) : (
          <button
            onClick={handleSaveUpdates}
            className="flex justify-center items-center w-[50px] h-[50px] rounded-full bg-regular-violet-cl hover:scale-110 transition duration-200"
          >
            <Check className="text-white" size={24} />
          </button>
        )}
      </div>
    </div>
  )
}
