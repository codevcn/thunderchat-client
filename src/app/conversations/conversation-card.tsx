"use client"

import { CustomAvatar, PinButton } from "@/components/materials"
import dayjs from "dayjs"
import { useEffect } from "react"
import { joinChatRoom, santizeMsgContent } from "@/utils/helpers"
import { EChatType, EMessageTypes } from "@/utils/enums"
import type { TConversationCard } from "@/utils/types/global"
import type { TPopoverPos } from "./sharings"

const MAX_UNREAD_MESSAGES_COUNT: number = 9

const convertSubtitleTypeToText = (
  subtitleType: EMessageTypes,
  subtitleContent: string
): string => {
  switch (subtitleType) {
    case EMessageTypes.STICKER:
      return "Sticker"
    case EMessageTypes.MEDIA:
      return "Media"
    case EMessageTypes.PIN_NOTICE:
      return subtitleContent
    default:
      return "Unknown"
  }
}

const getPinIndexClass = (pinIndex: number): string => {
  switch (pinIndex) {
    case 1:
      return "order-1"
    case 2:
      return "order-2"
    case 3:
      return "order-3"
    default:
      return "order-4"
  }
}

type TConversationCardProps = {
  onNavToConversation: (id: number, type: EChatType) => void
  isPinned: boolean
  pinLoading: boolean
  conversationData: TConversationCard
  onTogglePin: (directChatId?: number, groupChatId?: number) => void
  onPickedConversation: (conversation: TConversationCard) => void
  onSetPopoverPos: (pos: TPopoverPos) => void
  isPicked: boolean
}

export const ConversationCard = ({
  onNavToConversation,
  isPinned,
  pinLoading,
  conversationData,
  onTogglePin,
  onPickedConversation,
  onSetPopoverPos,
  isPicked,
}: TConversationCardProps) => {
  const { id, type, avatar, title, lastMessageTime, subtitle, pinIndex, unreadMessageCount } =
    conversationData
  const subtitleType = subtitle.type
  const subtitleContent = subtitle.content
  const pinIndexClass = getPinIndexClass(pinIndex)

  const handleExecuteTogglePin = () => {
    if (type === EChatType.DIRECT) {
      onTogglePin(id)
    } else {
      onTogglePin(undefined, id)
    }
  }

  const handleOpenContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    onPickedConversation(conversationData)
    onSetPopoverPos({ top: e.clientY, left: e.clientX })
  }

  useEffect(() => {
    joinChatRoom(id, type)
  }, [])

  return (
    <div
      className={`${isPicked ? "bg-violet-600/30" : ""} group flex gap-2 items-center px-3 py-2 w-full cursor-pointer hover:bg-regular-hover-card-cl rounded-lg ${pinIndexClass} group`}
      key={`${type}-${id}`}
      onClick={() => onNavToConversation(id, type)}
      onContextMenu={handleOpenContextMenu}
    >
      <div>
        <CustomAvatar
          src={avatar.src || undefined}
          imgSize={50}
          fallback={avatar.fallback.toUpperCase()}
          fallbackClassName="bg-regular-violet-cl text-2xl"
        />
      </div>
      <div className="w-[208px]">
        <div className="flex justify-between items-center w-full gap-3">
          <h3 className="truncate max-w-[150px] font-bold grow text-left leading-snug">{title}</h3>
          <div className="text-[10px] w-max min-w-max text-regular-icon-cl">
            {dayjs(lastMessageTime).format("MMM D, YYYY")}
          </div>
        </div>
        <div className="flex justify-between items-center mt-1 box-border gap-3">
          {subtitleType !== EMessageTypes.TEXT ? (
            <p className="truncate max-w-[150px] text-regular-placeholder-cl text-sm">
              <span className="text-regular-icon-cl italic">
                {convertSubtitleTypeToText(subtitleType, subtitleContent)}
              </span>
            </p>
          ) : (
            <p
              dangerouslySetInnerHTML={{
                __html: santizeMsgContent(subtitleContent),
              }}
              className="truncate opacity-60 max-w-[150px] text-regular-white-cl text-sm leading-normal STYLE-conversation-subtitle"
            ></p>
          )}
          <div className="flex items-center gap-1">
            {unreadMessageCount > 0 && (
              <span className="flex items-center gap-1 h-5">
                <span className="w-min px-1 h-full bg-regular-violet-cl rounded-full leading-none">
                  {unreadMessageCount > MAX_UNREAD_MESSAGES_COUNT
                    ? `${MAX_UNREAD_MESSAGES_COUNT}+`
                    : unreadMessageCount}
                </span>
              </span>
            )}
            <div className="flex items-center gap-1">
              <div
                className={`transition-opacity ${isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
              >
                <PinButton
                  isPinned={isPinned}
                  onToggle={handleExecuteTogglePin}
                  loading={pinLoading}
                  size={16}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
