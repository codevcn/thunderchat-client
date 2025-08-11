import {
  CheckCheck,
  Copy,
  Link2,
  RefreshCcw,
  Share2,
  Trash2,
  SquareChartGantt,
  Users,
  ArrowLeft,
  Check,
  UserCheck,
} from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import type {
  TGroupChat,
  TGroupChatData,
  TGroupChatMemberWithUser,
  TGroupChatPermissionState,
} from "@/utils/types/be-api"
import { useEffect, useState } from "react"
import { Checkbox, CustomDialog, IconButton, Skeleton, Spinner } from "@/components/materials"
import { toaster } from "@/utils/toaster"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { groupChatService } from "@/services/group-chat.service"
import { updateGroupChat } from "@/redux/messages/messages.slice"
import { generateInviteUrl } from "@/utils/helpers"
import { QRCodeCanvas } from "qrcode.react"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { EGroupChatPermissions } from "@/utils/enums"
import { ApproveMembersBoard } from "./member/approve-members"

type TInviteQRCodeProps = {
  inviteUrl: string
}

function InviteQRCode({ inviteUrl }: TInviteQRCodeProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 w-full text-center">Scan QR to join group</h3>
      <QRCodeCanvas
        value={inviteUrl}
        size={200}
        bgColor="#ffffff"
        fgColor="#000000"
        level="H"
        marginSize={2}
      />
    </div>
  )
}

type TJoinGroupLinkDialogProps = {
  open: boolean
  onOpen: (open: boolean) => void
  groupChat: TGroupChat
}

