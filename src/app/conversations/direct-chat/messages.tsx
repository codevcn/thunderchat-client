"use client"

import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useRef, useState, useEffect, memo } from "react"
import { fetchDirectMessagesThunk } from "@/redux/messages/messages.thunk"
import type { TDirectMessage, TSticker, TUserWithoutPassword } from "@/utils/types/be-api"
import { Spinner } from "@/components/materials/spinner"
import { EMessageTypes, EPaginations, ESortTypes } from "@/utils/enums"
import { ScrollToBottomMessageBtn } from "../scroll-to-bottom-msg-btn"
import { createPortal } from "react-dom"
import { useUser } from "@/hooks/user"
import { pushNewMessages, updateMessages } from "@/redux/messages/messages.slice"
import { displayMessageStickyTime } from "@/utils/date-time"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import type { TDirectChatData } from "@/utils/types/be-api"
import type { TMsgSeenListenPayload } from "@/utils/types/socket"
import type { TStateDirectMessage } from "@/utils/types/global"
import { Message } from "./message"
import { toast } from "sonner"
import { expressionService } from "@/services/expression.service"
import Image from "next/image"
import { chattingService } from "@/services/chatting.service"
import { CustomTooltip } from "@/components/materials"

const SCROLL_ON_MESSAGES_THRESHOLD: number = 100
const SHOW_SCROLL_BTN_THRESHOLD: number = 250

type TNoMessagesYetProps = {
  directChat: TDirectChatData
  user: TUserWithoutPassword
}

