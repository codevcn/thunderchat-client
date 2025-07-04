"use client"

import { Conversations } from "./conversations"
import { Chat } from "./chat"
import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { setChatBackground } from "@/redux/settings/settings.slice"
import { AppNavigation } from "@/components/layout/app-navigation"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"

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
            <AppNavigation />

            <div className="flex grow relative z-20">
               <Conversations />

               <Chat />
            </div>
         </div>
      </div>
   )
}

export default ConversationPage
