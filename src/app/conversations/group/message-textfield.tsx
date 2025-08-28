"use client"

import { IconButton } from "@/components/materials"
import { Smile, Sticker } from "lucide-react"
import { chattingService } from "@/services/chatting.service"
import { AutoResizeTextField } from "@/components/materials"
import { useEffect, useRef, useState, Suspense, lazy } from "react"
import { useRootLayoutContext } from "@/hooks/layout"
import { createPortal } from "react-dom"
import { renderToStaticMarkup } from "react-dom/server"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { clientSocket } from "@/utils/socket/client-socket"
import { EMessagingEvents } from "@/utils/socket/events"
import type { TGroupChat, TSticker } from "@/utils/types/be-api"
import type { TEmoji } from "@/utils/types/global"
import { EMessageTypeAllTypes } from "@/utils/enums"
import { toast } from "sonner"
import { extractEmojisFromMessage, unescapeHtml } from "@/utils/helpers"
import { TChattingPayloadForGroup } from "@/utils/types/socket"

const LazyEmojiPicker = lazy(() => import("../../../components/materials/emoji-picker"))
const LazyStickerPicker = lazy(() => import("../../../components/materials/sticker-picker"))

const Fallback = () => (
  <div className="rounded-lg overflow-hidden w-full h-inside-expression-picker"></div>
)

const EmojiImg = ({ name, src }: TEmoji) => {
  return <img className="STYLE-emoji-img" src={src} alt={name} />
}

type TExpressionCategory = "emoji" | "sticker"

type TExpressionPickerProps = {
  textFieldRef: React.RefObject<HTMLDivElement | null>
  expressionPopoverRef: React.RefObject<HTMLDivElement | null>
  groupChat: TGroupChat
}