const NoMessagesYet = ({ directChat, user }: TNoMessagesYetProps) => {
  const [greetingSticker, setGreetingSticker] = useState<TSticker | null>(null)
  const { id: directChatId, recipientId, creatorId } = directChat
  const tempFlagUseEffectRef = useRef<boolean>(true)

  const fetchRandomSticker = async () => {
    await expressionService
      .fetchGreetingSticker()
      .then((sticker) => {
        setGreetingSticker(sticker)
      })
      .catch((error) => {
        toast.error(axiosErrorHandler.handleHttpError(error).message)
      })
  }

  const sendGreetingSticker = () => {
    if (greetingSticker) {
      chattingService.sendMessage(
        EMessageTypes.STICKER,
        {
          receiverId: user.id === recipientId ? creatorId : recipientId,
          content: greetingSticker.imageUrl,
          directChatId: directChatId,
          token: chattingService.getMessageToken(),
          timestamp: new Date(),
        },
        (data) => {
          if ("success" in data && data.success) {
            chattingService.setAcknowledgmentFlag(true)
            chattingService.recursiveSendingQueueMessages()
          } else if ("isError" in data && data.isError) {
            console.log(">>> error in data:", data)
            toast.error("Error when sending message")
          }
        }
      )
    }
  }

  useEffect(() => {
    if (tempFlagUseEffectRef.current) {
      tempFlagUseEffectRef.current = false
      fetchRandomSticker()
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center gap-1 m-auto text-center text-base">
      <p className="font-bold w-fit text-lg">No messages here yet...</p>
      <p className="w-fit">Send a message or tap on the greeting below.</p>
      {greetingSticker && (
        <CustomTooltip title="Send a greeting sticker">
          <div className="mt-3 cursor-pointer" onClick={sendGreetingSticker}>
            <Image
              src={greetingSticker.imageUrl}
              alt={greetingSticker.stickerName}
              width={150}
              height={150}
            />
          </div>
        </CustomTooltip>
      )}
    </div>
  )
}

type TMappedMessagesProps = {
  messages: TStateDirectMessage[]
  user: TUserWithoutPassword
  onReply: (msg: TStateDirectMessage) => void
}

const MappedMessages = ({ messages, user, onReply }: TMappedMessagesProps) => {
  console.log("📝 [UI] MappedMessages - messages array:", messages)
  // Sắp xếp lại mảng messages theo id tăng dần
  return [...messages]
    .sort((a, b) => a.id - b.id)
    .map((message, index, arr) => {
      const stickyTime = displayMessageStickyTime(message.createdAt, arr[index - 1]?.createdAt)
      let replyTo = message.replyTo
      return (
        <Message
          message={{ ...message, replyTo }}
          key={message.id}
          user={user}
          stickyTime={stickyTime}
          onReply={onReply}
        />
      )
    })
}

type TMessagesProps = {
  directChat: TDirectChatData
  onReply: (msg: TStateDirectMessage) => void
}

type TMessagesLoadingState = "loading-messages"

type TUnreadMessages = {
  count: number
  firstUnreadOffsetTop: number
}

export const Messages = memo(({ directChat, onReply }: TMessagesProps) => {
  const { id: directChatId, recipientId, creatorId, lastSentMessageId } = directChat
  const { directMessages: messages, fetchedMsgs } = useAppSelector(({ messages }) => messages)
  const [loading, setLoading] = useState<TMessagesLoadingState>()
  const user = useUser()!
  const messagesContainer = useRef<HTMLDivElement>(null) // Tham chiếu đến phần tử chứa danh sách tin nhắn
  const hasMoreMessages = useRef<boolean>(true) // Biến để kiểm tra xem còn tin nhắn nào để tải thêm hay không
  const firstScrollToBottom = useRef<boolean>(true) // Biến để kiểm tra xem đã cuộn xuống dưới lần đầu hay chưa
  const finalMessageId = useRef<number>(-1) // Biến để lưu ID của tin nhắn cuối cùng trong danh sách
  const msgOffset = useRef<number>(lastSentMessageId) // Biến lưu offset để tải thêm tin nhắn
  const dispatch = useAppDispatch()
  const tempFlagUseEffectRef = useRef<boolean>(true)
  const messagesPreCount = useRef<number>(0) // Biến để lưu số lượng tin nhắn trước đó trong danh sách
  const unreadMessagesRef = useRef<TUnreadMessages>({ count: 0, firstUnreadOffsetTop: -1 }) // Biến để lưu thông tin về tin nhắn chưa đọc

  // Xử lý cuộn xuống dưới khi nhấn nút
  const scrollToBottomMessage = () => {
    const msgsContainerEle = messagesContainer.current
    if (msgsContainerEle) {
      msgsContainerEle.scrollTo({
        top: msgsContainerEle.scrollHeight - msgsContainerEle.clientHeight - 100,
        behavior: "instant",
      })
      msgsContainerEle.scrollTo({
        top: msgsContainerEle.scrollHeight,
        behavior: "smooth",
      })
    }
  }

  // Xử lý cuộn xuống dưới khi danh sách tin nhắn thay đổi
  const scrollToBottomOnMessages = () => {
    if (messages && messages.length > 0) {
      const msgsContainerEle = messagesContainer.current
      if (msgsContainerEle) {
        if (firstScrollToBottom.current) {
          // Cuộn xuống dưới khi lần đầu tiên tải tin nhắn
          firstScrollToBottom.current = false
          msgsContainerEle.scrollTo({
            top: msgsContainerEle.scrollHeight,
            behavior: "instant",
          })
          // Lưu ID của tin nhắn cuối cùng
        }
        const finalMessageData = messages[messages.length - 1]
        if (finalMessageId.current !== finalMessageData.id) {
          // Chỉ cuộn xuống dưới khi có tin nhắn mới từ user hoặc friend
          finalMessageId.current = finalMessageData.id
          if (
            msgsContainerEle.scrollTop + msgsContainerEle.clientHeight >
            msgsContainerEle.scrollHeight - SCROLL_ON_MESSAGES_THRESHOLD
          ) {
            // Cuộn khi màn hình chỉ đang cách mép dưới 100px
            msgsContainerEle.scrollTo({
              top: msgsContainerEle.scrollHeight,
              behavior: "smooth",
            })
          } else if (finalMessageData.authorId === user.id) {
            // Cuộn khi người dùng gửi tin nhắn
            msgsContainerEle.scrollTo({
              top: msgsContainerEle.scrollHeight,
              behavior: "smooth",
            })
          }
        }
      }
    }
  }

  // Thiết lập mốc thời gian để lấy tin nhắn, nếu không có tin nhắn nào thì lấy thời gian hiện tại
  const initMessageOffset = () => {
    if (messages && messages.length > 0) {
      msgOffset.current = messages[0].id
    }
  }

  const fetchMessages = async (directChatId: number, msgOffset: number, isFirstTime: boolean) => {
    const msgsContainerEle = messagesContainer.current
    if (!msgsContainerEle) return
    setLoading("loading-messages")
    const scrollHeightBefore = msgsContainerEle.scrollHeight // Chiều cao trước khi thêm
    const scrollTopBefore = msgsContainerEle.scrollTop // Vị trí cuộn từ top
    dispatch(
      fetchDirectMessagesThunk({
        directChatId,
        msgOffset,
        limit: EPaginations.DIRECT_MESSAGES_PAGE_SIZE,
        sortType: ESortTypes.ASC,
        isFirstTime,
      })
    )
      .unwrap()
      .then((result) => {
        if (result) {
          hasMoreMessages.current = result.hasMoreMessages
        }
      })
      .catch((error) => {
        toast.error(axiosErrorHandler.handleHttpError(error).message)
      })
      .finally(() => {
        const scrollHeightAfter = msgsContainerEle.scrollHeight // Chiều cao sau khi thêm
        const heightAdded = scrollHeightAfter - scrollHeightBefore // Chênh lệch chiều cao
        // Giữ nguyên khoảng cách từ lúc bắt đầu cuộn trước khi thêm các tin nhắn mới
        msgsContainerEle.scrollTop = scrollTopBefore + heightAdded
        setLoading(undefined)
      })
  }

  // Hàm xử lý việc cuộn đoạn chat lên tin nhắn trên cùng
  const handleScrollToTopMessage = (e: Event) => {
    const messagesContainer = e.currentTarget as HTMLElement
    if (
      messagesContainer.scrollHeight - messagesContainer.scrollTop <
      messagesContainer.clientHeight + SHOW_SCROLL_BTN_THRESHOLD
    ) {
      eventEmitter.emit(EInternalEvents.SCROLL_TO_BOTTOM_MSG_UI)
    } else {
      eventEmitter.emit(EInternalEvents.SCROLL_OUT_OF_BOTTOM)
      // Check if the user scrolled to the top then fetch more messages
      if (messagesContainer.scrollTop < 10 && hasMoreMessages.current && !loading) {
        fetchMessages(directChatId, msgOffset.current, false)
      }
    }
  }

  const scrollToFirstUnreadMessage = () => {
    const msgsContainerEle = messagesContainer.current
    if (msgsContainerEle) {
      msgsContainerEle.scrollTo({
        top: unreadMessagesRef.current.firstUnreadOffsetTop - msgsContainerEle.clientHeight / 2,
        behavior: "instant",
      })
    }
  }

  // Cuộn đến cuối danh sách tin nhắn hoặc cuộn đến tin nhắn đầu tiên chưa đọc
  const handleScrollToBottomMsg = () => {
    const unreadMessages = unreadMessagesRef.current
    if (unreadMessages.count > 0 && unreadMessages.firstUnreadOffsetTop !== -1) {
      scrollToFirstUnreadMessage()
    } else {
      scrollToBottomMessage()
    }
  }

  // Xử lý sự kiện gửi tin nhắn từ đối phương
  const listenSendDirectMessage = (newMessage: TDirectMessage) => {
    console.log("📥 [Socket] Received send_message_direct:", newMessage)
    const { id } = newMessage
    dispatch(pushNewMessages([newMessage]))
    clientSocket.setMessageOffset(id, directChatId)
  }

  // Xử lý sự kiện kết nối lại từ server
  const handleRecoverdConnection = (newMessages: TDirectMessage[]) => {
    if (newMessages && newMessages.length > 0) {
      dispatch(pushNewMessages(newMessages))
      const { id } = newMessages[newMessages.length - 1]
      clientSocket.setMessageOffset(id, directChatId)
    }
  }

  // Xử lý tin nhắn chưa đọc nằm ngoài vùng nhìn thấy
  const handleUnreadMsgOutOfVisibleView = (
    messagesContainer: HTMLElement,
    unreadMessage: HTMLElement
  ) => {
    if (unreadMessage.offsetTop > messagesContainer.scrollTop + messagesContainer.clientHeight) {
      // Nếu tin nhắn chưa đọc nằm ngoài vùng nhìn thấy
      eventEmitter.emit(EInternalEvents.UNREAD_MESSAGES_COUNT, unreadMessagesRef.current.count)
    }
  }

  // Kiểm tra và setup tin nhắn chưa đọc khi dữ liệu danh sách tin nhắn thay đổi
  const checkUnreadMessage = () => {
    const msgsContainerEle = messagesContainer.current
    if (
      msgsContainerEle &&
      messages &&
      messages.length > 0 &&
      messages.length > messagesPreCount.current
    ) {
      const unreadMessageEles =
        msgsContainerEle.querySelectorAll<HTMLElement>(".QUERY-unread-message")
      if (unreadMessageEles && unreadMessageEles.length > 0) {
        const unreadMessages = unreadMessagesRef.current
        unreadMessages.firstUnreadOffsetTop = unreadMessageEles[0].offsetTop
        unreadMessages.count = unreadMessageEles.length
        for (const msgEle of unreadMessageEles) {
          handleUnreadMsgInVisibleView(
            msgsContainerEle,
            msgEle,
            parseInt(msgEle.getAttribute("data-msg-id")!)
          )
          handleUnreadMsgOutOfVisibleView(msgsContainerEle, msgEle)
        }
      }
    }
  }

  // Xử lý tin nhắn chưa đọc khi cuộn vào vùng nhìn thấy
  const handleUnreadMsgInVisibleView = (
    messagesContainer: HTMLElement,
    unreadMessage: HTMLElement,
    msgId: number
  ) => {
    if (
      unreadMessage.offsetTop + unreadMessage.offsetHeight <
      messagesContainer.scrollTop + messagesContainer.clientHeight
    ) {
      // Nếu tin nhắn chưa đọc nằm trong vùng nhìn thấy
      unreadMessage.classList.remove("QUERY-unread-message")
      const unreadMessages = unreadMessagesRef.current
      if (unreadMessages.count > 0) unreadMessages.count -= 1
      unreadMessages.firstUnreadOffsetTop = -1
      eventEmitter.emit(EInternalEvents.UNREAD_MESSAGES_COUNT, unreadMessages.count)
      clientSocket.socket.emit(ESocketEvents.message_seen_direct, {
        messageId: msgId,
        receiverId: recipientId === user.id ? creatorId : recipientId,
      })
    }
  }

  // Hàm xử lý việc cuộn các tin nhắn vào vùng nhìn thấy
  const handleScrollMsgIntoVisibleView = (e: Event) => {
    const msgsContainerEle = e.currentTarget as HTMLElement
    const unreadMessages = msgsContainerEle.querySelectorAll<HTMLElement>(".QUERY-unread-message")
    if (unreadMessages && unreadMessages.length > 0) {
      for (const msg of unreadMessages) {
        handleUnreadMsgInVisibleView(
          msgsContainerEle,
          msg,
          parseInt(msg.getAttribute("data-msg-id")!)
        )
      }
    }
  }

  // Hàm xử lý việc cuộn đoạn chat
  const handleScrollMsgsContainer = (e: Event) => {
    handleScrollMsgIntoVisibleView(e)
    handleScrollToTopMessage(e)
  }

  // Cập nhật số lượng tin nhắn sau khi dữ liệu danh sách tin nhắn thay đổi
  const updateMessagesCount = () => {
    messagesPreCount.current = messages?.length || 0
  }

  // Xử lý sự kiện đã đọc tin nhắn từ đối phương
  const handleMessageSeen = ({ messageId, status }: TMsgSeenListenPayload) => {
    dispatch(updateMessages([{ msgId: messageId, msgUpdates: { status } }]))
  }

  useEffect(() => {
    initMessageOffset()
    requestAnimationFrame(() => {
      scrollToBottomOnMessages()
      checkUnreadMessage()
      updateMessagesCount()
    })
  }, [messages])

  useEffect(() => {
    if (tempFlagUseEffectRef.current) {
      tempFlagUseEffectRef.current = false
      if (!messages || messages.length === 0) {
        fetchMessages(directChatId, msgOffset.current, true)
      }
    }
    messagesContainer.current?.addEventListener("scroll", handleScrollMsgsContainer)
    eventEmitter.on(EInternalEvents.SCROLL_TO_BOTTOM_MSG_ACTION, handleScrollToBottomMsg)
    clientSocket.socket.on(ESocketEvents.send_message_direct, listenSendDirectMessage)
    clientSocket.socket.on(ESocketEvents.recovered_connection, handleRecoverdConnection)
    clientSocket.socket.on(ESocketEvents.message_seen_direct, handleMessageSeen)
    return () => {
      messagesContainer.current?.removeEventListener("scroll", handleScrollMsgsContainer)
      eventEmitter.off(EInternalEvents.SCROLL_TO_BOTTOM_MSG_ACTION, handleScrollToBottomMsg)
      clientSocket.socket.removeListener(
        ESocketEvents.recovered_connection,
        handleRecoverdConnection
      )
      clientSocket.socket.removeListener(ESocketEvents.send_message_direct, listenSendDirectMessage)
      clientSocket.socket.removeListener(ESocketEvents.message_seen_direct, handleMessageSeen)
    }
  }, [])

  return (
    <>
      {createPortal(<ScrollToBottomMessageBtn />, document.body)}

      <div
        className="flex flex-col items-center w-full h-full overflow-y-scroll overflow-x-hidden STYLE-styled-scrollbar px-3 box-border"
        ref={messagesContainer}
      >
        {fetchedMsgs ? (
          messages && messages.length > 0 ? (
            <div
              id="STYLE-user-messages"
              className="flex flex-col justify-end items-center py-3 box-border w-messages-list gap-y-2"
            >
              {hasMoreMessages.current && loading === "loading-messages" && (
                <div className="flex w-full justify-center">
                  <Spinner size="small" />
                </div>
              )}
              <MappedMessages messages={messages} user={user} onReply={onReply} />
            </div>
          ) : (
            <NoMessagesYet directChat={directChat} user={user} />
          )
        ) : (
          <div className="m-auto w-11 h-11">
            <Spinner size="medium" />
          </div>
        )}
      </div>
    </>
  )
})
