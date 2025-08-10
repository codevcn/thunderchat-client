import { X, Info, Mail, AlertTriangle, Ban, MessageCircleX, Check } from "lucide-react"
import { openInfoBar } from "@/redux/conversations/conversations.slice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { IconButton } from "@/components/materials/icon-button"
import { ProgressiveImage } from "@/components/materials/progressive-image"
import { robotoFont } from "@/utils/fonts"
import type { TUserWithProfile } from "@/utils/types/be-api"
import MediaPanel from "../../../components/conversation-media/media-panel"
import { ReportModal } from "../../../components/chatbox/user-report/report-model"
import { useState } from "react"
import { userService } from "@/services/user.service"
import { toaster } from "@/utils/toaster"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { Checkbox, CustomDialog, Spinner } from "@/components/materials"
import { EBlockTypes } from "@/utils/enums"
import { setBlockedUserId } from "@/redux/messages/messages.slice"
import { useUser } from "@/hooks/user"

type TAvatarProps = {
  recipient: TUserWithProfile
}

const Avatar = ({ recipient }: TAvatarProps) => {
  const { Profile, email } = recipient
  const { fullName, avatar } = Profile

  return (
    <div className="aspect-square w-full bg-purple-200 relative">
      <div className="w-full h-full cursor-default">
        {avatar ? (
          <ProgressiveImage
            src={avatar}
            className="w-full h-full bg-regular-black-cl"
            prgssClassName="w-full h-full bg-regular-black-cl"
          />
        ) : (
          <div
            className={`${robotoFont.variable} w-full h-full flex justify-center font-roboto items-center overflow-hidden text-user-avt-fsize bg-user-avt-bgimg`}
          >
            {fullName[0] || "U"}
          </div>
        )}
      </div>

      <div className="flex justify-end flex-col absolute bottom-0 left-0 bg-modal-text-bgimg min-h-[100px] w-full px-6 pb-2">
        <p className="text-xl font-bold">{fullName || "Unnamed"}</p>
        <span className="text-sm opacity-60">
          Email: <span>{email}</span>
        </span>
      </div>
    </div>
  )
}

type TProfileInfoProps = {
  recipient: TUserWithProfile
}

