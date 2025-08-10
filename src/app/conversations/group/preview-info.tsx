import { Spinner } from "@/components/materials"
import { CustomTooltip } from "@/components/materials/tooltip"
import { useAppDispatch } from "@/hooks/redux"
import { removeConversation } from "@/redux/conversations/conversations.slice"
import { setGroupChat } from "@/redux/messages/messages.slice"
import { groupMemberService } from "@/services/group-member.service"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { EChatType } from "@/utils/enums"
import { generateInviteUrl } from "@/utils/helpers"
import { toaster } from "@/utils/toaster"
import type { TGroupChatData } from "@/utils/types/be-api"
import { LogOut, Share2 } from "lucide-react"
import { useState } from "react"

type TLoading = "leave-group"

type TPreviewInfoProps = {
  groupChat: TGroupChatData
}

export const PreviewInfo = ({ groupChat }: TPreviewInfoProps) => {
  const { inviteCode } = groupChat
  const [loading, setLoading] = useState<TLoading>()
  const dispatch = useAppDispatch()

  const handleCopyInviteLink = (inviteCode: string) => {
    navigator.clipboard.writeText(generateInviteUrl(inviteCode))
    toaster.success("Invite link copied to clipboard")
  }

  const leaveGroup = () => {
    if (loading === "leave-group") return
    setLoading("leave-group")
    groupMemberService
      .leaveGroupChat(groupChat.id)
      .then(() => {
        dispatch(removeConversation({ conversationId: groupChat.id, type: EChatType.GROUP }))
        dispatch(setGroupChat(null))
      })
      .catch((err) => {
        toaster.error(axiosErrorHandler.handleHttpError(err).message)
      })
      .finally(() => {
        setLoading(undefined)
      })
  }

  return (
    <div className="flex flex-col gap-2 w-full mt-2 bg-regular-info-bar-bgcl px-4 py-4 text-base border-b border-gray-700">
      {inviteCode && (
        <CustomTooltip title="Copy invite link" placement="bottom" align="center" arrow>
          <div
            onClick={() => handleCopyInviteLink(inviteCode)}
            className="flex items-center w-full gap-2 justify-start cursor-pointer text-regular-white-cl rounded-md hover:bg-regular-hover-card-cl p-3 h-auto"
          >
            <Share2 className="text-regular-white-cl min-h-5 min-w-5" color="currentColor" />
            <div className="grow text-left">
              <p className="text-base font-medium">Join Group Link</p>
              <span className="text-sm text-gray-400 truncate max-w-[220px] w-full inline-block">
                {generateInviteUrl(inviteCode)}
              </span>
            </div>
          </div>
        </CustomTooltip>
      )}
      <div
        onClick={leaveGroup}
        className={`${loading === "leave-group" ? "cursor-not-allowed bg-red-600/20" : "cursor-pointer"} flex items-center text-red-600 w-full gap-2 justify-start rounded-md hover:bg-red-600/20 hover:text-red-500 p-3 h-auto`}
      >
        {loading === "leave-group" ? (
          <Spinner size="medium" className="m-auto" />
        ) : (
          <>
            <LogOut className="min-h-5 min-w-5" color="currentColor" />
            <div className="grow text-left">
              <p className="text-base font-medium">Leave Group</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
