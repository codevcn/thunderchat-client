import { Trash2, Check } from "lucide-react"
import { useAppDispatch } from "@/hooks/redux"
import { useState } from "react"
import { CustomDialog, Spinner } from "@/components/materials"
import { toaster } from "@/utils/toaster"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { groupChatService } from "@/services/group-chat.service"
import { resetGroupMessages, setGroupChat } from "@/redux/messages/messages.slice"
import { EChatType } from "@/utils/enums"
import { removeConversation } from "@/redux/conversations/conversations.slice"
import { directChatService } from "@/services/direct-chat.service"
import { resetDirectMessages, setDirectChat } from "@/redux/messages/messages.slice"

type TDeleteDirectChatDialogProps = {
  open: boolean
  onHideShow: (open: boolean) => void
  directChatId?: number
}

export const DeleteDirectChatDialog = ({
  open,
  onHideShow,
  directChatId,
}: TDeleteDirectChatDialogProps) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const dispatch = useAppDispatch()

  const deleteChat = async () => {
    if (!directChatId) return
    setIsDeleting(true)
    try {
      await directChatService.deleteDirectChat(directChatId)
      onHideShow(false)
      dispatch(removeConversation({ conversationId: directChatId, type: EChatType.DIRECT }))
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
  groupChatId?: number
}

export const DeleteGroupChatDialog = ({
  open,
  onHideShow,
  groupChatId,
}: TDeleteGroupChatDialogProps) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const dispatch = useAppDispatch()

  const deleteGroupChat = async () => {
    if (!groupChatId) return
    setIsDeleting(true)
    try {
      await groupChatService.deleteGroupChat(groupChatId)
      onHideShow(false)
      dispatch(removeConversation({ conversationId: groupChatId, type: EChatType.GROUP }))
      dispatch(resetGroupMessages())
      dispatch(setGroupChat(null))
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
        title: "Delete this group",
        description: "Deleting this group will:",
      }}
      dialogBody={
        <div className="flex flex-col min-w-[400px] gap-2 my-3">
          <div className="flex items-center gap-3 rounded-md p-2">
            <Trash2 size={24} />
            <div>
              <h3 className="text-sm font-medium">Delete all messages of this group</h3>
              <p className="text-xs text-gray-400 mt-1">
                All messages in this group will be deleted. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md p-2">
            <Trash2 size={24} />
            <div>
              <h3 className="text-sm font-medium">Delete all members of this group</h3>
              <p className="text-xs text-gray-400 mt-1">
                All members in this group will be deleted. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md p-2">
            <Trash2 size={24} />
            <div>
              <h3 className="text-sm font-medium">Delete all invite links of this group</h3>
              <p className="text-xs text-gray-400 mt-1">
                All invite links to this group will be deleted. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md p-2">
            <Trash2 size={24} />
            <div>
              <h3 className="text-sm font-medium">Delete all join requests of this group</h3>
              <p className="text-xs text-gray-400 mt-1">
                All join requests to this group will be deleted. This action cannot be undone.
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
            onClick={deleteGroupChat}
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
