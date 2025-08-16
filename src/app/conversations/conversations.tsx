"use client"

import { CustomPopover, Skeleton } from "@/components/materials"
import { ChevronLeft, Menu, Users } from "lucide-react"
import type {
  TUserWithProfile,
  TMessage,
  TDirectChat,
  TGetMessagesMessage,
  TGroupChat,
} from "@/utils/types/be-api"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import { sortDirectChatsByPinned } from "@/redux/conversations/conversations.selectors"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { checkNewConversationIsCurrentChat } from "@/utils/helpers"
import { directChatService } from "@/services/direct-chat.service"
import { EChatType, EMessageTypes, EPaginations } from "@/utils/enums"
import {
  addConversations,
  setConversations,
  updateSingleConversation,
  updateUnreadMsgCountOnCard,
} from "@/redux/conversations/conversations.slice"
import { toaster } from "@/utils/toaster"
import { AddMembersBoard } from "./group/create-group-chat"
import { groupChatService } from "@/services/group-chat.service"
import { TConversationCard } from "@/utils/types/global"
import { useUser } from "@/hooks/user"
import { useNavToConversation } from "@/hooks/navigation"
import { updateDirectChat } from "@/redux/messages/messages.slice"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { localStorageManager } from "@/utils/local-storage"
import { pinService } from "@/services/pin.service"
import { usePinChats } from "@/hooks/pin-chats"
import { GlobalSearchBar, SearchSection } from "./global-search"
import { ConversationCard } from "./conversation-card"
import type { TPopoverPos } from "./sharings"
import { ConversationContextMenu } from "./conversation-context-menu"
import { setOpenConvsList } from "@/redux/layout/layout.slice"

type TConversationCardsMainProps = {
  conversations: TConversationCard[]
  navToDirectChat: (id: number, type: EChatType) => void
  isChatPinned: (id: number, type: EChatType) => boolean
  pinLoading: boolean
  handlePinToggle: (directChatId?: number, groupChatId?: number) => void
}

const ConversationCardsMain = ({
  conversations,
  navToDirectChat,
  isChatPinned,
  pinLoading,
  handlePinToggle,
}: TConversationCardsMainProps) => {
  const [pickedConversation, setPickedConversation] = useState<TConversationCard>()
  const [popoverPos, setPopoverPos] = useState<TPopoverPos>()

  const handleOpenCloseContextMenu = (open: boolean) => {
    setPickedConversation(open ? pickedConversation : undefined)
  }

  return (
    <>
      {conversations.map((conversation) => {
        return (
          <ConversationCard
            key={`${conversation.id}-${conversation.type}`}
            onNavToConversation={navToDirectChat}
            isPinned={isChatPinned(conversation.id, conversation.type)}
            pinLoading={pinLoading}
            conversationData={conversation}
            onTogglePin={handlePinToggle}
            onPickedConversation={setPickedConversation}
            onSetPopoverPos={setPopoverPos}
            isPicked={
              `${conversation.id}-${conversation.type}` ===
              `${pickedConversation?.id || ""}-${pickedConversation?.type || ""}`
            }
          />
        )
      })}

      <ConversationContextMenu
        pickedConversation={pickedConversation}
        onOpenCloseContextMenu={handleOpenCloseContextMenu}
        popoverPos={popoverPos}
      />
    </>
  )
}

