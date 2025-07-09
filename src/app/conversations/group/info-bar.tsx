import { ArrowLeft, Camera, Check, Pencil, Plus, RefreshCw, Trash2, Users, X } from "lucide-react"
import { openInfoBar, updateSingleConversation } from "@/redux/conversations/conversations.slice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { IconButton } from "@/components/materials/icon-button"
import { ProgressiveImage } from "@/components/materials/progressive-image"
import { robotoFont } from "@/utils/fonts"
import { CustomAvatar } from "@/components/materials/avatar"
import type {
  TGroupChatData,
  TGroupChatMemberWithUser,
  TUpdateGroupChatParams,
} from "@/utils/types/be-api"
import { useEffect, useRef, useState } from "react"
import { CustomTooltip, Spinner, TextField } from "@/components/materials"
import { toaster } from "@/utils/toaster"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { groupChatService } from "@/services/group-chat.service"
import { updateGroupChat } from "@/redux/messages/messages.slice"
import { convertGrChatMemRole } from "@/utils/data-convertors/static-data-convertor"
import { EGroupChatRole } from "@/utils/enums"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { ManageMembers } from "./manage-members"

type TMembersProps = {
  members: TGroupChatMemberWithUser[]
}

export const MembersList = ({ members }: TMembersProps) => {
  return (
    <div className="w-full h-full pb-4 pt-6 pl-2 pr-0">
      <h2 className="text-base font-bold pl-2">
        <span>Members</span>
        <span className="text-zinc-400 pl-2">({members.length})</span>
      </h2>

      <div className="w-full">
        {members && members.length > 0 && (
          <div className="flex flex-wrap mt-2 pr-1">
            {members.map(
              ({
                User: {
                  Profile: { fullName, avatar },
                },
                role,
                id,
              }) => (
                <div
                  key={id}
                  className="flex items-center gap-2 hover:bg-regular-hover-card-cl w-full cursor-pointer rounded-md p-2 relative"
                >
                  <CustomAvatar
                    imgSize={48}
                    src={avatar}
                    alt="User Avatar"
                    fallback={fullName[0]}
                    className="text-lg font-bold bg-regular-violet-cl"
                  />

                  <div className="min-w-0 space-y-1">
                    <h3 title={fullName} className="font-medium text-base text-white truncate">
                      {fullName}
                    </h3>
                    <p className="text-[13px] text-gray-400">Last seen Jan 20, 2025 at 16:23</p>
                  </div>

                  <div className="absolute top-1 right-2 text-xs text-regular-text-secondary-cl">
                    {role === EGroupChatRole.ADMIN && convertGrChatMemRole(role)}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}

type TAvatarProps = {
  groupChat: TGroupChatData
  membersCount: number
}

const Avatar = ({ groupChat, membersCount }: TAvatarProps) => {
  const { name, avatarUrl } = groupChat

  return (
    <div className="aspect-square w-full bg-purple-200 relative">
      <div className="w-full h-full cursor-default">
        {avatarUrl ? (
          <ProgressiveImage
            src={avatarUrl}
            className="w-full h-full"
            prgssClassName="w-full h-full bg-regular-black-cl"
          />
        ) : (
          <div
            className={`${robotoFont.variable} w-full h-full flex justify-center font-roboto items-center overflow-hidden text-user-avt-fsize bg-user-avt-bgimg`}
          >
            {name[0]}
          </div>
        )}
      </div>

      <div className="flex justify-end flex-col absolute bottom-0 left-0 bg-modal-text-bgimg min-h-[100px] w-full px-6 pb-2">
        <p className="text-xl font-bold">{name || "Unnamed"}</p>
        <span className="text-sm opacity-60">
          {membersCount > 1 ? `${membersCount} members` : "1 member"}
        </span>
      </div>
    </div>
  )
}

type TLoading = "upload-avatar" | "delete-avatar" | "save-updates"

type TUpdateFields = "avatar" | "name"

type TEditGroupProps = {
  open: boolean
  onClose: () => void
  groupChat: TGroupChatData
  members: TGroupChatMemberWithUser[]
}

const EditGroup = ({ open, onClose, groupChat, members }: TEditGroupProps) => {
  const { name, avatarUrl } = groupChat
  const [loading, setLoading] = useState<TLoading>()
  const [avatar, setAvatar] = useState<string | undefined>(avatarUrl)
  const [updateFields, setUpdateFields] = useState<TUpdateFields[]>([])
  const dispatch = useAppDispatch()
  const formRef = useRef<HTMLFormElement>(null)

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

  const handleOpenManageMembers = () => {
    eventEmitter.emit(EInternalEvents.OPEN_MANAGE_MEMBERS, groupChat.id)
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
      className={`${open ? "left-0" : "left-full"} bg-black top-0 z-[70] absolute h-full w-full transition-[left] duration-[0.4s] screen-large-chatting:duration-300 ease-slide-info-bar-timing`}
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

      <div className="w-full mt-2 bg-regular-info-bar-bgcl px-4 py-4 text-base">
        {/* Group Info */}
        <div className="space-y-6">
          {/* Members */}
          <button
            onClick={handleOpenManageMembers}
            className="flex items-center space-x-4 hover:bg-regular-hover-card-cl rounded-md p-2 w-full text-left"
          >
            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-zinc-400" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-medium">Members</h3>
              <p className="text-zinc-400">{members.length}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Delete and Leave Group */}
      <div className="w-full mt-2 bg-regular-info-bar-bgcl px-4 py-4 text-base">
        <button className="flex items-center w-full justify-start text-red-500 rounded-md hover:bg-red-500/10 hover:text-red-400 p-4 h-auto">
          <Trash2 className="h-5 w-5 mr-4" />
          <span>Delete and Leave Group</span>
        </button>
      </div>

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

export const InfoBar = () => {
  const { infoBarIsOpened } = useAppSelector(({ conversations }) => conversations)
  const { groupChat, groupChatMembers } = useAppSelector(({ messages }) => messages)
  const dispatch = useAppDispatch()
  const [editGroupOpen, setEditGroupOpen] = useState(false)

  const handleOpenInfoBar = (open: boolean) => {
    dispatch(openInfoBar(open))
  }

  return (
    <div
      className={`${infoBarIsOpened ? "right-0" : "-right-slide-info-mb-bar screen-large-chatting:-right-slide-info-bar"} top-0 bg-regular-info-bar-bgcl screen-large-chatting:bg-regular-dark-gray-cl w-info-bar-mb screen-large-chatting:w-info-bar h-full overflow-hidden border-l-regular-hover-card-cl border-l z-[60] transition-[right] absolute duration-[0.4s] screen-large-chatting:duration-300 ease-slide-info-bar-timing`}
    >
      <div className="flex flex-col w-full h-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center h-header py-[7px] px-3">
            <IconButton
              className="flex justify-center items-center h-10 w-10 text-regular-icon-cl"
              onClick={() => handleOpenInfoBar(false)}
            >
              <X size={24} />
            </IconButton>
            <h2 className="text-lg pl-2">User Info</h2>
          </div>

          <div className="pr-4">
            <IconButton
              className="flex justify-center items-center h-10 w-10 text-regular-icon-cl"
              onClick={() => setEditGroupOpen(true)}
            >
              <Pencil size={20} />
            </IconButton>
          </div>
        </div>

        {groupChat && groupChatMembers && (
          <div className="grow w-full">
            <div className="overflow-y-auto STYLE-styled-scrollbar h-full w-full bg-regular-info-bar-bgcl">
              <Avatar groupChat={groupChat} membersCount={groupChatMembers.length} />
              <MembersList members={groupChatMembers} />
            </div>
          </div>
        )}
      </div>

      {groupChat && groupChatMembers && groupChatMembers.length > 0 && (
        <>
          <EditGroup
            open={editGroupOpen}
            onClose={() => setEditGroupOpen(false)}
            groupChat={groupChat}
            members={groupChatMembers}
          />
          <ManageMembers />
        </>
      )}
    </div>
  )
}
