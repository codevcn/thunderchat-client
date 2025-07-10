"use client"

// >>> fix this: remove
import { dev_test_values } from "../../../../temp/test"

import { CustomAvatar, CustomTooltip } from "@/components/materials"
import { IconButton } from "@/components/materials/icon-button"
import { Messages } from "./messages"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useEffect, useMemo, useState } from "react"
import { Search, Phone, MoreVertical } from "lucide-react"
import { InfoBar } from "./info-bar"
import { openInfoBar } from "@/redux/conversations/conversations.slice"
import { setLastSeen } from "@/utils/helpers"
import { fetchDirectChatThunk } from "@/redux/conversations/conversations.thunks"
import { TypeMessageBar } from "./type-message-bar"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"
import type { TDirectChatData, TUserWithProfile } from "@/utils/types/be-api"
import { VoiceMessagePlayer } from "../(voice-chat)/VoiceMessagePlayerProps"
import { VoicePlayerProvider, useVoicePlayer } from "@/contexts/voice-player.context"
import { useAudioMessages } from "@/hooks/audio-messages"
import { useUser } from "@/hooks/user"
import type { TStateDirectMessage } from "@/utils/types/global"

const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-300 px-4 py-2">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>
      <span>Đang nhập...</span>
    </div>
  )
}

type THeaderProps = {
  infoBarIsOpened: boolean
  onOpenInfoBar: (open: boolean) => void
  friendInfo: TUserWithProfile
}

const Header = ({ infoBarIsOpened, onOpenInfoBar, friendInfo }: THeaderProps) => {
  const { Profile } = friendInfo
  const [isTyping, setIsTyping] = useState<boolean>(false)

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
      <CustomTooltip title="View user info" placement="bottom">
        <div className="flex gap-2 cursor-pointer" onClick={() => onOpenInfoBar(true)}>
          <CustomAvatar
            src={Profile.avatar}
            imgSize={45}
            className="text-2xl bg-regular-violet-cl"
            fallback={Profile.fullName[0]}
          />
          <div className="flex flex-col">
            <h3 className="text-lg font-bold w-fit text-white">{Profile.fullName || "Unnamed"}</h3>
            {isTyping ? (
              <TypingIndicator />
            ) : (
              <div className="text-xs text-regular-text-secondary-cl">
                {"Last seen " + setLastSeen(dev_test_values.user_1.lastOnline)}
              </div>
            )}
          </div>
        </div>
      </CustomTooltip>

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

type TMainProps = {
  directChat: TDirectChatData
}

const Main = ({ directChat }: TMainProps) => {
  const { Recipient, Creator } = directChat
  const user = useUser()!
  const { infoBarIsOpened } = useAppSelector(({ conversations }) => conversations)
  const dispatch = useAppDispatch()
  const { showPlayer } = useVoicePlayer()
  const [replyMessage, setReplyMessage] = useState<TStateDirectMessage | null>(null)

  // Add logging for setReplyMessage
  const handleSetReplyMessage = (msg: TStateDirectMessage | null) => {
    setReplyMessage(msg)
  }

  const handleOpenInfoBar = (open: boolean) => {
    dispatch(openInfoBar(open))
  }

  // Hook để quản lý danh sách audio messages
  useAudioMessages()

  const friendInfo = useMemo<TUserWithProfile>(() => {
    return user.id === Creator.id ? Recipient : Creator
  }, [Recipient, Creator])

  return (
    <div className="screen-medium-chatting:w-chat-n-info-container flex w-full box-border overflow-hidden relative">
      <div className="flex flex-col items-center w-full box-border h-screen bg-no-repeat bg-transparent bg-cover bg-center relative">
        <Header
          infoBarIsOpened={infoBarIsOpened}
          onOpenInfoBar={handleOpenInfoBar}
          friendInfo={friendInfo}
        />

        {/* Voice Player floating layer */}
        {showPlayer && (
          <div
            className="absolute top-[60px] left-0 z-30 w-full max-w-none sm:max-w-[480px] sm:left-1/2 sm:-translate-x-1/2 px-0"
            style={{ pointerEvents: "none" }}
          >
            <div className="px-4" style={{ pointerEvents: "auto" }}>
              <VoiceMessagePlayer />
            </div>
          </div>
        )}

        <div
          className={`${infoBarIsOpened ? "screen-large-chatting:translate-x-slide-chat-container screen-large-chatting:w-msgs-container" : "translate-x-0 w-full"} flex flex-col justify-between items-center h-chat-container transition duration-300 ease-slide-info-bar-timing overflow-hidden`}
        >
          <Messages directChat={directChat} onReply={handleSetReplyMessage} />

          <TypeMessageBar
            directChat={directChat}
            replyMessage={replyMessage}
            setReplyMessage={handleSetReplyMessage}
          />
        </div>
      </div>
      <InfoBar friendInfo={friendInfo} />
    </div>
  )
}

type TDirectChatboxProps = {
  directChatId: number
}

export const DirectChatbox = ({ directChatId }: TDirectChatboxProps) => {
  const { directChat } = useAppSelector(({ messages }) => messages)
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(fetchDirectChatThunk(directChatId))
  }, [])

  return (
    directChatId &&
    directChat && (
      <VoicePlayerProvider>
        <Main directChat={directChat} />
      </VoicePlayerProvider>
    )
  )
}