const ConversationCards = () => {
  const dispatch = useAppDispatch()
  const conversations = useAppSelector(sortDirectChatsByPinned)
  const directChatLastId = useRef<number | undefined>(undefined)
  const groupChatLastId = useRef<number | undefined>(undefined)
  const navToConversation = useNavToConversation()
  const [loading, setLoading] = useState<boolean>(false)
  const user = useUser()!
  const {
    pinChats,
    loading: pinLoading,
    fetchPinChatsByUserId,
    isChatPinned,
    getPinnedChat,
  } = usePinChats()

  const setLastId = () => {
    if (conversations && conversations.length > 0) {
      for (const conversation of conversations) {
        // Tìm id cuối cùng theo loại chat trong mảng
        if (conversation.type === EChatType.DIRECT) {
          directChatLastId.current = conversation.id
        }
        if (conversation.type === EChatType.GROUP) {
          groupChatLastId.current = conversation.id
        }
      }
    }
  }

  const fetchDirectChats = async (): Promise<TConversationCard[]> => {
    setLastId()
    setLoading(true)
    try {
      return await directChatService.fetchDirectChats(
        user,
        EPaginations.DIRECT_MESSAGES_PAGE_SIZE,
        directChatLastId.current
      )
    } catch (err) {
      toaster.error(axiosErrorHandler.handleHttpError(err).message)
    } finally {
      setLoading(false)
    }
    return []
  }

  const fetchGroupChats = async (): Promise<TConversationCard[]> => {
    setLastId()
    setLoading(true)
    try {
      return await groupChatService.fetchGroupChats(
        EPaginations.DIRECT_MESSAGES_PAGE_SIZE,
        user,
        groupChatLastId.current
      )
    } catch (err) {
      toaster.error(axiosErrorHandler.handleHttpError(err).message)
    } finally {
      setLoading(false)
    }
    return []
  }

  const fetchConversations = async () => {
    const [directChats, groupChats] = await Promise.all([fetchDirectChats(), fetchGroupChats()])
    const allChats = [...directChats, ...groupChats]

    // Sort using pinnedAt order from API
    const sortedChats = allChats.sort((a, b) => {
      // sort by message time
      const getTimestamp = (chat: TConversationCard) => {
        const timeToUse = chat.lastMessageTime || chat.createdAt
        return new Date(timeToUse).getTime()
      }
      return getTimestamp(b) - getTimestamp(a) // Latest first
    })

    dispatch(addConversations(sortedChats))
  }

  const navToDirectChat = (id: number, type: EChatType) => {
    navToConversation(id, type)
  }

  const handlePinToggle = (directChatId?: number, groupChatId?: number) => {
    pinService
      .togglePinConversation(directChatId, groupChatId)
      .then((pinnedChat) => {
        if (pinnedChat) {
          fetchPinChatsByUserId()
        }
      })
      .catch((error) => {
        toaster.error(axiosErrorHandler.handleHttpError(error).message)
      })
  }

  const handleAddNewConversation = (
    newDirectChat: TDirectChat | null,
    newGroupChat: TGroupChat | null,
    newMessage: TMessage | null,
    sender: TUserWithProfile
  ) => {
    const lastDirectChat = localStorageManager.getLastDirectChatData()!
    let conversationCard: TConversationCard
    if (newDirectChat && newMessage) {
      conversationCard = {
        id: newDirectChat.id,
        type: EChatType.DIRECT,
        lastMessageTime: newMessage.createdAt,
        subtitle: {
          content: newMessage.content,
          type: newMessage.type,
        },
        unreadMessageCount: 1,
        createdAt: newDirectChat.createdAt,
        pinIndex: -1,
        avatar: {
          fallback: "",
        },
        title: "",
      }
      if (user.id === newDirectChat.creatorId) {
        const recipientFullName = lastDirectChat.chatData.Recipient.Profile.fullName
        conversationCard.avatar = {
          fallback: recipientFullName[0],
        }
        conversationCard.title = recipientFullName
      } else {
        const senderFullName = sender.Profile.fullName
        conversationCard.avatar = {
          fallback: senderFullName[0],
        }
        conversationCard.title = senderFullName
      }
    } else if (newGroupChat) {
      const { name: chatTitle, creatorId } = newGroupChat
      conversationCard = {
        id: newGroupChat.id,
        type: EChatType.GROUP,
        lastMessageTime: undefined,
        subtitle: {
          content:
            creatorId === user.id
              ? "You created this chat"
              : `This chat created by ${sender.Profile.fullName}`,
          type: EMessageTypes.TEXT,
        },
        unreadMessageCount: 0,
        createdAt: newGroupChat.createdAt,
        pinIndex: -1,
        avatar: {
          src: newGroupChat.avatarUrl,
          fallback: chatTitle[0],
        },
        title: chatTitle,
      }
    }
    dispatch(addConversations([conversationCard!]))
  }

  const handleUpdateCurrentChat = (newDirectChat: TDirectChat | null) => {
    dispatch((dispatch, getState) => {
      const currentDirectChat = getState().messages.directChat
      if (
        newDirectChat &&
        currentDirectChat &&
        checkNewConversationIsCurrentChat(
          currentDirectChat.id,
          user.id,
          [newDirectChat.recipientId, newDirectChat.creatorId],
          newDirectChat.id
        )
      ) {
        dispatch(
          updateDirectChat({
            id: newDirectChat.id,
            lastSentMessageId: newDirectChat.lastSentMessageId,
            createdAt: newDirectChat.createdAt,
            creatorId: newDirectChat.creatorId,
            recipientId: newDirectChat.recipientId,
          })
        )
      }
    })
  }

  const listenNewConversation = (
    directChat: TDirectChat | null,
    groupChat: TGroupChat | null,
    type: EChatType,
    newMessage: TMessage | null,
    sender: TUserWithProfile
  ) => {
    console.log(">>> listen New Conversation:", { directChat, groupChat, type, newMessage, sender })
    if (type === EChatType.DIRECT && directChat) {
      const lastDirectChatData = localStorageManager.getLastDirectChatData()
      if (lastDirectChatData) {
        localStorageManager.setLastDirectChatData({
          tempId: lastDirectChatData.tempId,
          chatData: {
            ...directChat,
            Recipient: lastDirectChatData.chatData.Recipient,
            Creator: lastDirectChatData.chatData.Creator,
          },
        })
      }
      handleAddNewConversation(directChat, null, newMessage, sender)
      handleUpdateCurrentChat(directChat)
    } else if (type === EChatType.GROUP && groupChat) {
      handleAddNewConversation(null, groupChat, newMessage, sender)
    }
  }

  const listenUnreadMessagesCount = (unreadMessageCount: number, conversationId: number) => {
    dispatch(updateUnreadMsgCountOnCard({ count: unreadMessageCount, conversationId }))
  }

  const handleUpdateLastSentMessage = (newMessage: TGetMessagesMessage) => {
    dispatch(
      updateSingleConversation({
        id: newMessage.directChatId,
        lastMessageTime: new Date().toISOString(),
        "subtitle.content": newMessage.content,
        "subtitle.type": newMessage.type,
      })
    )
  }

  const listenSendMessage = (newMessage: TGetMessagesMessage) => {
    handleUpdateLastSentMessage(newMessage)
    const convId = (newMessage.directChatId || newMessage.groupChatId)!
    dispatch((_, getState) => {
      const convOfMsg = getState().conversations.conversations?.find((c) => c.id === convId)
      if (convOfMsg) {
        const currentUnreadCount = convOfMsg.unreadMessageCount
        dispatch(
          updateUnreadMsgCountOnCard({
            count: currentUnreadCount > 0 ? currentUnreadCount + 1 : 1,
            conversationId: convId,
          })
        )
      }
    })
  }

  useEffect(() => {
    fetchPinChatsByUserId()
    clientSocket.socket.on(ESocketEvents.new_conversation, listenNewConversation)
    // @ts-ignore
    eventEmitter.addListener(EInternalEvents.UNREAD_MESSAGES_COUNT, listenUnreadMessagesCount)
    eventEmitter.on(EInternalEvents.SEND_MESSAGE_DIRECT, listenSendMessage)
    return () => {
      clientSocket.socket.off(ESocketEvents.new_conversation, listenNewConversation)
      eventEmitter.removeListener(EInternalEvents.UNREAD_MESSAGES_COUNT, listenUnreadMessagesCount)
      eventEmitter.removeListener(EInternalEvents.SEND_MESSAGE_DIRECT, listenSendMessage)
    }
  }, [])

  // Auto-sort conversations when pinned status changes
  useEffect(() => {
    if (conversations && conversations.length > 0) {
      const sortedChats = [...conversations].sort((a, b) => {
        const aIsPinned = isChatPinned(a.id, a.type)
        const bIsPinned = isChatPinned(b.id, b.type)

        // Pinned chats always go first
        if (aIsPinned && !bIsPinned) return -1
        if (!aIsPinned && bIsPinned) return 1

        // For pinned chats, use pinnedAt order from API
        if (aIsPinned && bIsPinned) {
          const aPinnedChat = getPinnedChat(a.id, a.type)
          const bPinnedChat = getPinnedChat(b.id, b.type)

          if (aPinnedChat && bPinnedChat) {
            // pinnedAt is already sorted desc from API, so newer pinnedAt comes first
            return (
              new Date(bPinnedChat.pinnedAt).getTime() - new Date(aPinnedChat.pinnedAt).getTime()
            )
          }
        }

        // For unpinned chats, sort by message time
        const getTimestamp = (chat: TConversationCard) => {
          const timeToUse = chat.lastMessageTime || chat.createdAt
          return new Date(timeToUse).getTime()
        }
        return getTimestamp(b) - getTimestamp(a) // Latest first
      })

      // Only update if order actually changed
      const currentOrder = conversations.map((c) => c.id).join(",")
      const newOrder = sortedChats.map((c) => c.id).join(",")

      if (currentOrder !== newOrder) {
        dispatch(setConversations(sortedChats))
      }
    }
  }, [pinChats, conversations])

  useEffect(() => {
    if (!conversations || conversations.length === 0) {
      fetchConversations()
    }
  }, [conversations])

  return loading ? (
    <div className="flex flex-col gap-1 justify-center items-center">
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="flex items-center gap-2 w-full px-3 py-2">
          <Skeleton className="w-[50px] h-[50px] rounded-full bg-regular-hover-card-cl" />
          <div className="w-[195px]">
            <Skeleton className="w-full h-[20px] bg-regular-hover-card-cl rounded-md" />
            <Skeleton className="w-1/2 h-[15px] bg-regular-hover-card-cl mt-1 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  ) : conversations && conversations.length > 0 ? (
    <div className="flex flex-col w-full h-full mt-3 overflow-x-hidden overflow-y-auto STYLE-styled-scrollbar pr-1 pb-4">
      <ConversationCardsMain
        conversations={conversations}
        navToDirectChat={navToDirectChat}
        isChatPinned={isChatPinned}
        pinLoading={pinLoading}
        handlePinToggle={handlePinToggle}
      />
    </div>
  ) : (
    <div className="flex flex-col gap-2 justify-center items-center h-full px-3">
      <p className="text-sm text-regular-icon-cl text-center max-w-[300px]">
        You have no conversations yet.
      </p>
      <p className="text-sm text-regular-icon-cl text-center max-w-[300px]">
        Start a new conversation by finding a friend in the search bar.
      </p>
    </div>
  )
}

