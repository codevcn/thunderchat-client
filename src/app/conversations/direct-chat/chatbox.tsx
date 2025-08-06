"use client"

import { dev_test_values } from "../../../../temp/test"

import { CustomAvatar, CustomTooltip, toast } from "@/components/materials"
import { IconButton } from "@/components/materials/icon-button"
import { Messages } from "./messages"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useEffect, useMemo, useState, useRef } from "react"
import { Search, Phone, MoreVertical, Pin } from "lucide-react"
import { InfoBar } from "./info-bar"
import { openInfoBar } from "@/redux/conversations/conversations.slice"
import { setLastSeen } from "@/utils/helpers"
import { TypeMessageBar } from "./type-message-bar"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"
import type { TDirectChatData, TUserWithProfile } from "@/utils/types/be-api"
import { VoiceMessagePlayer } from "../../../components/voice-message/voice-message-player-props"
import { VoicePlayerProvider, useVoicePlayer } from "@/contexts/voice-player.context"
import { useAudioMessages } from "@/hooks/voice-messages"
import { useUser } from "@/hooks/user"
import type { TStateMessage } from "@/utils/types/global"
import { resetAllChatData, setDirectChat } from "@/redux/messages/messages.slice"
import type { TPinMessageEventData } from "@/utils/types/socket"
import { pinService } from "@/services/pin.service"
import { directChatService } from "@/services/direct-chat.service"
import { renderMessageContent } from "./pin-message"
import { CanceledError } from "axios"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"

const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-300">
      <div className="flex gap-1">
        <div className="STYLE-typing-message-dot-animation w-1 h-1 bg-gray-400 rounded-full"></div>
        <div
          className="STYLE-typing-message-dot-animation w-1 h-1 bg-gray-400 rounded-full"
          style={{ animationDelay: "0.2s" }}
        ></div>
        <div
          className="STYLE-typing-message-dot-animation w-1 h-1 bg-gray-400 rounded-full"
          style={{ animationDelay: "0.4s" }}
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
  canSend: boolean | null
  directChat: TDirectChatData
}

