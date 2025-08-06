"use client"

import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useRef, useState, useEffect, memo } from "react"
import type { TGetMessagesMessage, TSticker, TUserWithoutPassword } from "@/utils/types/be-api"
import { Spinner } from "@/components/materials/spinner"
import { EChatType, EMessageTypes, EPaginations, ESortTypes } from "@/utils/enums"
import { ScrollToBottomMessageBtn } from "../scroll-to-bottom-msg-btn"
import { createPortal } from "react-dom"
import { useUser } from "@/hooks/user"
import {
  updateMessages,
  mergeMessages,
  setLastSentMessage,
  resetDirectMessages,
  setFetchedMsgs,
} from "@/redux/messages/messages.slice"
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
import { PinMessageModal } from "./pin-message"
import { pinService } from "@/services/pin.service"
import { directChatService } from "@/services/direct-chat.service"
import { messageService } from "@/services/message.service"

const SCROLL_ON_MESSAGES_THRESHOLD: number = 100
const SHOW_SCROLL_BTN_THRESHOLD: number = 250

type TNoMessagesYetProps = {
  directChat: TDirectChatData
  user: TUserWithoutPassword
  canSend: boolean | null
}

const NoMessagesYet = ({ directChat, user, canSend }: TNoMessagesYetProps) => {
  const [greetingSticker, setGreetingSticker] = useState<TSticker | null>(null)
  const { recipientId, creatorId } = directChat

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
          content: `${greetingSticker.id}`,
          token: chattingService.getMessageToken(),
          timestamp: new Date(),
        },
        (data) => {
          if ("success" in data && data.success) {
            chattingService.setAcknowledgmentFlag(true)
            chattingService.recursiveSendingQueueMessages()
          } else if ("isError" in data && data.isError) {
            console.log(">>> error in data:", data)
            toast.error(data?.message || "Error when sending message")
          }
        }
      )
    }
  }

  useEffect(() => {
    fetchRandomSticker()
  }, [directChat.id])

  if (canSend === false) return null

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

type TMessagesProps = {
  directChat: TDirectChatData
  onReply: (msg: TStateDirectMessage) => void
  pinnedMessages: TStateDirectMessage[]
  setPinnedMessages: React.Dispatch<React.SetStateAction<TStateDirectMessage[]>>
  showPinnedModal: boolean
  setShowPinnedModal: React.Dispatch<React.SetStateAction<boolean>>
  canSend: boolean | null
}

type TMessagesLoadingState = "loading-messages"

type TUnreadMessages = {
  count: number
  firstUnreadMsgEle: HTMLElement | null
}

// Thêm hàm tìm đoạn id bị thiếu
function findMissingRanges(ids: number[]): [number, number][] {
  ids.sort((a, b) => a - b)
  const missing: [number, number][] = []
  for (let i = 1; i < ids.length; i++) {
    if (ids[i] - ids[i - 1] > 1) {
      missing.push([ids[i - 1] + 1, ids[i] - 1])
    }
  }
  return missing
}

