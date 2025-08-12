"use client"

import { Conversations } from "./conversations"
import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { setChatBackground } from "@/redux/settings/settings.slice"
import { AppNavigation } from "@/components/layout/app-navigation"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { SwitchChatbox } from "./switch-chatbox"
import type { TGetMessagesMessage, TGroupChat } from "@/utils/types/be-api"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"
import { STATIC_CHAT_BACKGROUND_URL } from "@/utils/UI-constants"
import { updateGroupChat } from "@/redux/messages/messages.slice"
import { updateSingleConversation } from "@/redux/conversations/conversations.slice"
import { EChatType } from "@/utils/enums"

const ChatBackground = () => {
  const chatBackground = useAppSelector(({ settings }) => settings.theme.chatBackground)
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(setChatBackground(STATIC_CHAT_BACKGROUND_URL))
  }, [chatBackground])

  return (
    <div
      style={chatBackground ? { backgroundImage: `url(${chatBackground})` } : {}}
      className="h-full w-full top-0 left-0 absolute z-10"
    ></div>
  )
}

const ConversationPage = () => {
  const dispatch = useAppDispatch()

  const handleClickOnLayout = (e: MouseEvent) => {
    eventEmitter.emit(EInternalEvents.CLICK_ON_LAYOUT, e)
  }

  const listenSendDirectMessage = (newMessage: TGetMessagesMessage) => {
    eventEmitter.emit(EInternalEvents.SEND_MESSAGE_DIRECT, newMessage)
  }

  const listenSendGroupMessage = (newMessage: TGetMessagesMessage) => {
    eventEmitter.emit(EInternalEvents.SEND_MESSAGE_GROUP, newMessage)
  }

  const listenUpdateGroupChatInfo = (groupChatId: number, groupChat: Partial<TGroupChat>) => {
    dispatch(updateGroupChat(groupChat))
    dispatch(
      updateSingleConversation({
        id: groupChatId,
        type: EChatType.GROUP,
        "avatar.src": groupChat.avatarUrl,
        title: groupChat.name,
      })
    )
  }

  const listenRemoveGroupChatMembers = (memberIds: number[], groupChat: TGroupChat) => {
    eventEmitter.emit(EInternalEvents.REMOVE_GROUP_CHAT_MEMBERS, memberIds, groupChat)
  }

  const listenAddGroupChatMembers = (newMemberIds: number[], groupChat: TGroupChat) => {
    eventEmitter.emit(EInternalEvents.ADD_GROUP_CHAT_MEMBERS, newMemberIds, groupChat)
  }

  useEffect(() => {
    document.body.addEventListener("click", handleClickOnLayout)
    clientSocket.socket.on(ESocketEvents.update_group_chat_info, listenUpdateGroupChatInfo)
    clientSocket.socket.on(ESocketEvents.remove_group_chat_members, listenRemoveGroupChatMembers)
    clientSocket.socket.on(ESocketEvents.add_group_chat_members, listenAddGroupChatMembers)
    clientSocket.socket.on(ESocketEvents.send_message_direct, listenSendDirectMessage)
    clientSocket.socket.on(ESocketEvents.send_message_group, listenSendGroupMessage)
    return () => {
      document.body.removeEventListener("click", handleClickOnLayout)
      clientSocket.socket.removeListener(
        ESocketEvents.update_group_chat_info,
        listenUpdateGroupChatInfo
      )
      clientSocket.socket.removeListener(
        ESocketEvents.remove_group_chat_members,
        listenRemoveGroupChatMembers
      )
      clientSocket.socket.removeListener(
        ESocketEvents.add_group_chat_members,
        listenAddGroupChatMembers
      )
      clientSocket.socket.removeListener(ESocketEvents.send_message_direct, listenSendDirectMessage)
      clientSocket.socket.removeListener(ESocketEvents.send_message_group, listenSendGroupMessage)
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
