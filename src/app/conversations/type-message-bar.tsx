"use client"

import { CustomTooltip, IconButton } from "@/components/materials"
import { Mic, Paperclip, Send, Smile, Sticker } from "lucide-react"
import { chattingService } from "@/services/chatting.service"
import { useUser } from "@/hooks/user"
import { AutoResizeTextField } from "@/components/materials"
import { useAppSelector } from "@/hooks/redux"
import { memo, useEffect, useRef, useState, Suspense, lazy } from "react"
import { useRootLayoutContext } from "@/hooks/layout"
import { createPortal } from "react-dom"
import { renderToStaticMarkup } from "react-dom/server"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"
import type { TDirectChat, TSticker } from "@/utils/types/be-api"
import type { TEmoji } from "@/utils/types/global"
import { EMessageTypes } from "@/utils/enums"
import { toast } from "sonner"

const LazyEmojiPicker = lazy(() => import("../../components/materials/emoji-picker"))
const LazyStickerPicker = lazy(() => import("../../components/materials/sticker-picker"))

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
   directChat: TDirectChat
}

const ExpressionPicker = ({
   textFieldRef,
   expressionPopoverRef,
   directChat,
}: TExpressionPickerProps) => {
   const [showPicker, setShowPicker] = useState<boolean>(false)
   const [category, setCategory] = useState<TExpressionCategory>("emoji")
   const addEmojiBtnRef = useRef<HTMLButtonElement>(null)
   const appRootEle = useRootLayoutContext().appRootRef!.current!
   const user = useUser()!
   const { recipientId, creatorId, id } = directChat
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
      chattingService.sendMessage(
         EMessageTypes.STICKER,
         {
            content: sticker.imageUrl,
            receiverId: user.id === recipientId ? creatorId : recipientId,
            directChatId: id,
            token: chattingService.getMessageToken(),
            timestamp: new Date(),
         },
         (data) => {
            if ("success" in data && data.success) {
               chattingService.setAcknowledgmentFlag(true)
               chattingService.recursiveSendingQueueMessages()
            } else if ("isError" in data && data.isError) {
               console.log(">>> data err:", data)
               toast.error("Error when sending message")
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
   directChat: TDirectChat
   setHasContent: (hasContent: boolean) => void
   hasContent: boolean
   textFieldRef: React.RefObject<HTMLDivElement | null>
   textFieldContainerRef: React.RefObject<HTMLDivElement | null>
   expressionPopoverRef: React.RefObject<HTMLDivElement | null>
}

const MessageTextField = ({
   directChat,
   setHasContent,
   hasContent,
   textFieldRef,
   textFieldContainerRef,
   expressionPopoverRef,
}: TMessageTextFieldProps) => {
   const { recipientId, creatorId, id } = directChat
   const user = useUser()!
   const typingFlagRef = useRef<TTypingFlags | undefined>(undefined)
   const debounce = useCustomDebounce(typingFlagRef)

   const indicateUserIsTyping = debounce((type: TTypingFlags) => {
      clientSocket.socket.emit(ESocketEvents.typing_direct, {
         receiverId: recipientId === user.id ? creatorId : recipientId,
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

   const sendMessage = (msgToSend: string) => {
      if (
         !msgToSend ||
         msgToSend.length === 0 ||
         textFieldRef.current?.querySelector(".QUERY-empty-placeholder")
      ) {
         return
      }
      chattingService.sendMessage(
         EMessageTypes.TEXT,
         {
            content: msgToSend,
            receiverId: user.id === recipientId ? creatorId : recipientId,
            directChatId: id,
            token: crypto.randomUUID(),
            timestamp: new Date(),
         },
         (data) => {
            if ("success" in data && data.success) {
               chattingService.setAcknowledgmentFlag(true)
               chattingService.recursiveSendingQueueMessages()
            } else if ("isError" in data && data.isError) {
               console.log(">>> error in data 123:", data)
               toast.error("Error when sending message")
            }
         }
      )
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
      return () => {
         eventEmitter.off(EInternalEvents.CLICK_ON_LAYOUT, handleClickOnLayout)
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

type TTypeMessageBarProps = {
   directChat: TDirectChat
}

export const TypeMessageBar = memo(({ directChat }: TTypeMessageBarProps) => {
   const { fetchedMsgs } = useAppSelector(({ messages }) => messages)
   const textFieldRef = useRef<HTMLDivElement | null>(null)
   const [hasContent, setHasContent] = useState<boolean>(false)
   const textFieldContainerRef = useRef<HTMLDivElement | null>(null)
   const expressionPopoverRef = useRef<HTMLDivElement>(null)

   const handleClickOnTextFieldContainer = (e: React.MouseEvent<HTMLElement>) => {
      const textField = textFieldRef.current
      textFieldContainerRef.current?.classList.add("outline-regular-violet-cl")
      if (textField) {
         if (e.target === textField) return
         textField.focus()
         // Đặt con trỏ ở cuối nội dung
         const range = document.createRange()
         const selection = window.getSelection()
         range.selectNodeContents(textField)
         range.collapse(false) // false để đặt con trỏ ở cuối, true để đặt ở đầu
         if (selection) {
            selection.removeAllRanges()
            selection.addRange(range)
         }
      }
   }

   return (
      fetchedMsgs && (
         <div className="flex gap-2.5 items-end pt-2 pb-4 z-999 box-border w-type-message-bar">
            <div
               onClick={handleClickOnTextFieldContainer}
               ref={textFieldContainerRef}
               className="flex cursor-text grow items-center gap-2 relative z-10 rounded-2xl bg-regular-dark-gray-cl px-3 outline-2 outline outline-regular-dark-gray-cl hover:outline-regular-violet-cl transition-[outline] duration-200"
            >
               <ExpressionPicker
                  textFieldRef={textFieldRef}
                  expressionPopoverRef={expressionPopoverRef}
                  directChat={directChat}
               />
               <MessageTextField
                  hasContent={hasContent}
                  directChat={directChat}
                  setHasContent={setHasContent}
                  textFieldRef={textFieldRef}
                  textFieldContainerRef={textFieldContainerRef}
                  expressionPopoverRef={expressionPopoverRef}
               />
               <button className="text-gray-500 hover:text-regular-violet-cl cursor-pointer relative bottom-0 right-0">
                  <Paperclip />
               </button>
            </div>

            <CustomTooltip
               title={hasContent ? "Send message" : "Record voice message"}
               placement="top"
            >
               <div
                  className={`${hasContent ? "text-regular-violet-cl" : "text-gray-500"} bg-regular-dark-gray-cl rounded-full p-[27px] relative hover:text-white flex justify-center items-center cursor-pointer hover:bg-regular-violet-cl`}
               >
                  <div
                     className={`${hasContent ? "animate-hide-icon" : "animate-grow-icon"} absolute`}
                  >
                     <Mic />
                  </div>
                  <div
                     className={`${hasContent ? "animate-grow-icon" : "animate-hide-icon"} absolute`}
                  >
                     <Send />
                  </div>
               </div>
            </CustomTooltip>
         </div>
      )
   )
})
