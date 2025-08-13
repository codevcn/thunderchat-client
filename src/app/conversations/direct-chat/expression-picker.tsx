"use client"

import { IconButton } from "@/components/materials"
import { Smile, Sticker } from "lucide-react"
import { chattingService } from "@/services/chatting.service"
import { useUser } from "@/hooks/user"
import { useEffect, useRef, useState, Suspense, lazy } from "react"
import { useRootLayoutContext } from "@/hooks/layout"
import { createPortal } from "react-dom"
import { renderToStaticMarkup } from "react-dom/server"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import type { TDirectChat, TSticker } from "@/utils/types/be-api"
import type { TEmoji } from "@/utils/types/global"
import { EMessageTypeAllTypes } from "@/utils/enums"
import { toast } from "sonner"

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
  directChat: TDirectChat
}

export const ExpressionPicker = ({
  textFieldRef,
  expressionPopoverRef,
  directChat,
}: TExpressionPickerProps) => {
  const [showPicker, setShowPicker] = useState<boolean>(false)
  const [category, setCategory] = useState<TExpressionCategory>("emoji")
  const addEmojiBtnRef = useRef<HTMLButtonElement>(null)
  const appRootEle = useRootLayoutContext().appRootRef!.current!
  const user = useUser()!
  const { recipientId, creatorId } = directChat
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
      EMessageTypeAllTypes.STICKER,
      {
        content: `${sticker.id}`,
        receiverId: user.id === recipientId ? creatorId : recipientId,
        token: chattingService.getMessageToken(),
        timestamp: new Date(),
      },
      (data) => {
        if ("success" in data && data.success) {
          chattingService.recursiveSendingQueueMessages()
        } else if ("isError" in data && data.isError) {
          toast.error(data?.message || "Error when sending message")
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