const ProfileInfo = ({
  recipient,
  directChatId,
}: TProfileInfoProps & { directChatId?: number }) => {
  const { Profile, email } = recipient
  const { about } = Profile
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isBlocking, setIsBlocking] = useState<boolean>(false)
  const [openBlockModal, setOpenBlockModal] = useState<boolean>(false)
  const [pickedBlockOption, setPickedBlockOption] = useState<EBlockTypes>()
  const dispatch = useAppDispatch()

  const handleOpenReportModal = () => {
    setIsReportModalOpen(true)
  }

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false)
  }

  const blockUser = async () => {
    if (!pickedBlockOption) {
      toaster.error("Please select a block option")
      return
    }
    setIsBlocking(true)
    try {
      await userService.blockUser(recipient.id, pickedBlockOption)
      setOpenBlockModal(false)
      dispatch(setBlockedUserId(recipient.id))
    } catch (error) {
      toaster.error(axiosErrorHandler.handleHttpError(error).message)
    } finally {
      setIsBlocking(false)
    }
  }

  const openBlockUserDialog = async () => {
    setOpenBlockModal(true)
  }

  const checkOptionIsPicked = (option: EBlockTypes) => {
    return pickedBlockOption === option
  }

  const togglePickBlockOption = (option: EBlockTypes) => {
    setPickedBlockOption((prev) => (prev === option ? undefined : option))
  }

  return (
    <div className="flex flex-col gap-2 px-2 pt-[0.87rem] pb-[0.87rem]">
      {about && (
        <div className="flex gap-4 items-center px-4 py-2">
          <div className="text-regular-icon-cl">
            <Info color="currentColor" />
          </div>
          <div className="w-info-bar">
            <p className="text-base leading-5 w-full">{about}</p>
            <p className="text-regular-text-secondary-cl mt-1">Bio</p>
          </div>
        </div>
      )}

      {email && (
        <div className="flex gap-4 items-center px-4 py-2">
          <div className="text-regular-icon-cl">
            <Mail color="currentColor" />
          </div>
          <div className="w-info-bar">
            <p className="text-base leading-5 w-full">{email}</p>
            <p className="text-regular-text-secondary-cl mt-1">Email</p>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-center px-4 py-2">
        <div className="text-red-500">
          <AlertTriangle color="currentColor" />
        </div>
        <div className="w-info-bar">
          <button
            onClick={handleOpenReportModal}
            className="text-base leading-5 w-full text-left text-red-500 hover:text-red-400 transition-colors"
          >
            Report user
          </button>
        </div>
      </div>

      <div
        onClick={openBlockUserDialog}
        className={`${isBlocking ? "opacity-90 cursor-not-allowed" : "cursor-pointer hover:bg-red-600/20"} flex gap-4 items-center px-4 py-2 rounded-md transition-colors relative`}
      >
        {isBlocking && (
          <div className="flex absolute top-0 left-0 w-full h-full bg-black/40 rounded-md">
            <div className="flex items-center gap-2 m-auto">
              <Spinner size="small" />
            </div>
          </div>
        )}
        <div className="text-red-500">
          <Ban color="currentColor" />
        </div>
        <div className="w-full">
          <div className="text-base leading-5 w-full text-left text-red-500">Block user</div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={handleCloseReportModal}
        user={recipient}
        conversationId={directChatId}
        conversationType="direct"
      />

      {/* Block Modal */}
      <CustomDialog
        open={openBlockModal}
        onHideShow={setOpenBlockModal}
        dialogHeader={{ title: `Manage blocking user "${Profile.fullName}"` }}
        dialogBody={
          <div className="flex flex-col min-w-[400px] gap-2 my-3">
            <div
              className="flex items-center gap-3 hover:bg-[#454545] transition-colors rounded-md p-2 cursor-pointer"
              onClick={() => togglePickBlockOption(EBlockTypes.MESSAGE)}
            >
              <MessageCircleX size={24} />
              <div>
                <h3 className="text-sm font-medium">Block messages</h3>
                <p className="text-xs text-regular-placeholder-cl mt-1">
                  Both users will not be able to send messages to each other.
                </p>
              </div>
              <div>
                <Checkbox
                  inputId={EBlockTypes.MESSAGE}
                  checked={checkOptionIsPicked(EBlockTypes.MESSAGE)}
                  readOnly
                  labelClassName="border-[#949494] border-2"
                  labelIconSize={16}
                />
              </div>
            </div>
          </div>
        }
        confirmElement={
          <button
            onClick={blockUser}
            className="flex gap-2 items-center bg-regular-red-cl text-regular-white-cl px-3 py-1.5 border-2 border-regular-red-cl rounded-md hover:bg-transparent hover:text-regular-red-cl"
          >
            <Check size={16} color="currentColor" />
            <span>Confirm</span>
          </button>
        }
      />
    </div>
  )
}

type TInfoBarProps = {
  friendInfo: TUserWithProfile
  directChatId?: number
}

export const InfoBar = ({ friendInfo, directChatId }: TInfoBarProps) => {
  const { infoBarIsOpened } = useAppSelector(({ conversations }) => conversations)
  const { blockedUserId } = useAppSelector(({ messages }) => messages)
  const dispatch = useAppDispatch()
  const user = useUser()!

  const handleOpenInfoBar = (open: boolean) => {
    dispatch(openInfoBar(open))
  }

  return (
    <div
      className={`${infoBarIsOpened ? "right-0" : "-right-slide-info-mb-bar screen-large-chatting:-right-slide-info-bar"} flex flex-col bg-regular-info-bar-bgcl screen-large-chatting:bg-regular-dark-gray-cl w-info-bar-mb screen-large-chatting:w-info-bar h-full overflow-hidden border-l-regular-hover-card-cl border-l z-[60] transition-[right] absolute duration-[0.4s] screen-large-chatting:duration-300 ease-slide-info-bar-timing`}
    >
      <div className="flex items-center gap-[15px] h-header py-[7px] px-3">
        <IconButton
          className="flex justify-center items-center h-10 w-10 text-regular-icon-cl"
          onClick={() => handleOpenInfoBar(false)}
        >
          <X />
        </IconButton>
        <div className="text-xl">
          <h2>Conversation information</h2>
        </div>
      </div>

      {/* Sửa layout cuộn, giữ custom scrollbar */}
      <div className="flex-1 min-h-0 w-full">
        <div className="overflow-y-auto STYLE-styled-scrollbar h-full min-h-0 bg-regular-info-bar-bgcl">
          <Avatar recipient={friendInfo} />
          {blockedUserId ? (
            blockedUserId === friendInfo.id ? (
              <div className="flex items-center gap-2 px-4 py-2 mt-4">
                <div className="text-red-500">
                  <Ban size={24} color="currentColor" />
                </div>
                <div className="w-info-bar text-red-500">
                  <p className="text-base leading-5 w-full">
                    You blocked this user. You two will not be able to send messages to each other.
                  </p>
                </div>
              </div>
            ) : (
              user.id === blockedUserId && (
                <div className="flex items-center gap-2 px-4 py-2 mt-4">
                  <div className="text-red-500">
                    <Ban size={24} color="currentColor" />
                  </div>
                  <div className="w-info-bar text-red-500">
                    <p className="text-base leading-5 w-full">
                      You are blocked by this user. You will not be able to send messages to them.
                    </p>
                  </div>
                </div>
              )
            )
          ) : (
            <>
              <ProfileInfo recipient={friendInfo} directChatId={directChatId} />
              <MediaPanel />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