type TFloatingMenuProps = {
  onOpenGroupChat: Dispatch<SetStateAction<boolean>>
  openGroupChat: boolean
}

const FloatingMenu = ({ onOpenGroupChat, openGroupChat }: TFloatingMenuProps) => {
  const startCreateNewGroupChat = () => {
    onOpenGroupChat(true)
  }

  return (
    <div className="absolute bottom-6 right-6 z-20">
      <CustomPopover
        trigger={
          <button className="flex justify-center items-center w-[50px] h-[50px] rounded-full bg-regular-violet-cl hover:scale-110 transition duration-200">
            <Menu color="currentColor" size={24} />
          </button>
        }
        open={openGroupChat === true ? false : undefined}
      >
        <div className="flex flex-col gap-2 bg-regular-black-cl rounded-md py-2">
          <button
            onClick={startCreateNewGroupChat}
            className="w-full text-regular-white-cl hover:bg-gray-600/50"
          >
            <span className="flex justify-start items-center gap-2 min-w-max active:scale-95 py-1 px-4">
              <Users color="currentColor" size={16} />
              <span className="text-sm">New Group</span>
            </span>
          </button>
        </div>
      </CustomPopover>
    </div>
  )
}

type THideShowConvsListButtonProps = {
  openConvsList: boolean
}

