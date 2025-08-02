"use client"

import { Conversations } from "./conversations"
import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { setChatBackground } from "@/redux/settings/settings.slice"
import { AppNavigation } from "@/components/layout/app-navigation"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { SwitchChatbox } from "./switch-chatbox"
import type { TGetDirectMessagesMessage } from "@/utils/types/be-api"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"

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
  const handleClickOnLayout = (e: MouseEvent) => {
    eventEmitter.emit(EInternalEvents.CLICK_ON_LAYOUT, e)
  }

  const listenNewMessageFromChatting = (newMessage: TGetDirectMessagesMessage) => {
    eventEmitter.emit(EInternalEvents.NEW_MESSAGE_FROM_CHATTING, newMessage)
  }

  useEffect(() => {
    document.body.addEventListener("click", handleClickOnLayout)
    clientSocket.socket.on(ESocketEvents.send_message_direct, listenNewMessageFromChatting)
    return () => {
      document.body.removeEventListener("click", handleClickOnLayout)
      clientSocket.socket.removeListener(
        ESocketEvents.send_message_direct,
        listenNewMessageFromChatting
      )
    }
  }, [])

  return (
    <div className="bg-regular-black-cl w-full h-screen relative">
      <ChatBackground />

      <div className="flex absolute h-full w-full top-0 left-0 bg-transparent z-20">
        <AppNavigation />

        <div className="flex grow relative z-20">
          <Conversations />
          <SwitchChatbox />
        </div>
      </div>
    </div>
  )
}

export default ConversationPage
