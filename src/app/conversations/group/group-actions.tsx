import { CheckCheck, Copy, Link2, RefreshCcw, Share2, Trash2 } from "lucide-react"
import { useAppDispatch } from "@/hooks/redux"
import type { TGroupChatData } from "@/utils/types/be-api"
import { useState } from "react"
import { CustomDialog, Spinner } from "@/components/materials"
import { toaster } from "@/utils/toaster"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { groupChatService } from "@/services/group-chat.service"
import { updateGroupChat } from "@/redux/messages/messages.slice"
import { generateInviteUrl } from "@/utils/helpers"
import { QRCodeCanvas } from "qrcode.react"

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

type TGroupActionsProps = {
  groupChat: TGroupChatData
}

export const GroupActions = ({ groupChat }: TGroupActionsProps) => {
  const { inviteCode } = groupChat
  const [openShareGroupDialog, setOpenShareGroupDialog] = useState<boolean>(false)
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
    <div className="w-full mt-2 bg-regular-info-bar-bgcl px-4 py-4 text-base">
      <button
        onClick={() => setOpenShareGroupDialog(true)}
        className="flex items-center w-full justify-start text-regular-white-cl rounded-md hover:bg-regular-hover-card-cl p-4 h-auto"
      >
        <Share2 className="h-5 w-5 mr-4" />
        <span>Join Group Link</span>
      </button>
      <button className="flex items-center w-full justify-start text-red-500 rounded-md hover:bg-red-500/10 hover:text-red-400 p-4 h-auto">
        <Trash2 className="h-5 w-5 mr-4" />
        <span>Delete Group</span>
      </button>

      <CustomDialog
        open={openShareGroupDialog}
        onHideShow={setOpenShareGroupDialog}
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
    </div>
  )
}
