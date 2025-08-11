import { Pencil, X } from "lucide-react"
import { openInfoBar } from "@/redux/conversations/conversations.slice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { IconButton } from "@/components/materials/icon-button"
import { ProgressiveImage } from "@/components/materials/progressive-image"
import { robotoFont } from "@/utils/fonts"
import { CustomAvatar } from "@/components/materials/avatar"
import type { TGroupChatData, TGroupChatMemberWithUser } from "@/utils/types/be-api"
import { useState } from "react"
import { convertGrChatMemRole } from "@/utils/data-convertors/static-data-convertor"
import { EGroupChatPermissions, EGroupChatRole } from "@/utils/enums"
import { ManageMembers } from "./manage-members"
import { useUser } from "@/hooks/user"
import { checkGroupChatPermission } from "@/utils/helpers"
import { PreviewInfo } from "./preview-info"
import { EditGroup } from "./edit-group"

type TMembersProps = {
  members: TGroupChatMemberWithUser[]
}

export const MembersList = ({ members }: TMembersProps) => {
  return (
    <div className="w-full h-full pb-4 pt-6 pl-2 pr-0 relative overflow-hidden">
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
                  email,
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
                    <p className="text-[13px] text-gray-400">{email}</p>
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

export const InfoBar = () => {
  const { infoBarIsOpened } = useAppSelector(({ conversations }) => conversations)
  const { groupChat } = useAppSelector(({ messages }) => messages)
  const dispatch = useAppDispatch()
  const [editGroupOpen, setEditGroupOpen] = useState(false)
  const groupChatMembers = groupChat?.Members
  const user = useUser()!
  const { groupChatPermissions } = useAppSelector(({ messages }) => messages)
  console.log(">>> 118:", groupChatPermissions)

  const editGroupPermission = checkGroupChatPermission(
    groupChatPermissions,
    user,
    groupChatMembers || [],
    EGroupChatPermissions.UPDATE_INFO
  )

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
            <h2 className="text-lg pl-2">Group Info</h2>
          </div>

          {editGroupPermission.hasPermission && (
            <div className="pr-4">
              <IconButton
                className="flex justify-center items-center h-10 w-10 text-regular-icon-cl"
                onClick={() => setEditGroupOpen(true)}
              >
                <Pencil size={20} />
              </IconButton>
            </div>
          )}
        </div>

        {groupChat && groupChatMembers && (
          <div className="grow w-full">
            <div className="overflow-y-auto STYLE-styled-scrollbar h-full w-full bg-regular-info-bar-bgcl">
              <Avatar groupChat={groupChat} membersCount={groupChatMembers.length} />
              <PreviewInfo groupChat={groupChat} />
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
            user={user}
          />
          <ManageMembers />
        </>
      )}
    </div>
  )
}
