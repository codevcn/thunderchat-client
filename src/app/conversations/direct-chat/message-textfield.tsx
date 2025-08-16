"use client"

import { chattingService } from "@/services/chatting.service"
import { useUser } from "@/hooks/user"
import { AutoResizeTextField } from "@/components/materials"
import { useEffect, useRef } from "react"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"
import type { TDirectChat } from "@/utils/types/be-api"
import { EMessageTypeAllTypes } from "@/utils/enums"
import { toast } from "sonner"
import { extractEmojisFromMessage, unescapeHtml } from "@/utils/helpers"
import { TChattingPayload } from "@/utils/types/socket"

const INDICATE_TYPING_DELAY: number = 200

type TTypingFlags = "typing" | "stop"

// Hàm custom debounce ngăn chặn việc gửi nhiều request trong 1 khoảng thời gian delay
// Sẽ không ngăn chặn nếu 2 request kế tiếp nhau là khác loại với nhau (VD: pre req là "typing" còn next req là "blur")
const useCustomDebounce = (typingFlagRef: React.RefObject<TTypingFlags | undefined>) => {
  const timer = useRef<NodeJS.Timeout>(undefined)
  return (handler: (type: TTypingFlags) => void, delayInMs: number) => {
    return (type: TTypingFlags) => {
      if (!timer.current || typingFlagRef.current !== type) {
        typingFlagRef.current = type
        handler(type)
      }
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        timer.current = undefined
      }, delayInMs)
    }
  }
}

type TMessageTextFieldProps = {
  directChat: TDirectChat
  setHasContent: (hasContent: boolean) => void
  hasContent: boolean
  textFieldRef: React.RefObject<HTMLDivElement | null>
  textFieldContainerRef: React.RefObject<HTMLDivElement | null>
  expressionPopoverRef: React.RefObject<HTMLDivElement | null>
  replyMessage: any | null
  setReplyMessage: (msg: any | null) => void
  onTextContentChange?: (content: string) => void
}

