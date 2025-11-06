"use client"

import { CustomAvatar, CustomTooltip, toast } from "@/components/materials"
import { IconButton } from "@/components/materials/icon-button"
import { Messages } from "./group-messages"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useEffect, useState, useRef } from "react"
import { Search, MoreVertical, Pin, Menu } from "lucide-react"
import { InfoBar } from "./info-bar"
import { openInfoBar } from "@/redux/conversations/conversations.slice"
import { TypeMessageBar } from "./type-message-bar"
import { clientSocket } from "@/utils/socket/client-socket"
import { EMessagingEvents } from "@/utils/socket/events"
import type { TGroupChatData, TUserWithProfile } from "@/utils/types/be-api"
import { VoiceMessagePlayer } from "../../../components/voice-message/voice-message-player-props"
import { VoicePlayerProvider, useVoicePlayer } from "@/contexts/voice-player.context"
import { useAudioMessages } from "@/hooks/voice-messages"
import type { TStateMessage } from "@/utils/types/global"
import {
  resetAllChatData,
  setGroupChat,
  setGroupChatPermissions,
} from "@/redux/messages/messages.slice"
import type { TPinGroupMessageEventData } from "@/utils/types/socket"
import { pinService } from "@/services/pin.service"
import { renderMessageContent } from "./pin-message"
import { CanceledError } from "axios"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { groupChatService } from "@/services/group-chat.service"
import { toaster } from "@/utils/toaster"
import { setOpenConvsList } from "@/redux/layout/layout.slice"
import { VoiceCall } from "../direct-chat/call"

const TYPING_TIMEOUT: number = 5000

type TTypingIndicatorProps = {
  users: TTypingUsers["typingUsers"]
}

const TypingIndicator = ({ users }: TTypingIndicatorProps) => {
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
      <div>
        {users.length > 1 ? (
          <div className="flex items-center gap-0.5">
            {users.map((user) => (
              <CustomAvatar
                key={user.id}
                src={user.Profile.avatar}
                imgSize={16}
                fallbackClassName="bg-regular-violet-cl text-xs"
                fallback={user.Profile.fullName[0].toUpperCase()}
              />
            ))}
          </div>
        ) : (
          <span>
            <span>{users[0].Profile.fullName}</span> is typing...
          </span>
        )}
      </div>
    </div>
  )
}

type TTypingUsers = {
  isTyping: boolean
  typingUsers: TUserWithProfile[]
}

const initialTypingUsers: TTypingUsers = {
  isTyping: false,
  typingUsers: [],
}

type THeaderProps = {
  infoBarIsOpened: boolean
  onOpenInfoBar: (open: boolean) => void
  groupChat: TGroupChatData
}

