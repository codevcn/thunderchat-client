// SmartSearchPage.tsx
"use client"
import { useState } from "react"
import SmartSearch, { TMember } from "./smart-search"
import { AppNavigation } from "@/components/layout/app-navigation"
import { STATIC_CHAT_BACKGROUND_URL } from "@/utils/UI-constants"
import { Conversations } from "../conversations/conversations"
import { SwitchChatbox } from "../conversations/switch-chatbox"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { useAppDispatch } from "@/hooks/redux"
import { openInfoBar } from "@/redux/conversations/conversations.slice"
import { EChatType } from "@/utils/enums"

export default function SmartSearchPage() {
  const dispatch = useAppDispatch()

  const [showGlobalSearch, setShowGlobalSearch] = useState(true)

  const ChatBackground = () => {
    return (
      <div
        style={{ backgroundImage: `url(${STATIC_CHAT_BACKGROUND_URL})` }}
        className="h-full w-full top-0 left-0 absolute z-10"
      ></div>
    )
  }

  const handleMessageClick = (messageId: number, chatId: number, chatType: EChatType) => {
    console.log(
      `GlobalSearch: Navigating to Chat ID: ${chatId}, Type: ${chatType}, Msg ID: ${messageId}`
    )

    if (chatType === EChatType.DIRECT) {
      eventEmitter.emit(EInternalEvents.FETCH_DIRECT_CHAT, chatId)
    } else if (chatType === EChatType.GROUP) {
      eventEmitter.emit(EInternalEvents.FETCH_GROUP_CHAT, chatId)
    }

    // 2. Mở SmartBar (InfoBar)
    dispatch(openInfoBar(true))

    // 3. Đóng panel tìm kiếm toàn cục
    setShowGlobalSearch(false)

    // 4. Phát sự kiện cuộn (delay một chút để chat kịp tải)
    setTimeout(() => {
      eventEmitter.emit(EInternalEvents.SCROLL_TO_QUERIED_MESSAGE, messageId)
    }, 500) // Delay 500ms
  }
  return (
    <div className="bg-regular-black-cl w-full h-screen relative">
      <ChatBackground />

      <div className="flex absolute h-full w-full top-0 left-0 bg-transparent z-20">
        <AppNavigation />

        <div className="flex grow relative z-20">
          <Conversations />
          <SwitchChatbox />
        </div>

        {showGlobalSearch && <SmartSearch onMessageClick={handleMessageClick} />}
      </div>
    </div>
  )
}