export const MessageTextField = ({
  directChat,
  setHasContent,
  hasContent,
  textFieldRef,
  textFieldContainerRef,
  expressionPopoverRef,
  replyMessage,
  setReplyMessage,
  onTextContentChange,
}: TMessageTextFieldProps) => {
  const { recipientId, creatorId } = directChat
  const user = useUser()!
  const typingFlagRef = useRef<TTypingFlags | undefined>(undefined)
  const debounce = useCustomDebounce(typingFlagRef)

  const indicateUserIsTyping = debounce((type: TTypingFlags) => {
    clientSocket.socket.emit(ESocketEvents.typing_direct, {
      receiverId: recipientId === user.id ? creatorId : recipientId,
      isTyping: type === "typing",
      directChatId: directChat.id,
    })
  }, INDICATE_TYPING_DELAY)

  const handleTyping = (msg: string) => {
    if (msg.trim() && msg.length > 0) {
      setHasContent(true)
    } else {
      setHasContent(false)
    }

    // Notify parent component about text content change
    onTextContentChange?.(msg)

    indicateUserIsTyping("typing")
  }

  // Hàm clean up nội dung message
  const cleanMessageContent = (message: string): string => {
    // Decode HTML entities
    let cleaned = unescapeHtml(message)

    // Loại bỏ link tags
    cleaned = cleaned.replace(/<link[^>]*>/g, "")

    // Loại bỏ whitespace thừa
    cleaned = cleaned.trim()

    return cleaned
  }

  // Xử lý paste event để đảm bảo emoji hiển thị đúng
  const handlePaste = (_: ClipboardEvent) => {
    const textField = textFieldRef.current
    if (!textField) return

    // Đợi một chút để DOM được cập nhật
    setTimeout(() => {
      const content = textField.innerHTML

      // Clean up content trước khi xử lý
      const cleanedContent = cleanMessageContent(content)

      // Kiểm tra xem có emoji img tags không
      const emojis = extractEmojisFromMessage(cleanedContent)

      if (emojis.length > 0) {
        // Thay thế nội dung encoded bằng nội dung đã clean để hiển thị emoji
        if (content !== cleanedContent) {
          textField.innerHTML = cleanedContent
          // Điều chỉnh kích thước sau khi thay thế nội dung
          setTimeout(() => {
            if (textField) {
              // Reset kích thước để tính toán lại
              textField.style.height = "auto"
              textField.style.width = "auto"

              // Tính toán kích thước mới
              const newHeight = Math.min(
                Math.max(textField.scrollHeight, 21), // min height
                300 // max height
              )

              // Tính toán chiều rộng mới (giới hạn tối đa 100% container)
              const containerWidth = textField.parentElement?.clientWidth || 1000
              const newWidth = Math.min(textField.scrollWidth, containerWidth)

              // Áp dụng kích thước mới
              textField.style.height = `${newHeight}px`
              textField.style.width = `${newWidth}px`

              // Thêm overflow nếu cần
              textField.style.overflowY = textField.scrollHeight > 300 ? "auto" : "hidden"
              textField.style.overflowX = textField.scrollWidth > newWidth ? "auto" : "hidden"

              // Di chuyển con trỏ đến cuối text
              const range = document.createRange()
              const selection = window.getSelection()
              range.selectNodeContents(textField)
              range.collapse(false) // false để đặt con trỏ ở cuối, true để đặt ở đầu
              if (selection) {
                selection.removeAllRanges()
                selection.addRange(range)
              }

              // Focus vào textfield
              textField.focus()
            }
          }, 0)
        }
      }
    }, 10)
  }

  const sendMessage = (msgToSend: string) => {
    if (!msgToSend || !msgToSend.trim() || msgToSend.includes("QUERY-empty-placeholder")) {
      toast.error("Message cannot be empty")
      return
    }

    const payload: TChattingPayload["msgPayload"] = {
      content: msgToSend,
      receiverId: user.id === recipientId ? creatorId : recipientId,
      token: chattingService.getMessageToken(),
      timestamp: new Date(),
    }

    if (replyMessage && replyMessage.id) {
      payload.replyToId = replyMessage.id
    }

    chattingService.sendMessage(EMessageTypeAllTypes.TEXT, payload, (data) => {
      if ("success" in data && data.success) {
        chattingService.recursiveSendingQueueMessages()
      } else if ("isError" in data && data.isError) {
        toast.error(data?.message || "Error when sending message")
      }
    })
    setReplyMessage(null)
  }

  const handleCatchEnter = (msg: string) => {
    sendMessage(msg)
  }

  const handleBlur = () => {
    textFieldContainerRef.current?.classList.remove("outline-regular-violet-cl")
    if (!textFieldRef.current?.innerHTML) {
      setHasContent(false)
    }
  }

  const handleClickOnLayout = (e: MouseEvent) => {
    if (
      !expressionPopoverRef.current?.contains(e.target as Node) &&
      !textFieldContainerRef.current?.contains(e.target as Node) &&
      typingFlagRef.current === "typing"
    ) {
      indicateUserIsTyping("stop")
    }
  }

  const sendMessageOnEventHandler = () => {
    const textFieldEle = textFieldRef.current
    if (textFieldEle) {
      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        keyCode: 13, // Một số trình duyệt cũ vẫn cần
        which: 13,
        bubbles: true,
        cancelable: true,
      })
      textFieldEle.dispatchEvent(event)
    }
  }

  useEffect(() => {
    eventEmitter.on(EInternalEvents.SEND_MESSAGE, sendMessageOnEventHandler)
    eventEmitter.on(EInternalEvents.CLICK_ON_LAYOUT, handleClickOnLayout)

    // Thêm paste event listener
    const textField = textFieldRef.current
    if (textField) {
      textField.addEventListener("paste", handlePaste)
    }

    return () => {
      eventEmitter.off(EInternalEvents.CLICK_ON_LAYOUT, handleClickOnLayout)
      if (textField) {
        textField.removeEventListener("paste", handlePaste)
      }
    }
  }, [])

  return (
    <div className="relative bg-regular-dark-gray-cl grow py-[15.5px] px-2">
      <AutoResizeTextField
        className="block bg-transparent outline-none w-full hover:bg-transparent whitespace-pre-wrap break-all leading-tight focus:bg-transparent z-10 STYLE-styled-scrollbar border-transparent text-white hover:border-transparent focus:border-transparent focus:shadow-none"
        onEnterPress={handleCatchEnter}
        onContentChange={handleTyping}
        maxHeight={300}
        lineHeight={1.5}
        textFieldRef={textFieldRef}
        onBlur={handleBlur}
        initialHeight={21}
        textSize={14}
        id="STYLE-type-msg-bar"
      />
      <span
        className={`${hasContent ? "animate-hide-placeholder" : "animate-grow-placeholder"} leading-tight left-2.5 z-0 absolute top-1/2 -translate-y-1/2 text-regular-placeholder-cl`}
      >
        Message...
      </span>
    </div>
  )
}
