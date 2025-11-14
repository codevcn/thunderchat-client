// SmartBar.tsx (File chứa component SmartBar)
import { X } from "lucide-react"
import { openInfoBar } from "@/redux/conversations/conversations.slice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { IconButton } from "@/components/materials/icon-button"
import type { TUserWithProfile } from "@/utils/types/be-api"
import { useUser } from "@/hooks/user"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
// Import SmartSearch và TMember từ file smart-search
import SmartSearch, { TMember } from "./smart-search"
import { EChatType } from "@/utils/enums"

type TInfoBarProps = {
  friendInfo: TUserWithProfile
}

export const SmartBar = ({ friendInfo }: TInfoBarProps) => {
  const { infoBarIsOpened } = useAppSelector(({ conversations }) => conversations)
  const { blockedUserId, directChat } = useAppSelector(({ messages }) => messages)
  const { id: directChatId } = directChat || {}
  const dispatch = useAppDispatch()
  const user = useUser()!

  const handleOpenInfoBar = (open: boolean) => {
    dispatch(openInfoBar(open))
  }

  // === THAY ĐỔI CHÍNH ===
  const handleMessageClick = (messageId: number, chatId: number, chatType: EChatType) => {
    console.log("Jumping to message (from SmartBar):", messageId)

    eventEmitter.emit(EInternalEvents.SCROLL_TO_QUERIED_MESSAGE, messageId)

    dispatch(openInfoBar(false))
  }
  // =====================

  const chatMembers: TUserWithProfile[] = [
    {
      id: user.id,
      email: user.email,
      Profile: user.Profile,
    } as TUserWithProfile,
    friendInfo,
  ]

  // Lọc ra các member TMember từ chatMembers
  const smartSearchMembers: TMember[] = chatMembers.map((member) => ({
    id: member.id,
    email: member.email,
    Profile: {
      id: member.Profile.id,
      fullName: member.Profile.fullName,
      avatar: member.Profile.avatar,
    },
  }))

  return (
    <div
      className={`${infoBarIsOpened ? "right-0" : "-right-slide-info-mb-bar screen-large-chatting:-right-slide-info-bar"} flex flex-col bg-regular-info-bar-bgcl screen-large-chatting:bg-regular-dark-gray-cl w-info-bar-mb screen-large-chatting:w-info-bar h-full overflow-hidden border-l-regular-hover-card-cl border-l z-[110] transition-[right] absolute duration-[0.4s] screen-large-chatting:duration-300 ease-slide-info-bar-timing`}
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
      <SmartSearch onMessageClick={handleMessageClick} />
    </div>
  )
}