const Header = ({
  infoBarIsOpened,
  onOpenInfoBar,
  friendInfo,
  canSend,
  directChat,
}: THeaderProps) => {
  const { Profile } = friendInfo
  const { id } = directChat
  const [isTyping, setIsTyping] = useState<boolean>(false)

  const handleTypingMessage = (typing: boolean, directChatId: number) => {
    if (directChatId !== id) return
    setIsTyping(typing)
  }

  const resetTyping = () => {
    setIsTyping(false)
  }

  useEffect(() => {
    resetTyping()
    clientSocket.socket.on(ESocketEvents.typing_direct, handleTypingMessage)
    return () => {
      clientSocket.socket.removeListener(ESocketEvents.typing_direct, handleTypingMessage)
    }
  }, [id])

  return (
    <div className="flex justify-between gap-2 px-6 py-1.5 bg-regular-dark-gray-cl w-full box-border h-header">
      <div className="flex gap-2">
        <CustomAvatar
          src={Profile.avatar}
          imgSize={45}
          fallbackClassName="bg-regular-violet-cl text-2xl"
          fallback={Profile.fullName[0].toUpperCase()}
        />
        <div className="flex flex-col justify-center gap-2">
          <h3 className="text-lg font-bold w-fit text-white leading-none">{Profile.fullName}</h3>
          {isTyping ? (
            <TypingIndicator />
          ) : (
            <div className="text-xs text-regular-text-secondary-cl">
              {"Last seen " + setLastSeen(dev_test_values.user_1.lastOnline)}
            </div>
          )}
        </div>
      </div>

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
          <div style={canSend === false ? { opacity: 0.5, pointerEvents: "none" } : {}}>
            <IconButton
              className="flex justify-center items-center text-regular-icon-cl w-[40px] h-[40px]"
              onClick={
                canSend === false
                  ? undefined
                  : () => {
                      /* logic gọi */
                    }
              }
            >
              <Phone />
            </IconButton>
          </div>
        </CustomTooltip>

        <CustomTooltip title="More actions" placement="bottom" align="end">
          <div>
            <IconButton
              onClick={() => onOpenInfoBar(true)}
              className="flex justify-center items-center text-regular-icon-cl w-[40px] h-[40px]"
            >
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
  canSend: boolean | null
}

const Main = ({ directChat, canSend }: TMainProps) => {
  const { Recipient, Creator } = directChat
  const user = useUser()!
  const { infoBarIsOpened } = useAppSelector(({ conversations }) => conversations)
  const dispatch = useAppDispatch()
  const { showPlayer } = useVoicePlayer()
  const [replyMessage, setReplyMessage] = useState<TStateMessage | null>(null)
  // Thêm state quản lý pinned
  const [showPinnedModal, setShowPinnedModal] = useState(false)
  const [pinnedMessages, setPinnedMessages] = useState<TStateMessage[]>([])

  // Ref để luôn lấy directChat.id mới nhất trong handler
  const directChatIdRef = useRef<number | undefined>(directChat?.id)
  const fetchPinnedTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetAllChatDataHandler = () => {
    dispatch(resetAllChatData())
  }

  useEffect(() => {
    directChatIdRef.current = directChat?.id
  }, [directChat?.id])

  // Đăng ký listener pin_message một lần duy nhất khi mount, remove toàn bộ listener cũ trước khi đăng ký mới
  useEffect(() => {
    // Remove toàn bộ listener cũ trước khi đăng ký mới
    clientSocket.socket.off(ESocketEvents.pin_message)
    const handlePinMessage = (data: TPinMessageEventData) => {
      const currentChatId = directChatIdRef.current

      // Kiểm tra xem event có thuộc về chat hiện tại không
      if (data.directChatId === currentChatId) {
        // Clear timeout cũ nếu có
        if (fetchPinnedTimeoutRef.current) {
          clearTimeout(fetchPinnedTimeoutRef.current)
        }

        // Debounce fetch để tránh fetch quá nhiều lần
        fetchPinnedTimeoutRef.current = setTimeout(() => {
          pinService
            .getPinnedMessages(data.directChatId)
            .then((convertedMessages) => {
              setPinnedMessages(convertedMessages)
            })
            .catch(() => {
              setPinnedMessages([])
            })
        }, 500) // Delay 500ms
      }
    }
    clientSocket.socket.on(ESocketEvents.pin_message, handlePinMessage)
    return () => {
      resetAllChatDataHandler()
      clientSocket.socket.off(ESocketEvents.pin_message, handlePinMessage)
      // Cleanup timeout
      if (fetchPinnedTimeoutRef.current) {
        clearTimeout(fetchPinnedTimeoutRef.current)
      }
    }
  }, [])

  // Fetch pinned messages ban đầu khi vào phòng chat
  useEffect(() => {
    if (directChat?.id) {
      pinService
        .getPinnedMessages(directChat.id)
        .then((convertedMessages) => {
          setPinnedMessages(convertedMessages)
        })
        .catch(() => setPinnedMessages([]))
    }
  }, [directChat?.id])

  // Add logging for setReplyMessage
  const handleSetReplyMessage = (msg: TStateMessage | null) => {
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

  // Lấy tin nhắn ghim mới nhất (API đã sort đúng thứ tự mới nhất đến cũ nhất)
  const latestPinned = pinnedMessages[0] || null

  return (
    <div className="screen-medium-chatting:w-chat-n-info-container flex w-full box-border overflow-hidden relative">
      <div className="flex flex-col items-center w-full box-border h-screen bg-no-repeat bg-transparent bg-cover bg-center relative">
        <Header
          infoBarIsOpened={infoBarIsOpened}
          onOpenInfoBar={handleOpenInfoBar}
          friendInfo={friendInfo}
          canSend={canSend}
          directChat={directChat}
        />

        {/* Box pinned messages ngay dưới header */}
        {pinnedMessages.length > 0 && canSend !== false && (
          <div
            className={`
              w-full px-6 mt-1
              ${
                infoBarIsOpened
                  ? "screen-large-chatting:translate-x-slide-chat-container screen-large-chatting:w-msgs-container"
                  : "translate-x-0 w-full"
              }
              transition duration-300 ease-slide-info-bar-timing
            `}
          >
            <button
              className="flex items-center justify-between px-4 py-2 rounded bg-regular-dark-gray-cl hover:bg-gray-800 text-white font-semibold text-sm shadow-sm border border-gray-700 transition-colors w-full"
              onClick={() => setShowPinnedModal(true)}
            >
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4" />
                <div className="flex flex-col text-left">
                  <div className="flex flex-row items-center gap-2">
                    <span className="text-xs text-white font-medium truncate max-w-[90px]">
                      {latestPinned?.Author?.Profile?.fullName || "Người gửi"}
                    </span>
                    <span className="text-xs text-gray-300 truncate max-w-[180px]">
                      {/* Hiển thị nội dung tin nhắn ghim mới nhất */}
                      {latestPinned && renderMessageContent(latestPinned)}
                    </span>
                  </div>
                </div>
              </div>
              <span className="bg-gray-700 text-white rounded-full px-2 text-xs font-bold">
                {pinnedMessages.length}
              </span>
            </button>
          </div>
        )}

        {/* Chỉ hiển thị chat content khi có thể gửi tin nhắn */}
        <div
          className={`${infoBarIsOpened ? "screen-large-chatting:translate-x-slide-chat-container screen-large-chatting:w-msgs-container" : "translate-x-0 w-full"} flex flex-col justify-between items-center h-chat-container transition duration-300 ease-slide-info-bar-timing overflow-hidden relative`}
        >
          {/* Voice Player floating layer */}
          {showPlayer && (
            <div
              className="absolute top-0 left-0 right-0 z-[70] flex justify-center"
              style={{ pointerEvents: "none" }}
            >
              <div className="w-full max-w-[480px] px-4" style={{ pointerEvents: "auto" }}>
                <VoiceMessagePlayer />
              </div>
            </div>
          )}
          <div className="flex flex-col flex-1 w-full justify-between h-0">
            <div className="flex-1 w-full overflow-y-auto">
              <Messages
                directChat={directChat}
                onReply={handleSetReplyMessage}
                pinnedMessages={pinnedMessages}
                setPinnedMessages={setPinnedMessages}
                showPinnedModal={showPinnedModal}
                setShowPinnedModal={setShowPinnedModal}
                canSend={canSend}
              />
            </div>
            <div className="w-full flex justify-center">
              <TypeMessageBar
                directChat={directChat}
                replyMessage={replyMessage}
                setReplyMessage={handleSetReplyMessage}
                canSend={canSend}
              />
            </div>
          </div>
        </div>
      </div>
      <InfoBar friendInfo={friendInfo} directChatId={directChat.id} />
    </div>
  )
}

let fetchDirectChatAbortController: AbortController = new AbortController()

export const DirectChatbox = () => {
  const { directChat } = useAppSelector(({ messages }) => messages)
  const dispatch = useAppDispatch()
  const [canSend, setCanSend] = useState<boolean | null>(null)
  const user = useUser()

  const handleFetchDirectChat = (directChatId: number) => {
    fetchDirectChatAbortController.abort()
    fetchDirectChatAbortController = new AbortController()
    directChatService
      .fetchDirectChat(directChatId, fetchDirectChatAbortController.signal)
      .then((directChat) => {
        dispatch(setDirectChat(directChat))
      })
      .catch((err) => {
        if (!(err instanceof CanceledError)) {
          toast.error(axiosErrorHandler.handleHttpError(err).message)
        }
      })
  }

  useEffect(() => {
    eventEmitter.on(EInternalEvents.FETCH_DIRECT_CHAT, handleFetchDirectChat)
    return () => {
      fetchDirectChatAbortController.abort()
    }
  }, [])

  useEffect(() => {
    if (!directChat) return
    const receiverId =
      user?.id === directChat.recipientId ? directChat.creatorId : directChat.recipientId
    directChatService
      .checkCanSendMessage(receiverId)
      .then((result) => {
        setCanSend(result)
      })
      .catch((error) => {
        console.error("[DEBUG] Error checking canSend:", error)
        setCanSend(true) // Default to true on error
      })
  }, [directChat?.id, user?.id])

  return (
    directChat && (
      <VoicePlayerProvider>
        <Main directChat={directChat} canSend={canSend} />
      </VoicePlayerProvider>
    )
  )
}
