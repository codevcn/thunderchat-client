"use client"

import { CustomAvatar, CustomTooltip, Skeleton } from "@/components/materials"
import { IconButton } from "@/components/materials/icon-button"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useEffect, useState } from "react"
import { Search, Phone, MoreVertical } from "lucide-react"
import { openInfoBar } from "@/redux/conversations/conversations.slice"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"
import { TypeMessageBar } from "./type-message-bar"
import { InfoBar } from "./info-bar"
import type { TGroupChatData } from "@/utils/types/be-api"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"

const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 grow pt-1">
        <span className="w-1 h-1 bg-regular-placeholder-cl rounded-full animate-typing-message delay-0"></span>
        <span className="w-1 h-1 bg-regular-placeholder-cl rounded-full animate-typing-message delay-150"></span>
        <span className="w-1 h-1 bg-regular-placeholder-cl rounded-full animate-typing-message delay-300"></span>
      </div>
      <p className="text-xs text-regular-placeholder-cl font-semibold">The user is typing...</p>
    </div>
  )
}

type THeaderProps = {
  infoBarIsOpened: boolean
  onOpenInfoBar: (open: boolean) => void
  groupChat: TGroupChatData
}

const Header = ({ infoBarIsOpened, onOpenInfoBar, groupChat }: THeaderProps) => {
  const { name, avatarUrl } = groupChat
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const { groupChatMembers } = useAppSelector(({ messages }) => messages)

  const handleTypingMessage = (typing: boolean) => {
    setIsTyping(typing)
  }

  useEffect(() => {
    clientSocket.socket.on(ESocketEvents.typing_direct, handleTypingMessage)
    return () => {
      clientSocket.socket.removeListener(ESocketEvents.typing_direct, handleTypingMessage)
    }
  }, [])

  return (
    <div className="flex justify-between gap-2 px-6 py-1.5 bg-regular-dark-gray-cl w-full box-border h-header">
      {name ? (
        <CustomTooltip title="View user info" placement="bottom">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onOpenInfoBar(true)}
          >
            <CustomAvatar
              src={avatarUrl}
              imgSize={45}
              className="text-2xl bg-regular-violet-cl"
              fallback={name[0]}
            />
            <div className="text-left">
              <h3 className="text-lg leading-tight font-bold w-fit text-white">
                {name || "Unnamed"}
              </h3>
              {isTyping ? (
                <TypingIndicator />
              ) : groupChatMembers && groupChatMembers.length > 0 ? (
                <span className="text-xs leading-none text-regular-text-secondary-cl">
                  {`${groupChatMembers.length} ${groupChatMembers.length > 1 ? "members" : "member"}`}
                </span>
              ) : (
                <div className="w-10 h-4">
                  <Skeleton className="w-full h-full" />
                </div>
              )}
            </div>
          </div>
        </CustomTooltip>
      ) : (
        <div className="flex gap-2">
          <Skeleton className="h-11 w-11 rounded-full bg-[#b8b8b826]" />
          <div className="flex flex-col justify-between h-full">
            <Skeleton className="h-5 w-[100px] bg-[#b8b8b826]" />
            <Skeleton className="h-5 w-[150px] bg-[#b8b8b826]" />
          </div>
        </div>
      )}

      <div
        className={`${infoBarIsOpened ? "screen-large-chatting:translate-x-slide-header-icons" : "translate-x-0"} flex items-center gap-2 transition duration-300 ease-slide-info-bar-timing`}
      >
        <CustomTooltip title="Search this chat" placement="bottom" align="end">
          <div>
            <IconButton className="flex justify-center items-center text-regular-icon-cl w-[40px] h-[40px]">
              <Search />
            </IconButton>
          </div>
        </CustomTooltip>

        <CustomTooltip title="Call" placement="bottom" align="end">
          <div>
            <IconButton className="flex justify-center items-center text-regular-icon-cl w-[40px] h-[40px]">
              <Phone />
            </IconButton>
          </div>
        </CustomTooltip>

        <CustomTooltip title="More actions" placement="bottom" align="end">
          <div>
            <IconButton className="flex justify-center items-center text-regular-icon-cl w-[40px] h-[40px]">
              <MoreVertical />
            </IconButton>
          </div>
        </CustomTooltip>
      </div>
    </div>
  )
}

export const GroupChatbox = () => {
  const { groupChat } = useAppSelector(({ messages }) => messages)
  const dispatch = useAppDispatch()
  const { infoBarIsOpened } = useAppSelector(({ conversations }) => conversations)

  const hanldeOpenInfoBar = async (open: boolean) => {
    dispatch(openInfoBar(open))
  }

  const handleFetchGroupChat = (groupChatId: number) => {
    // dispatch(fetchGroupChatThunk(groupChatId))
    // dispatch(fetchGroupChatMembersThunk(groupChatId))
  }

  useEffect(() => {
    eventEmitter.on(EInternalEvents.FETCH_GROUP_CHAT, handleFetchGroupChat)
    return () => {
      eventEmitter.off(EInternalEvents.FETCH_GROUP_CHAT, handleFetchGroupChat)
    }
  }, [])

  return (
    groupChat && (
      <div className="screen-medium-chatting:w-chat-n-info-container flex w-full box-border overflow-hidden relative">
        <div className="flex flex-col items-center w-full box-border h-screen bg-no-repeat bg-transparent bg-cover bg-center relative">
          <Header
            infoBarIsOpened={infoBarIsOpened}
            onOpenInfoBar={hanldeOpenInfoBar}
            groupChat={groupChat}
          />
          <div
            className={`${infoBarIsOpened ? "screen-large-chatting:translate-x-slide-chat-container screen-large-chatting:w-msgs-container" : "translate-x-0 w-full"} flex flex-col justify-between items-center h-chat-container transition duration-300 ease-slide-info-bar-timing overflow-hidden`}
          >
            {/* <GroupMessages groupChat={groupChat} /> */}

            <TypeMessageBar groupChat={groupChat} />
          </div>
        </div>
        <InfoBar />
      </div>
    )
  )
}