const HideShowConvsListButton = ({ openConvsList }: THideShowConvsListButtonProps) => {
  const { directChat, groupChat } = useAppSelector(({ messages }) => messages)
  const dispatch = useAppDispatch()

  const handleCloseConvsList = () => {
    dispatch(setOpenConvsList(false))
  }

  return (
    (directChat || groupChat) &&
    openConvsList && (
      <div className="absolute bottom-8 -right-4 z-50 text-gray-400 bg-regular-dark-gray-cl screen-medium-chatting:hidden">
        <button
          className="rounded-full p-1 hover:bg-gray-600/50 border border-gray-600/50"
          onClick={handleCloseConvsList}
        >
          <ChevronLeft
            size={22}
            color="currentColor"
            className="-translate-x-0.5"
            strokeWidth={3}
          />
        </button>
      </div>
    )
  )
}

export const Conversations = () => {
  const [inputFocused, setInputFocused] = useState<boolean>(false)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [openGroupChat, setOpenGroupChat] = useState<boolean>(false)
  const globalSearchInputRef = useRef<HTMLInputElement>(null)
  const openConvsList = useAppSelector((state) => state.layout.openConvsList)

  return (
    <div
      style={{ left: openConvsList ? "55px" : "-19rem" }}
      className="w-convs-list h-full flex top-0 fixed screen-medium-chatting:static z-[99] transition-[left] duration-200"
    >
      <div
        id="QUERY-conversations-list"
        className={`flex flex-col relative w-full h-full overflow-hidden py-3 box-border bg-regular-dark-gray-cl border-regular-hover-card-cl border-r`}
      >
        <GlobalSearchBar
          setInputFocused={setInputFocused}
          setIsSearching={setIsSearching}
          inputFocused={inputFocused}
          isSearching={isSearching}
          globalSearchInputRef={globalSearchInputRef}
        />

        <div className="relative z-10 grow overflow-hidden">
          <SearchSection inputFocused={inputFocused} globalSearchInputRef={globalSearchInputRef} />

          <div
            className={`${inputFocused ? "animate-zoom-fade-out" : "animate-zoom-fade-in"} w-full h-full absolute top-0 left-0 z-30 px-2 pr-0`}
          >
            <ConversationCards />
          </div>
        </div>

        <FloatingMenu onOpenGroupChat={setOpenGroupChat} openGroupChat={openGroupChat} />

        <AddMembersBoard open={openGroupChat} onOpen={setOpenGroupChat} />
      </div>

      <HideShowConvsListButton openConvsList={openConvsList} />
    </div>
  )
}