const JoinGroupLinkDialog = ({ open, onOpen, groupChat }: TJoinGroupLinkDialogProps) => {
  const { inviteCode } = groupChat
  const [isCreatingInviteLink, setIsCreatingInviteLink] = useState<boolean>(false)
  const [isChangingInviteLink, setIsChangingInviteLink] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const dispatch = useAppDispatch()

  const inviteUrl = inviteCode ? generateInviteUrl(inviteCode) : undefined

  const handleCreateInviteLink = async () => {
    setIsCreatingInviteLink(true)
    try {
      const res = await groupChatService.createInviteLink(groupChat.id)
      dispatch(updateGroupChat({ inviteCode: res.inviteCode }))
    } catch (error) {
      toaster.error(axiosErrorHandler.handleHttpError(error).message)
    } finally {
      setIsCreatingInviteLink(false)
    }
  }

  const handleCopyInviteUrl = (inviteUrl: string) => {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const handleChangeInviteLink = async () => {
    setIsChangingInviteLink(true)
    try {
      const res = await groupChatService.createInviteLink(groupChat.id)
      dispatch(updateGroupChat({ inviteCode: res.inviteCode }))
    } catch (error) {
      toaster.error(axiosErrorHandler.handleHttpError(error).message)
    } finally {
      setIsChangingInviteLink(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onHideShow={onOpen}
      dialogHeader={{ title: "Join Group Link" }}
      dialogBody={
        <div className="min-w-[500px] my-4 relative">
          <div
            hidden={!isCreatingInviteLink}
            className="flex justify-center items-center absolute top-0 left-0 w-full h-full"
          >
            <Spinner size="medium" />
          </div>
          {inviteUrl ? (
            <div className="flex flex-col items-center gap-3 px-4">
              <InviteQRCode inviteUrl={inviteUrl} />
              <p className="text-white text-base break-words">
                Anyone with this link can join the group. Only share with people you trust.
              </p>
              <div className="flex items-center gap-3">
                <span className="text-base font-medium text-regular-violet-cl max-w-[500px] rounded-md bg-violet-400/10 py-2 px-4 truncate">
                  {inviteUrl}
                </span>
              </div>
              <div className="flex justify-center gap-12">
                <button
                  onClick={() => handleCopyInviteUrl(inviteUrl)}
                  className="flex flex-col items-center text-regular-violet-cl hover:bg-violet-600/10 rounded-md p-2"
                >
                  {copied ? <CheckCheck size={26} /> : <Copy size={26} />}
                  <p className="text-sm mt-2 font-medium">Copy invite link</p>
                </button>
                <button
                  onClick={handleChangeInviteLink}
                  className="flex flex-col items-center text-regular-violet-cl hover:bg-violet-600/10 rounded-md p-2"
                >
                  {isChangingInviteLink ? (
                    <Spinner size="medium" className="m-auto" />
                  ) : (
                    <>
                      <RefreshCcw size={26} />
                      <p className="text-sm mt-2 font-medium">Renew Link</p>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{ opacity: isCreatingInviteLink ? 0.5 : 1 }}
              className="flex flex-col min-w-[400px] gap-2 my-3"
            >
              <div
                onClick={handleCreateInviteLink}
                className="flex items-center gap-3 hover:bg-[#454545] transition-colors rounded-md py-2 px-4 cursor-pointer border border-gray-600 border-solid"
              >
                <Link2 size={24} />
                <div>
                  <h3 className="text-sm font-medium">Create Invite Link</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Create a new invite link for this group
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      }
    />
  )
}

const groupChatPermissionsUIInfo = [
  {
    id: EGroupChatPermissions.SEND_MESSAGE,
    label: "Send Message",
  },
  {
    id: EGroupChatPermissions.PIN_MESSAGE,
    label: "Pin Message",
  },
  {
    id: EGroupChatPermissions.SHARE_INVITE_CODE,
    label: "Share Invite Code",
  },
  {
    id: EGroupChatPermissions.UPDATE_INFO,
    label: "Update Info",
  },
]

type TGroupChatPermissionsBoardProps = {
  open: boolean
  onOpen: (open: boolean) => void
  groupChat: TGroupChat
}

const GroupChatPermissionsBoard = ({
  open,
  onOpen,
  groupChat,
}: TGroupChatPermissionsBoardProps) => {
  const [permissions, setPickedPermissions] = useState<TGroupChatPermissionState>({
    sendMessage: false,
    pinMessage: false,
    shareInviteCode: false,
    updateInfo: false,
  })
  const [loading, setLoading] = useState<boolean>(false)
  const { groupChatPermissions } = useAppSelector(({ messages }) => messages)

  const handlePickPermission = (permission: EGroupChatPermissions) => {
    setPickedPermissions((prev) => {
      return {
        ...prev,
        [permission]: !prev[permission],
      }
    })
  }

  const checkPermissionIsPicked = (permission: EGroupChatPermissions) => {
    return permissions[permission]
  }

  const confirmUpdatingPermissions = async () => {
    setLoading(true)
    try {
      await groupChatService.updateGroupChatPermissions(groupChat.id, permissions)
    } catch (error) {
      toaster.error(axiosErrorHandler.handleHttpError(error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleGroupChatPermissionsChange = () => {
    if (groupChatPermissions) {
      setPickedPermissions(groupChatPermissions)
    }
  }

  useEffect(() => {
    handleGroupChatPermissionsChange()
  }, [groupChatPermissions])

  return (
    <div
      className={`${open ? "left-0" : "left-full"} absolute z-[90] top-0 transition-[left] duration-200 bg-black w-full h-full overflow-hidden`}
    >
      <div className="flex flex-col gap-2 w-full h-full">
        <div className="p-4 bg-regular-dark-gray-cl w-full">
          <IconButton onClick={() => onOpen(false)} className="w-fit pr-2.5">
            <span className="flex items-center gap-2 w-fit">
              <ArrowLeft size={20} />
              <span>Back</span>
            </span>
          </IconButton>
        </div>

        <div className="grow py-4 px-2 overflow-y-auto STYLE-styled-scrollbar bg-regular-dark-gray-cl w-full">
          <div className="w-full px-4">
            <h3 className="text-lg font-semibold w-full text-center">Group Permissions</h3>
            <p className="text-sm text-gray-400 w-full text-center">
              Admins can perform all the permissions below, members can:
            </p>
          </div>

          <div className="flex flex-col gap-1 mt-4">
            {groupChatPermissions ? (
              groupChatPermissionsUIInfo.map(({ id, label }) => (
                <div
                  key={id}
                  className="flex items-center gap-3 hover:bg-regular-hover-card-cl w-full cursor-pointer rounded-md px-4 py-2"
                  onClick={() => handlePickPermission(id)}
                >
                  <Checkbox
                    inputId={`user-${id}`}
                    readOnly
                    checked={checkPermissionIsPicked(id)}
                    labelClassName="border-2"
                    labelIconSize={16}
                  />

                  <div className="min-w-0 space-y-1">
                    <h3 title={label} className="font-medium text-base text-white truncate">
                      {label}
                    </h3>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col gap-1 justify-center items-center">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-2 w-full px-3 py-2">
                    <Skeleton className="w-full h-[20px] bg-regular-hover-card-cl rounded-md" />
                    <Skeleton className="w-1/2 h-[15px] bg-regular-hover-card-cl mt-1 rounded-md" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="transition-[bottom] duration-200 absolute right-6 bottom-8 z-20">
          {loading ? (
            <div className="flex justify-center items-center w-[50px] h-[50px] rounded-full bg-regular-violet-cl">
              <Spinner size="medium" />
            </div>
          ) : (
            <button
              onClick={confirmUpdatingPermissions}
              className="flex justify-center items-center w-[50px] h-[50px] rounded-full bg-regular-violet-cl hover:scale-110 transition duration-200"
            >
              <Check color="currentColor" size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

type TGroupActionsProps = {
  groupChat: TGroupChatData
  members: TGroupChatMemberWithUser[]
}

export const GroupActions = ({ groupChat, members }: TGroupActionsProps) => {
  const [openShareGroupDialog, setOpenShareGroupDialog] = useState<boolean>(false)
  const [openGroupChatPermissionsBoard, setOpenGroupChatPermissionsBoard] = useState<boolean>(false)
  const [openApproveMembersBoard, setOpenApproveMembersBoard] = useState<boolean>(false)

  const handleOpenManageMembers = () => {
    eventEmitter.emit(EInternalEvents.OPEN_MANAGE_MEMBERS, groupChat.id)
  }

  return (
    <div className="w-full mt-2 bg-regular-info-bar-bgcl px-4 pt-4 pb-6 text-base">
      {/* Group Info */}
      <div className="space-y-3">
        {/* Members */}
        <button
          onClick={handleOpenManageMembers}
          className="flex items-center gap-x-4 hover:bg-regular-hover-card-cl rounded-md p-2 w-full text-left"
        >
          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
            <Users className="h-5 w-5 text-zinc-400" color="currentColor" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-medium">Manage Members</h3>
            <p className="text-zinc-400">{members.length}</p>
          </div>
        </button>
        {/* Permissions */}
        <button
          onClick={() => setOpenApproveMembersBoard(true)}
          className="flex items-center gap-x-4 hover:bg-regular-hover-card-cl rounded-md p-2 w-full text-left"
        >
          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-zinc-400" color="currentColor" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-medium">Manage Join Requests</h3>
            <p className="text-zinc-400">Manage join requests to the group</p>
          </div>
        </button>
        {/* Permissions */}
        <button
          onClick={() => setOpenGroupChatPermissionsBoard(true)}
          className="flex items-center gap-x-4 hover:bg-regular-hover-card-cl rounded-md p-2 w-full text-left"
        >
          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
            <SquareChartGantt className="h-5 w-5 text-zinc-400" color="currentColor" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-medium">Permissions</h3>
            <p className="text-zinc-400">Manage permissions</p>
          </div>
        </button>
        <button
          onClick={() => setOpenShareGroupDialog(true)}
          className="flex items-center gap-x-4 hover:bg-regular-hover-card-cl rounded-md p-2 w-full text-left"
        >
          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
            <Share2 className="h-5 w-5 text-zinc-400" color="currentColor" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-medium">Join Group Link</h3>
            <p className="text-zinc-400">Share the group link with others</p>
          </div>
        </button>
        <button className="flex items-center gap-x-4 w-full justify-start rounded-md hover:bg-red-500/20 hover:text-red-400 p-2 h-auto">
          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-zinc-400" color="#ef4444" />
          </div>
          <div className="flex-1 space-y-1 text-red-500">
            <h3 className="font-medium w-fit">Delete Group</h3>
            <p className="w-fit">Delete the group</p>
          </div>
        </button>
      </div>

      <JoinGroupLinkDialog
        open={openShareGroupDialog}
        onOpen={setOpenShareGroupDialog}
        groupChat={groupChat}
      />

      <GroupChatPermissionsBoard
        open={openGroupChatPermissionsBoard}
        onOpen={setOpenGroupChatPermissionsBoard}
        groupChat={groupChat}
      />

      <ApproveMembersBoard
        open={openApproveMembersBoard}
        onOpen={setOpenApproveMembersBoard}
        groupChat={groupChat}
      />
    </div>
  )
}
