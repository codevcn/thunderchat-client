"use client"

import { Conversations } from "./conversations"
import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { setChatBackground } from "@/redux/settings/settings.slice"
import { AppNavigation } from "@/components/layout/app-navigation"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { SwitchChatbox } from "./switch-chatbox"
import AccountPage from "../(account)/page"
import { useState } from "react"

const ChatBackground = () => {
  const chatBackground = useAppSelector(({ settings }) => settings.theme.chatBackground)
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(setChatBackground("/images/chat_bg/chat-bg-pattern-dark.ad38368a9e8140d0ac7d.webp"))
  }, [chatBackground])

  return (
    <div
      style={chatBackground ? { backgroundImage: `url(${chatBackground})` } : {}}
      className="h-full w-full top-0 left-0 absolute z-10"
    ></div>
  )
}

const ConversationPage = () => {
  const [showAccount, setShowAccount] = useState(false)
  const handleClickOnLayout = (e: MouseEvent) => {
    eventEmitter.emit(EInternalEvents.CLICK_ON_LAYOUT, e)
  }

  useEffect(() => {
    document.body.addEventListener("click", handleClickOnLayout)
    return () => {
      document.body.removeEventListener("click", handleClickOnLayout)
    }
  }, [])

  return (
    <div className="bg-regular-black-cl w-full h-screen relative">
      <ChatBackground />

      <div className="flex absolute h-full w-full top-0 left-0 bg-transparent z-20">
        <AppNavigation onOpenAccount={() => setShowAccount(true)} />

        <div className="flex grow relative z-20">
          {showAccount ? (
            <div className="w-convs-list h-full bg-regular-dark-gray-cl border-regular-hover-card-cl border-r overflow-y-auto STYLE-styled-scrollbar">
              <AccountPage showBackButton={true} onBack={() => setShowAccount(false)} />
            </div>
          ) : (
            <Conversations />
          )}
          <SwitchChatbox />
        </div>
      </div>
    </div>
  )
}

export default ConversationPage