const Header = ({ infoBarIsOpened, onOpenInfoBar, groupChat }: THeaderProps) => {
  const { avatarUrl, id: groupChatId, name: groupChatName } = groupChat
  const [typingUsers, setTypingUsers] = useState<TTypingUsers>(initialTypingUsers)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dispatch = useAppDispatch()

  const handleOpenConvsList = () => {
    dispatch(setOpenConvsList(true))
  }

  const handleTypingMessage = (typing: boolean, groupChatId: number, user: TUserWithProfile) => {
    if (groupChatId !== groupChatId) return
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    setTypingUsers((prev) => {
      const currentTypingUsers = prev.typingUsers
      if (currentTypingUsers.some((u) => u.id === user.id)) {
        return {
          ...prev,
          isTyping: true,
        }
      }
      return {
        isTyping: true,
        typingUsers: [...currentTypingUsers, user],
      }
    })
    if (typing) {
      typingTimeoutRef.current = setTimeout(() => {
        setTypingUsers((prev) => {
          return {
            ...prev,
            isTyping: false,
          }
        })
      }, TYPING_TIMEOUT)
    }
  }

  const resetTyping = () => {
    setTypingUsers(initialTypingUsers)
  }

  useEffect(() => {
    resetTyping()
    clientSocket.socket.on(EMessagingEvents.typing_group, handleTypingMessage)
    return () => {
      clientSocket.socket.removeListener(EMessagingEvents.typing_group, handleTypingMessage)
    }
  }, [groupChatId])

  return (
    <div className="flex justify-between gap-2 px-6 py-1.5 bg-regular-dark-gray-cl w-full box-border h-header">
      <div className="flex gap-2 items-center">
        <div className="block screen-medium-chatting:hidden pr-2">
          <IconButton onClick={handleOpenConvsList} className="text-regular-icon-cl">
            <Menu size={28} />
          </IconButton>
        </div>
        <CustomAvatar
          src={avatarUrl}
          imgSize={45}
          fallbackClassName="bg-regular-violet-cl text-2xl"
          fallback={groupChatName[0].toUpperCase()}
        />
        <div className="flex flex-col justify-center gap-2">
          <h3 className="text-lg font-bold w-fit text-white leading-none">{groupChatName}</h3>
          {typingUsers.isTyping ? (
            <TypingIndicator users={typingUsers.typingUsers} />
          ) : (
            groupChat.Members && (
              <div className="text-xs text-regular-text-secondary-cl">
                <span>{groupChat.Members.length}</span> members
              </div>
            )
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
        <VoiceCall
          canSend={true} // 1. Truyền quyền 'canSend' từ Redux
          groupChat={groupChat} // 2. Truyền groupChat VÀ đánh dấu nó là group
        />
        {/* <CustomTooltip title="Call" placement="bottom" align="end">
          <IconButton className="flex justify-center items-center text-regular-icon-cl w-[40px] h-[40px]">
            <Phone />
          </IconButton>
        </CustomTooltip> */}

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
  groupChat: TGroupChatData
}

const Main = ({ groupChat }: TMainProps) => {
  const { id: groupChatId } = groupChat
  const { infoBarIsOpened } = useAppSelector(({ conversations }) => conversations)
  const dispatch = useAppDispatch()
  const { showPlayer } = useVoicePlayer()
  const [replyMessage, setReplyMessage] = useState<TStateMessage | null>(null)
  // Thêm state quản lý pinned
  const [showPinnedModal, setShowPinnedModal] = useState(false)
  const [pinnedMessages, setPinnedMessages] = useState<TStateMessage[]>([])

  // Ref để luôn lấy groupChat.id mới nhất trong handler
  const groupChatIdRef = useRef<number | undefined>(groupChat?.id)
  const fetchPinnedTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const removeDeletedMessagesFromPinnedMessages = (messages: TStateMessage[]) => {
    return messages.filter((message) => !message.isDeleted)
  }

  const resetAllChatDataHandler = () => {
    dispatch(resetAllChatData())
  }

  const joinGroupChatRoom = () => {
    clientSocket.socket.emit(EMessagingEvents.join_group_chat_room, { groupChatId }, () => {})
  }

  const fetchGroupChatPermissions = async () => {
    try {
      const res = await groupChatService.fetchGroupChatPermissions(groupChatId)
      const { permissions } = res
      dispatch(
        setGroupChatPermissions({
          sendMessage: permissions.sendMessage,
          pinMessage: permissions.pinMessage,
          shareInviteCode: permissions.shareInviteCode,
          updateInfo: permissions.updateInfo,
        })
      )
    } catch (error) {
      toaster.error(axiosErrorHandler.handleHttpError(error).message)
    }
  }

  // Đăng ký listener pin_message một lần duy nhất khi mount, remove toàn bộ listener cũ trước khi đăng ký mới
  useEffect(() => {
    // Remove toàn bộ listener cũ trước khi đăng ký mới
    clientSocket.socket.off(EMessagingEvents.pin_message_group)

    const handlePinMessage = (data: TPinGroupMessageEventData) => {
      const currentChatId = groupChatIdRef.current
      // Kiểm tra xem event có thuộc về chat hiện tại không
      if (data.groupChatId === currentChatId) {
        // Clear timeout cũ nếu có
        if (fetchPinnedTimeoutRef.current) {
          clearTimeout(fetchPinnedTimeoutRef.current)
        }
        // Debounce fetch để tránh fetch quá nhiều lần
        fetchPinnedTimeoutRef.current = setTimeout(() => {
          pinService
            .getPinnedMessages(undefined, data.groupChatId)
            .then((convertedMessages) => {
              setPinnedMessages(removeDeletedMessagesFromPinnedMessages(convertedMessages))
            })
            .catch(() => {
              setPinnedMessages([])
            })
        }, 500) // Delay 500ms
      }
    }

    clientSocket.socket.on(EMessagingEvents.pin_message_group, handlePinMessage)
    return () => {
      resetAllChatDataHandler()
      clientSocket.socket.off(EMessagingEvents.pin_message_group, handlePinMessage)
      // Cleanup timeout
      if (fetchPinnedTimeoutRef.current) {
        clearTimeout(fetchPinnedTimeoutRef.current)
      }
    }
  }, [])

  // Fetch pinned messages ban đầu khi vào phòng chat
  useEffect(() => {
    groupChatIdRef.current = groupChatId
    joinGroupChatRoom()
    fetchGroupChatPermissions()
    if (groupChatId) {
      pinService
        .getPinnedMessages(undefined, groupChatId)
        .then((convertedMessages) => {
          setPinnedMessages(removeDeletedMessagesFromPinnedMessages(convertedMessages))
        })
        .catch(() => setPinnedMessages([]))
    }
  }, [groupChatId])

  // Add logging for setReplyMessage
  const handleSetReplyMessage = (msg: TStateMessage | null) => {
    setReplyMessage(msg)
  }

  const handleOpenInfoBar = (open: boolean) => {
    dispatch(openInfoBar(open))
  }

  // Hook để quản lý danh sách audio messages
  useAudioMessages()

  // Lấy tin nhắn ghim mới nhất (API đã sort đúng thứ tự mới nhất đến cũ nhất)
  const latestPinned = pinnedMessages[0] || null

  return (
    <div className="screen-medium-chatting:w-chat-n-info-container flex w-full box-border overflow-hidden relative">
      <div className="flex flex-col items-center w-full box-border h-screen bg-no-repeat bg-transparent bg-cover bg-center relative">
        <Header
          infoBarIsOpened={infoBarIsOpened}
          onOpenInfoBar={handleOpenInfoBar}
          groupChat={groupChat}
        />

        {/* Box pinned messages ngay dưới header */}
        {pinnedMessages.length > 0 && (
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
                groupChat={groupChat}
                onReply={handleSetReplyMessage}
                pinnedMessages={pinnedMessages}
                setPinnedMessages={setPinnedMessages}
                showPinnedModal={showPinnedModal}
                setShowPinnedModal={setShowPinnedModal}
              />
            </div>
            <div className="w-full flex justify-center">
              <TypeMessageBar
                groupChat={groupChat}
                replyMessage={replyMessage}
                setReplyMessage={handleSetReplyMessage}
              />
            </div>
          </div>
        </div>
      </div>
      <InfoBar />
    </div>
  )
}

let fetchGroupChatAbortController: AbortController = new AbortController()

export const GroupChatbox = () => {
  const { groupChat } = useAppSelector(({ messages }) => messages)
  const dispatch = useAppDispatch()

  const handleFetchGroupChat = (groupChatId: number) => {
    fetchGroupChatAbortController.abort()
    fetchGroupChatAbortController = new AbortController()
    groupChatService
      .fetchGroupChat(groupChatId, fetchGroupChatAbortController.signal)
      .then((groupChat) => {
        dispatch(resetAllChatData())
        requestAnimationFrame(() => {
          dispatch(setGroupChat(groupChat))
        })
      })
      .catch((err) => {
        if (!(err instanceof CanceledError)) {
          toast.error(axiosErrorHandler.handleHttpError(err).message)
        }
      })
  }

  useEffect(() => {
    eventEmitter.on(EInternalEvents.FETCH_GROUP_CHAT, handleFetchGroupChat)
    return () => {
      eventEmitter.off(EInternalEvents.FETCH_GROUP_CHAT, handleFetchGroupChat)
      fetchGroupChatAbortController.abort()
    }
  }, [])

  return (
    groupChat && (
      <VoicePlayerProvider>
        <Main groupChat={groupChat} />
      </VoicePlayerProvider>
    )
  )
}
