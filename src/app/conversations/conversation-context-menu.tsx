import { createPortal } from "react-dom"
import { Check, LogOut, Trash, Trash2 } from "lucide-react"
import { CustomDialog, CustomPopover, Spinner } from "@/components/materials"
import { EChatType } from "@/utils/enums"
import type { TConversationCard } from "@/utils/types/global"
import type { TPopoverPos } from "./sharings"
import { toaster } from "@/utils/toaster"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { useEffect, useState } from "react"
import { directChatService } from "@/services/direct-chat.service"
import { useAppDispatch } from "@/hooks/redux"
import { removeConversation } from "@/redux/conversations/conversations.slice"
import { resetDirectMessages, setDirectChat } from "@/redux/messages/messages.slice"
import { groupMemberService } from "@/services/group-member.service"

type TDeleteDirectChatDialogProps = {
  open: boolean
  onHideShow: (open: boolean) => void
  pickedConversation?: TConversationCard
}

const DeleteDirectChatDialog = ({
  open,
  onHideShow,
  pickedConversation,
}: TDeleteDirectChatDialogProps) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const dispatch = useAppDispatch()

  const deleteChat = async () => {
    if (!pickedConversation) return
    setIsDeleting(true)
    try {
      await directChatService.deleteDirectChat(pickedConversation.id)
      onHideShow(false)
      dispatch(
        removeConversation({ conversationId: pickedConversation.id, type: EChatType.DIRECT })
      )
      dispatch(resetDirectMessages())
      dispatch(setDirectChat(null))
    } catch (err) {
      toaster.error(axiosErrorHandler.handleHttpError(err).message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onHideShow={onHideShow}
      dialogHeader={{
        title: "Delete this chat",
        description: "Delete this chat will:",
      }}
      dialogBody={
        <div className="flex flex-col min-w-[400px] gap-2 my-3">
          <div className="flex items-center gap-3 rounded-md p-2">
            <Trash2 size={24} />
            <div>
              <h3 className="text-sm font-medium">Delete all messages of this chat</h3>
              <p className="text-xs text-gray-400 mt-1">
                All messages between you and this user will be deleted. This action cannot be
                undone.
              </p>
            </div>
          </div>
        </div>
      }
      confirmElement={
        isDeleting ? (
          <div className="flex h-8">
            <Spinner size="small" className="text-gray-600 m-auto" />
          </div>
        ) : (
          <button
            onClick={deleteChat}
            className="flex gap-2 items-center bg-regular-red-cl text-regular-white-cl outline-none ring-0 px-3 h-8 border-2 border-regular-red-cl rounded-md hover:bg-transparent hover:text-regular-red-cl"
          >
            <Check size={16} color="currentColor" />
            <span>Confirm</span>
          </button>
        )
      }
      cancelElement={isDeleting ? <span></span> : undefined}
    />
  )
}

type TDeleteGroupChatDialogProps = {
  open: boolean
  onHideShow: (open: boolean) => void
  pickedConversation?: TConversationCard
}

const LeaveGroupChatDialog = ({
  open,
  onHideShow,
  pickedConversation,
}: TDeleteGroupChatDialogProps) => {
  const [isLeavingGroupChat, setIsLeavingGroupChat] = useState<boolean>(false)

  const leaveGroupChat = async () => {
    if (!pickedConversation) return
    setIsLeavingGroupChat(true)
    try {
      await groupMemberService.leaveGroupChat(pickedConversation.id)
      onHideShow(false)
    } catch (err) {
      toaster.error(axiosErrorHandler.handleHttpError(err).message)
    } finally {
      setIsLeavingGroupChat(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onHideShow={onHideShow}
      dialogHeader={{
        title: "Leave this group chat",
      }}
      dialogBody={
        <div className="flex flex-col min-w-[400px] gap-2 my-3">
          <div className="flex items-center gap-3 rounded-md">
            <div>
              <h3 className="text-sm font-medium">You confirm to leave this group chat?</h3>
              <p className="text-xs text-gray-400 mt-1">
                You will no longer receive messages from this group chat. This action cannot be
                undone.
              </p>
            </div>
          </div>
        </div>
      }
      confirmElement={
        isLeavingGroupChat ? (
          <div className="flex h-8">
            <Spinner size="small" className="text-gray-600 m-auto" />
          </div>
        ) : (
          <button
            onClick={leaveGroupChat}
            className="flex gap-2 items-center bg-regular-red-cl text-regular-white-cl outline-none ring-0 px-3 h-8 border-2 border-regular-red-cl rounded-md hover:bg-transparent hover:text-regular-red-cl"
          >
            <Check size={16} color="currentColor" />
            <span>Confirm</span>
          </button>
        )
      }
      cancelElement={isLeavingGroupChat ? <span></span> : undefined}
    />
  )
}

type TConversationContextMenuProps = {
  pickedConversation?: TConversationCard
  onOpenCloseContextMenu: (open: boolean) => void
  popoverPos?: TPopoverPos
}

export const ConversationContextMenu = ({
  pickedConversation,
  onOpenCloseContextMenu,
  popoverPos,
}: TConversationContextMenuProps) => {
  const [conversation, setConversation] = useState<TConversationCard>()
  const [openDeleteChatDialog, setOpenDeleteChatDialog] = useState<boolean>(false)
  const [openDeleteGroupChatDialog, setOpenDeleteGroupChatDialog] = useState<boolean>(false)

  const showDeleteGroupChatDialog = () => {
    setOpenDeleteGroupChatDialog(true)
  }

  const showDeleteDirectChatDialog = () => {
    setOpenDeleteChatDialog(true)
  }

  const handleSetConversation = () => {
    if (pickedConversation) {
      setConversation(pickedConversation)
    }
  }

  useEffect(() => {
    handleSetConversation()
  }, [pickedConversation])

  return (
    <>
      <CustomPopover
        open={!!pickedConversation}
        onOpenChange={onOpenCloseContextMenu}
        trigger={createPortal(<span></span>, document.body)}
        popoverBoard={{
          style: {
            position: "fixed",
            top: `${popoverPos?.top}px`,
            left: `${popoverPos?.left}px`,
          },
        }}
      >
        <div
          id="QUERY-context-menu"
          className="flex flex-col gap-2 bg-regular-black-cl rounded-md py-2 border border-gray-600 relative"
        >
          {conversation &&
            (conversation.type === EChatType.GROUP ? (
              <button
                onClick={showDeleteGroupChatDialog}
                className="w-full text-regular-white-cl hover:bg-gray-600/50 outline-none border-none ring-0"
              >
                <span className="flex justify-start items-center gap-2 min-w-max active:scale-95 py-1 px-4">
                  <LogOut color="currentColor" size={16} />
                  <span className="text-sm">Leave group chat</span>
                </span>
              </button>
            ) : (
              <button
                onClick={showDeleteDirectChatDialog}
                className="w-full text-regular-white-cl hover:bg-gray-600/50 outline-none border-none ring-0"
              >
                <span className="flex justify-start items-center gap-2 min-w-max active:scale-95 py-1 px-4">
                  <Trash color="currentColor" size={16} />
                  <span className="text-sm">Delete this chat</span>
                </span>
              </button>
            ))}
        </div>
      </CustomPopover>

      <LeaveGroupChatDialog
        open={openDeleteGroupChatDialog}
        onHideShow={setOpenDeleteGroupChatDialog}
        pickedConversation={conversation}
      />

      <DeleteDirectChatDialog
        open={openDeleteChatDialog}
        onHideShow={setOpenDeleteChatDialog}
        pickedConversation={conversation}
      />
    </>
  )
}