export const Messages = memo(
  ({
    directChat,
    onReply: onReplyFromProps,
    pinnedMessages,
    setPinnedMessages,
    showPinnedModal,
    setShowPinnedModal,
    canSend,
  }: TMessagesProps) => {
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
    const messagesPreCount = useRef<number>(0) // Biến để lưu số lượng tin nhắn trước đó trong danh sách
    const unreadMessagesRef = useRef<TUnreadMessages>({ count: 0, firstUnreadMsgEle: null }) // Biến để lưu thông tin về tin nhắn chưa đọc
    const [pendingFillContextId, setPendingFillContextId] = useState<number | null>(null)
    const isRenderingMessages = useRef<boolean>(false)
    const readyNewMessage = useRef<TGetMessagesMessage | null>(null)

    // Thêm state lưu id cuối context
    const [contextEndId, setContextEndId] = useState<number | null>(null)

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
          }
          // Lưu ID của tin nhắn cuối cùng
          const finalMessageData = messages[messages.length - 1]
          if (finalMessageId.current !== finalMessageData.id) {
            // Nếu tin nhắn mới là PIN_NOTICE thì không cuộn xuống cuối
            if (finalMessageData.type === EMessageTypes.PIN_NOTICE) {
              finalMessageId.current = finalMessageData.id
              return
            }
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

    const fetchMessages = async (
      directChatId: number,
      msgOffset: number | undefined,
      isFirstTime: boolean
    ) => {
      if (isRenderingMessages.current) return
      isRenderingMessages.current = true
      const msgsContainerEle = messagesContainer.current
      if (!msgsContainerEle) return
      setLoading("loading-messages")
      const scrollHeightBefore = msgsContainerEle.scrollHeight // Chiều cao trước khi thêm
      const scrollTopBefore = msgsContainerEle.scrollTop // Vị trí cuộn từ top
      messageService
        .fetchDirectMessages({
          directChatId,
          msgOffset,
          limit: EPaginations.DIRECT_MESSAGES_PAGE_SIZE,
          sortType: ESortTypes.ASC,
          isFirstTime,
        })
        .then((result) => {
          hasMoreMessages.current = result.hasMoreMessages
          dispatch(mergeMessages(result.directMessages))
          dispatch(setFetchedMsgs(true))
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

    // Cuộn đến tin nhắn chưa đọc đầu tiên
    const scrollToFirstUnreadMessage = () => {
      const msgsContainerEle = messagesContainer.current
      if (msgsContainerEle) {
        msgsContainerEle.scrollTo({
          top:
            unreadMessagesRef.current.firstUnreadMsgEle!.getBoundingClientRect().top -
            msgsContainerEle.getBoundingClientRect().top,
          behavior: "instant",
        })
      }
    }

    // Cuộn đến cuối danh sách tin nhắn hoặc cuộn đến tin nhắn chưa đọc đầu tiên
    const handleScrollToBottomMsg = () => {
      const unreadMessages = unreadMessagesRef.current
      if (unreadMessages.count > 0 && unreadMessages.firstUnreadMsgEle !== null) {
        scrollToFirstUnreadMessage()
      } else {
        scrollToBottomMessage()
      }
    }

    const handleReadyNewMessage = () => {
      if (readyNewMessage.current && directChatId !== -1) {
        const newMessage = readyNewMessage.current
        readyNewMessage.current = null
        dispatch(mergeMessages([newMessage]))
      }
    }

    // Xử lý sự kiện gửi tin nhắn từ đối phương
    const listenSendMessage = (newMessage: TGetMessagesMessage) => {
      const { id } = newMessage
      if (directChatId === -1) {
        readyNewMessage.current = newMessage
        return
      }
      if (newMessage.directChatId !== directChatId) return
      dispatch(mergeMessages([newMessage]))
      dispatch(setLastSentMessage({ lastMessageId: id, chatType: EChatType.DIRECT }))
      clientSocket.setMessageOffset(id, directChatId)
    }

    // Xử lý sự kiện kết nối lại từ server
    const handleRecoverdConnection = (newMessages: TGetMessagesMessage[]) => {
      if (newMessages && newMessages.length > 0) {
        dispatch(mergeMessages(newMessages))
        const { id } = newMessages[newMessages.length - 1]
        clientSocket.setMessageOffset(id, directChatId)
      }
    }

    // Xử lý tin nhắn chưa đọc nằm ngoài vùng nhìn thấy (tức là user KHÔNG nhìn thấy tin nhắn chưa đọc)
    const handleUnreadMsgOutOfVisibleView = (
      messagesContainer: HTMLElement,
      unreadMessage: HTMLElement
    ) => {
      const containerRect = messagesContainer.getBoundingClientRect()
      const unreadMsgRect = unreadMessage.getBoundingClientRect()
      if (unreadMsgRect.top > containerRect.top + containerRect.height) {
        // Nếu tin nhắn chưa đọc nằm ngoài vùng nhìn thấy
        eventEmitter.emit(
          EInternalEvents.UNREAD_MESSAGES_COUNT,
          unreadMessagesRef.current.count,
          directChatId
        )
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
          unreadMessages.count = unreadMessageEles.length
          for (const msgEle of unreadMessageEles) {
            if (unreadMessages.firstUnreadMsgEle === null) {
              unreadMessages.firstUnreadMsgEle = msgEle
            }
            handleUnreadMsgInVisibleView(
              msgsContainerEle,
              msgEle,
              parseInt(msgEle.getAttribute("data-msg-id")!)
            )
            handleUnreadMsgOutOfVisibleView(msgsContainerEle, msgEle)
          }
        } else {
          unreadMessagesRef.current.count = 0
          unreadMessagesRef.current.firstUnreadMsgEle = null
          eventEmitter.emit(
            EInternalEvents.UNREAD_MESSAGES_COUNT,
            unreadMessagesRef.current.count,
            directChatId
          )
        }
      }
    }

    // Xử lý tin nhắn chưa đọc nằm trong vùng nhìn thấy (tức là user nhìn thấy 80% tin nhắn chưa đọc)
    const handleUnreadMsgInVisibleView = (
      messagesContainer: HTMLElement,
      unreadMessage: HTMLElement,
      msgId: number
    ) => {
      const containerRect = messagesContainer.getBoundingClientRect()
      const unreadMsgRect = unreadMessage.getBoundingClientRect()
      if (
        unreadMsgRect.top + unreadMsgRect.height * 0.8 <
        containerRect.top + containerRect.height
      ) {
        // Nếu tin nhắn chưa đọc nằm trong vùng nhìn thấy
        unreadMessage.classList.remove("QUERY-unread-message")
        const unreadMessages = unreadMessagesRef.current
        if (unreadMessages.count > 0) unreadMessages.count -= 1
        unreadMessages.firstUnreadMsgEle = null
        eventEmitter.emit(EInternalEvents.UNREAD_MESSAGES_COUNT, unreadMessages.count, directChatId)
        clientSocket.socket.emit(ESocketEvents.message_seen_direct, {
          messageId: msgId,
          receiverId: recipientId === user.id ? creatorId : recipientId,
        })
      }
    }

    // Hàm xử lý việc cuộn các tin nhắn vào vùng nhìn thấy
    const handleScrollMsgIntoVisibleView = (e: Event) => {
      const msgsContainerEle = e.currentTarget as HTMLElement
      const unreadMessageEles =
        msgsContainerEle.querySelectorAll<HTMLElement>(".QUERY-unread-message")
      if (unreadMessageEles && unreadMessageEles.length > 0) {
        for (const msg of unreadMessageEles) {
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

    // Hàm scroll đến tin nhắn gốc
    const scrollToOriginalMessage = (e: React.MouseEvent<HTMLDivElement>) => {
      let target = e.target as HTMLElement
      while (target && !target.classList.contains("QUERY-reply-preview")) {
        target = target.parentElement as HTMLElement
        if (!target || target.id === "STYLE-user-messages") return
      }

      if (!target) return // Thêm kiểm tra null

      const originalMessageContainer = messagesContainer.current?.querySelector(
        `.QUERY-message-container-${target.getAttribute("data-reply-to-id")}`
      )
      if (originalMessageContainer) {
        originalMessageContainer.scrollIntoView({
          behavior: "instant",
          block: "center",
        })
        const overlay = originalMessageContainer.querySelector(
          ".QUERY-message-container-overlay"
        ) as HTMLElement
        if (overlay) {
          overlay.classList.remove("animate-highlight-message")
          requestAnimationFrame(() => {
            overlay.classList.add("animate-highlight-message")
          })
        }
      }
    }

    const handleClickOnMessagesContainer = (e: React.MouseEvent<HTMLDivElement>) => {
      scrollToOriginalMessage(e)
    }

    // Thêm hàm scrollToMessage
    const scrollToMessage = (msgId: number) => {
      const container = messagesContainer.current
      const target = container?.querySelector(`.QUERY-message-container-${msgId}`)
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" })
        // Hiệu ứng highlight
        const overlay = target.querySelector(".QUERY-message-container-overlay")
        if (overlay) {
          overlay.classList.remove("animate-highlight-message")
          requestAnimationFrame(() => {
            overlay.classList.add("animate-highlight-message")
          })
        }
      }
      setShowPinnedModal(false) // Đóng modal sau khi cuộn
    }

    // Hàm dùng chung để show context quanh 1 messageId (áp dụng cho pinned, reply, nút Xem)
    const showMessageContext = async (messageId: number) => {
      try {
        const contextMsgs = await directChatService.getMessageContext(messageId)
        // Đánh dấu context
        const contextWithFlag = contextMsgs.map((msg: TStateDirectMessage) => ({
          ...msg,
          isContextMessage: true,
        }))
        dispatch(mergeMessages(contextWithFlag))
        // Lưu id lớn nhất của context
        setContextEndId(Math.max(...contextWithFlag.map((m: TStateDirectMessage) => m.id)))
        setTimeout(() => {
          scrollToMessage(messageId)
        }, 200)
      } catch (err) {
        toast.error("Không thể lấy ngữ cảnh tin nhắn")
      }
    }

    // Sử dụng showMessageContext cho pinned, nút Xem/reply preview
    const handleSelectPinnedMessage = showMessageContext
    const handleReply = (msg: TStateDirectMessage) => {
      onReplyFromProps(msg) // Mở khung trả lời như cũ, không show context
    }
    const handleReplyPreviewClick = (replyToId: number) => {
      showMessageContext(replyToId) // Chỉ nút Xem/reply preview mới show context
    }

    // Thêm hàm xử lý scroll đến tin nhắn media (tương tự như reply và ghim)
    const handleScrollToMessageMedia = (messageId: number) => {
      showMessageContext(messageId) // Sử dụng showMessageContext để hiển thị context
    }

    // Thay thế hàm fetchMissingMessages bằng phiên bản mới
    const fetchMissingMessages = async (fromId: number, toId: number) => {
      let offset = fromId - 1
      let done = false
      while (!done) {
        const newerMsgs = await directChatService.getNewerMessages(directChatId, offset, 20)
        if (!newerMsgs || newerMsgs.length === 0) {
          break
        }
        dispatch(mergeMessages(newerMsgs))
        // Lấy id lớn nhất vừa nhận được
        const maxId = Math.max(...newerMsgs.map((m: TStateDirectMessage) => m.id))
        // Nếu đã vượt qua toId thì dừng
        if (maxId >= toId) {
          done = true
        } else {
          offset = maxId
        }
      }
    }

    // Ref cho message cuối cùng
    const lastMsgRef = useRef<HTMLDivElement>(null)

    // Hàm fetch messages mới hơn
    const fetchMoreNewerMessages = async () => {
      if (!messages || messages.length === 0) return
      // Nếu đang ở context, lấy offset là contextEndId, ngược lại lấy id cuối cùng của mảng
      const offset = contextEndId ?? messages[messages.length - 1].id
      try {
        const newerMsgs = await directChatService.getNewerMessages(directChatId, offset, 20)
        if (newerMsgs && newerMsgs.length > 0) {
          dispatch(mergeMessages(newerMsgs))
          // Nếu đang ở context, cập nhật contextEndId = id lớn nhất vừa merge (hoặc set null nếu đã hết context)
          if (contextEndId) {
            const maxId = Math.max(...newerMsgs.map((m: TStateDirectMessage) => m.id))
            setContextEndId(maxId)
          }
        } else {
          // Nếu không còn tin nhắn mới hơn, thoát context
          if (contextEndId) setContextEndId(null)
        }
      } catch (err) {
        toast.error("Không thể lấy thêm tin nhắn mới hơn")
      }
    }

    const startFetchingMessages = () => {
      dispatch(resetDirectMessages())
      fetchMessages(directChatId, undefined, true)
    }

    const handleMessagesChange = () => {
      initMessageOffset()
      requestAnimationFrame(() => {
        scrollToBottomOnMessages()
        checkUnreadMessage()
        updateMessagesCount()
        isRenderingMessages.current = false
      })
    }

    // Xử lý thay đổi danh sách tin nhắn
    useEffect(() => {
      handleMessagesChange()
    }, [messages, directChatId])

    // IntersectionObserver cho message cuối cùng
    useEffect(() => {
      if (!lastMsgRef.current) return
      const observer = new window.IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            fetchMoreNewerMessages()
          }
        },
        { threshold: 1 }
      )
      observer.observe(lastMsgRef.current)
      return () => observer.disconnect()
    }, [messages, directChatId])

    useEffect(() => {
      startFetchingMessages()
      handleReadyNewMessage()
      messagesContainer.current?.addEventListener("scroll", handleScrollMsgsContainer)
      eventEmitter.on(EInternalEvents.SCROLL_TO_BOTTOM_MSG_ACTION, handleScrollToBottomMsg)
      eventEmitter.on(EInternalEvents.SCROLL_TO_MESSAGE_MEDIA, handleScrollToMessageMedia)
      eventEmitter.on(EInternalEvents.SEND_MESSAGE_DIRECT, listenSendMessage)
      clientSocket.socket.on(ESocketEvents.recovered_connection, handleRecoverdConnection)
      clientSocket.socket.on(ESocketEvents.message_seen_direct, handleMessageSeen)
      return () => {
        messagesContainer.current?.removeEventListener("scroll", handleScrollMsgsContainer)
        eventEmitter.off(EInternalEvents.SCROLL_TO_BOTTOM_MSG_ACTION, handleScrollToBottomMsg)
        eventEmitter.off(EInternalEvents.SCROLL_TO_MESSAGE_MEDIA, handleScrollToMessageMedia)
        eventEmitter.off(EInternalEvents.SEND_MESSAGE_DIRECT, listenSendMessage)
        clientSocket.socket.removeListener(
          ESocketEvents.recovered_connection,
          handleRecoverdConnection
        )
        clientSocket.socket.removeListener(ESocketEvents.message_seen_direct, handleMessageSeen)
      }
    }, [directChatId])

    useEffect(() => {
      if (pendingFillContextId && messages) {
        const allIds = messages.map((m: TStateDirectMessage) => m.id)
        const missingRanges = findMissingRanges(allIds)
        //onsole.log("[DEBUG] (useEffect) Các đoạn id bị thiếu:", missingRanges)
        missingRanges.forEach(([from, to]) => {
          fetchMissingMessages(from, to)
        })
        setPendingFillContextId(null) // Reset sau khi fill
      }
    }, [messages, pendingFillContextId, directChatId])

    // Hàm bỏ ghim tin nhắn (unpin)
    const handleUnpinMessage = async (msgId: number) => {
      try {
        const response = await pinService.togglePinMessage(msgId, directChat.id, false)
        // Xử lý response dựa trên loại response
        if ("success" in response && response.success) {
          setPinnedMessages((prev) => prev.filter((m) => m.id !== msgId))
          toast.success("Đã bỏ ghim tin nhắn")
        }
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || "Lỗi khi bỏ ghim tin nhắn"
        toast.error(errorMessage)
      }
    }

    // mappedMessages: ưu tiên contextMessages nếu có
    const mappedMessages = [...(messages || [])]
      .sort((a: TStateDirectMessage, b: TStateDirectMessage) => a.id - b.id)
      .map((message: TStateDirectMessage, index, arr) => {
        const stickyTime = displayMessageStickyTime(message.createdAt, arr[index - 1]?.createdAt)
        const isLast = contextEndId ? message.id === contextEndId : index === arr.length - 1
        return (
          <div
            key={message.id}
            ref={isLast ? lastMsgRef : undefined}
            className={isLast ? "QUERY-context-last-msg" : undefined}
          >
            <Message
              message={message}
              user={user}
              stickyTime={stickyTime}
              onReply={handleReply}
              isPinned={!!pinnedMessages.find((m: TStateDirectMessage) => m.id === message.id)}
              onPinChange={(newState) => {
                if (newState) setPinnedMessages([...pinnedMessages, message])
                else
                  setPinnedMessages(
                    pinnedMessages.filter((m: TStateDirectMessage) => m.id !== message.id)
                  )
              }}
              pinnedCount={pinnedMessages.length}
              onReplyPreviewClick={handleReplyPreviewClick}
            />
          </div>
        )
      })

    return (
      <div className="relative h-full flex flex-col">
        {/* Modal hiển thị danh sách tin nhắn đã ghim */}
        {showPinnedModal && (
          <PinMessageModal
            pinnedMessages={pinnedMessages}
            onClose={() => setShowPinnedModal(false)}
            onSelectMessage={handleSelectPinnedMessage}
            onUnpinMessage={handleUnpinMessage}
          />
        )}
        <div
          className="flex flex-col items-center w-full h-full overflow-y-scroll overflow-x-hidden STYLE-styled-scrollbar px-3 box-border"
          ref={messagesContainer}
        >
          {fetchedMsgs ? (
            messages && messages.length > 0 ? (
              <div
                id="STYLE-user-messages"
                onClick={handleClickOnMessagesContainer}
                className="flex flex-col justify-end py-3 box-border w-messages-list gap-y-2"
              >
                {hasMoreMessages.current && loading === "loading-messages" && (
                  <div className="flex w-full justify-center">
                    <Spinner size="small" />
                  </div>
                )}
                {mappedMessages}
              </div>
            ) : (
              <NoMessagesYet directChat={directChat} user={user} canSend={canSend} />
            )
          ) : (
            <div className="m-auto w-11 h-11">
              <Spinner size="medium" />
            </div>
          )}
        </div>
        {createPortal(<ScrollToBottomMessageBtn />, document.body)}
      </div>
    )
  }
)
