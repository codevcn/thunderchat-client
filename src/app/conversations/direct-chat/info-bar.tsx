import { dev_test_values } from "../../../../temp/test"

import { X, Info, AtSign, Mail } from "lucide-react"
import { openInfoBar } from "@/redux/conversations/conversations.slice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { IconButton } from "@/components/materials/icon-button"
import { ProgressiveImage } from "@/components/materials/progressive-image"
import { setLastSeen } from "@/utils/helpers"
import { robotoFont } from "@/utils/fonts"
import type { TUserWithProfile } from "@/utils/types/be-api"
import MediaPanel from "./(conversation-media)/media-panel"

type TAvatarProps = {
  recipient: TUserWithProfile
}

const Avatar = ({ recipient }: TAvatarProps) => {
  const { Profile } = recipient
  const { fullName, avatar } = Profile

  return (
    <div className="aspect-square w-full bg-purple-200 relative">
      <div className="w-full h-full cursor-default">
        {avatar ? (
          <ProgressiveImage
            src={avatar}
            className="w-full h-full"
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
          {"Last seen " + setLastSeen(dev_test_values.user_1.lastOnline)}
        </span>
      </div>
    </div>
  )
}

type TProfileInfoProps = {
  recipient: TUserWithProfile
}

const ProfileInfo = ({ recipient }: TProfileInfoProps) => {
  const { Profile, email } = recipient
  const { about } = Profile

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
    </div>
  )
}

type TInfoBarProps = {
  friendInfo: TUserWithProfile
}

export const InfoBar = ({ friendInfo }: TInfoBarProps) => {
  const { infoBarIsOpened } = useAppSelector(({ conversations }) => conversations)
  const dispatch = useAppDispatch()

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
          <h2>Thông tin hội thoại</h2>
        </div>
      </div>

      {/* Sửa layout cuộn, giữ custom scrollbar */}
      <div className="flex-1 min-h-0 w-full">
        <div className="overflow-y-auto STYLE-styled-scrollbar h-full min-h-0 bg-regular-info-bar-bgcl">
          <Avatar recipient={friendInfo} />
          <ProfileInfo recipient={friendInfo} />
          <MediaPanel />
        </div>
      </div>
    </div>
  )
}
