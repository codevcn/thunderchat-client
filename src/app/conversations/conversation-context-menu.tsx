import { createPortal } from "react-dom"
import { LogOut, Trash } from "lucide-react"
import { CustomPopover, Spinner } from "@/components/materials"
import { EChatType } from "@/utils/enums"
import type { TConversationCard } from "@/utils/types/global"
import type { TPopoverPos } from "./sharings"
import { groupChatService } from "@/services/group-chat.service"
import { toaster } from "@/utils/toaster"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { useState } from "react"

type TConversationContextMenuProps = {
  pickedConversation?: TConversationCard
  openCloseContextMenu: (open: boolean) => void
  popoverPos?: TPopoverPos
}

export const ConversationContextMenu = ({
  pickedConversation,
  openCloseContextMenu,
  popoverPos,
}: TConversationContextMenuProps) => {
  const [isLeavingGroupChat, setIsLeavingGroupChat] = useState<boolean>(false)

  const leaveGroupChat = async () => {
    if (!pickedConversation || pickedConversation.type !== EChatType.GROUP) return
    setIsLeavingGroupChat(true)
    try {
      await groupChatService.leaveGroupChat(pickedConversation.id)
      openCloseContextMenu(false)
    } catch (err) {
      toaster.error(axiosErrorHandler.handleHttpError(err).message)
    } finally {
      setIsLeavingGroupChat(false)
    }
  }

  const leaveDirectChat = () => {
    console.log("leave direct chat")
  }

  return (
    <CustomPopover
      open={!!pickedConversation}
      onOpenChange={openCloseContextMenu}
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
        hidden={!pickedConversation}
        className="flex flex-col gap-2 bg-regular-black-cl rounded-md py-2 border border-gray-600 relative"
      >
        {isLeavingGroupChat && (
          <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
            {isLeavingGroupChat && <Spinner size="small" className="text-gray-600" />}
          </div>
        )}
        {pickedConversation &&
          (pickedConversation.type === EChatType.GROUP ? (
            <button
              onClick={leaveGroupChat}
              className="w-full text-regular-white-cl hover:bg-gray-600/50 outline-none border-none ring-0"
              disabled={isLeavingGroupChat}
            >
              <span className="flex justify-start items-center gap-2 min-w-max active:scale-95 py-1 px-4">
                <LogOut color="currentColor" size={16} />
                <span className="text-sm">Leave group chat</span>
              </span>
            </button>
          ) : (
            <button
              onClick={leaveDirectChat}
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
  )
}