export const ExpressionPicker = ({
  textFieldRef,
  expressionPopoverRef,
  groupChat,
}: TExpressionPickerProps) => {
  const [showPicker, setShowPicker] = useState<boolean>(false)
  const [category, setCategory] = useState<TExpressionCategory>("emoji")
  const addEmojiBtnRef = useRef<HTMLButtonElement>(null)
  const appRootEle = useRootLayoutContext().appRootRef!.current!
  const { id: groupChatId } = groupChat
  const handleSelectEmoji = (emojiObject: TEmoji) => {
    const textField = textFieldRef.current
    if (textField) {
      const emojiInString = renderToStaticMarkup(
        <EmojiImg name={emojiObject.name} src={emojiObject.src} />
      )
      eventEmitter.emit(EInternalEvents.MSG_TEXTFIELD_EDITED, { content: emojiInString })
    }
  }

  const handleSelectSticker = (sticker: TSticker) => {
    chattingService.sendGroupMessage(
      EMessageTypeAllTypes.STICKER,
      {
        content: `${sticker.id}`,
        groupChatId,
        token: chattingService.getMessageToken(),
        timestamp: new Date(),
      },
      (data) => {
        if ("success" in data && data.success) {
          chattingService.recursiveSendingQueueMessages()
        } else if ("isError" in data && data.isError) {
          toast.error(data.message)
        }
      }
    )
  }

  const toggleEmojiPicker = () => {
    setShowPicker((prev) => !prev)
  }

  const detectCollisionAndAdjust = () => {
    const addEmojiBtn = addEmojiBtnRef.current
    const addEmojiPopover = expressionPopoverRef.current
    if (addEmojiBtn && addEmojiPopover) {
      const buttonRect = addEmojiBtn.getBoundingClientRect()
      const popoverRect = addEmojiPopover.getBoundingClientRect()

      const conversationsListRect = (
        appRootEle.querySelector("#QUERY-conversations-list") as HTMLElement
      ).getBoundingClientRect()

      let top: number = buttonRect.top - popoverRect.height - 25
      let left: number = buttonRect.left + buttonRect.width / 2 - popoverRect.width / 2
      const conversationsListRight = conversationsListRect.right

      top = top < 0 ? 10 : top
      left = left < conversationsListRight + 10 ? conversationsListRight + 10 : left

      addEmojiPopover.style.cssText = `top: ${top}px; left: ${left}px; position: fixed; z-index: 99;`

      requestAnimationFrame(() => {
        addEmojiPopover.classList.add("animate-scale-up", "origin-bottom")
      })
    }
  }

  const handleClickOutside = (e: MouseEvent) => {
    const addEmojiPopover = expressionPopoverRef.current
    if (addEmojiPopover) {
      if (
        !addEmojiPopover.contains(e.target as Node) &&
        !addEmojiBtnRef.current?.contains(e.target as Node)
      ) {
        setShowPicker(false)
      }
    }
  }

  useEffect(() => {
    eventEmitter.on(EInternalEvents.CLICK_ON_LAYOUT, handleClickOutside)
    return () => {
      eventEmitter.off(EInternalEvents.CLICK_ON_LAYOUT, handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (showPicker) {
      detectCollisionAndAdjust()
    }
  }, [showPicker])

  return (
    <div className="flex text-regular-icon-cl hover:text-regular-violet-cl relative bottom-0 left-0 cursor-pointer">
      {showPicker &&
        createPortal(
          <div
            ref={expressionPopoverRef}
            className="fixed top-0 left-0 rounded-lg h-expression-picker w-expression-picker bg-expression-picker-bgcl"
          >
            <Suspense fallback={<Fallback />}>
              {category === "emoji" ? (
                <LazyEmojiPicker onSelectEmoji={handleSelectEmoji} />
              ) : (
                <LazyStickerPicker onSelectSticker={handleSelectSticker} />
              )}
            </Suspense>
            <div className="flex items-center justify-center gap-3 w-full h-nav-expression-picker px-2 pt-0 pb-2.5">
              <IconButton title={{ text: "Emoji" }} onClick={() => setCategory("emoji")}>
                <Smile className="h-6 w-6 text-regular-icon-cl" />
              </IconButton>
              <IconButton title={{ text: "Sticker" }} onClick={() => setCategory("sticker")}>
                <Sticker className="h-6 w-6 text-regular-icon-cl" />
              </IconButton>
            </div>
          </div>,
          document.body
        )}
      <button ref={addEmojiBtnRef} onClick={toggleEmojiPicker}>
        <Smile />
      </button>
    </div>
  )
}

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
  groupChat: TGroupChat
  setHasContent: (hasContent: boolean) => void
  hasContent: boolean
  textFieldRef: React.RefObject<HTMLDivElement | null>
  textFieldContainerRef: React.RefObject<HTMLDivElement | null>
  expressionPopoverRef: React.RefObject<HTMLDivElement | null>
  replyMessage: any | null
  setReplyMessage: (msg: any | null) => void
}

export const MessageTextField = ({
  groupChat,
  setHasContent,
  hasContent,
  textFieldRef,
  textFieldContainerRef,
  expressionPopoverRef,
  replyMessage,
  setReplyMessage,
}: TMessageTextFieldProps) => {
  const { id: groupChatId } = groupChat
  const typingFlagRef = useRef<TTypingFlags | undefined>(undefined)
  const debounce = useCustomDebounce(typingFlagRef)

  const indicateUserIsTyping = debounce((type: TTypingFlags) => {
    clientSocket.socket.emit(EMessagingEvents.typing_group, {
      groupChatId,
      isTyping: type === "typing",
    })
  }, INDICATE_TYPING_DELAY)

  const handleTyping = (msg: string) => {
    if (msg.trim() && msg.length > 0) {
      setHasContent(true)
    } else {
      setHasContent(false)
    }

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

    const payload: TChattingPayloadForGroup["msgPayload"] = {
      content: msgToSend,
      groupChatId,
      token: chattingService.getMessageToken(),
      timestamp: new Date(),
    }

    if (replyMessage && replyMessage.id) {
      payload.replyToId = replyMessage.id
    }

    chattingService.sendGroupMessage(EMessageTypeAllTypes.TEXT, payload, (data) => {
      if ("success" in data && data.success) {
        chattingService.recursiveSendingQueueMessages()
      } else if ("isError" in data && data.isError) {
        toast.error(data.message)
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

  useEffect(() => {
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
