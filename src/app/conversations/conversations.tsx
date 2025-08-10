"use client"

import {
  CustomAvatar,
  CustomPopover,
  CustomTooltip,
  Skeleton,
  toast,
  PinButton,
} from "@/components/materials"
import { Search as SearchIcon, ArrowLeft, X, Menu, Users } from "lucide-react"
import dayjs from "dayjs"
import { useDebounce } from "@/hooks/debounce"
import type {
  TGlobalSearchData,
  TUserSearchOffset,
  TMessageSearchOffset,
  TUserWithProfile,
  TMessage,
  TDirectChat,
  TGetMessagesMessage,
  TGroupChat,
} from "@/utils/types/be-api"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { ChangeEvent, Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import { Spinner } from "@/components/materials/spinner"
import { IconButton } from "@/components/materials/icon-button"
import { sortDirectChatsByPinned } from "@/redux/conversations/conversations.selectors"
import { searchService } from "@/services/search.service"
import axiosErrorHandler from "@/utils/axios-error-handler"
import {
  checkNewConversationIsCurrentChat,
  extractHighlightOffsets,
  santizeMsgContent,
} from "@/utils/helpers"
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
import {
  addMessages,
  addUsers,
  resetSearch,
  setGlobalSearchResult,
  setNoMoreMessages,
  setNoMoreUsers,
} from "@/redux/search/search.slice"
import { renderHighlightedContent } from "@/utils/tsx-helpers"
import { useNavToConversation, useNavToTempDirectChat } from "@/hooks/navigation"
import { resetAllChatData, updateDirectChat } from "@/redux/messages/messages.slice"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { localStorageManager } from "@/utils/local-storage"
import { pinService } from "@/services/pin.service"
import { usePinChats } from "@/hooks/pin-chats"

const SEARCH_LIMIT: number = 10
const MAX_UNREAD_MESSAGES_COUNT: number = 9

type TResultCardProps = {
  avatarUrl?: string
  convName: string
  subtitle: string
  highlights?: string[]
  onStartChat: () => void
  email?: string
}

const ResultCard = ({
  avatarUrl,
  convName,
  subtitle,
  highlights,
  onStartChat,
  email,
}: TResultCardProps) => {
  return (
    <div
      className="flex w-full p-3 py-2 cursor-pointer hover:bg-regular-hover-card-cl rounded-lg gap-3"
      onClick={onStartChat}
    >
      <CustomTooltip
        title="Click to open a chat"
        placement="right"
        className="w-full cursor-pointer"
      >
        <div className="flex w-full gap-3">
          <div className="w-[50px]">
            <CustomAvatar
              className="border border-white/20 font-bold text-xl"
              src={avatarUrl}
              imgSize={50}
              fallback={convName[0]}
            />
          </div>
          <div className="flex flex-col gap-1 max-w-[calc(100%-62px)]">
            <span className="font-bold text-base w-fit">{convName}</span>
            {highlights && highlights.length > 0 ? (
              <span className="text-xs text-regular-icon-cl text-left truncate w-full">
                {renderHighlightedContent(subtitle, extractHighlightOffsets(subtitle, highlights))}
              </span>
            ) : (
              <span className="text-sm text-regular-icon-cl truncate w-full text-left">
                {email}
              </span>
            )}
          </div>
        </div>
      </CustomTooltip>
    </div>
  )
}

const getSearchPayload = (globalSearchResult: TGlobalSearchData | null) => {
  let messageSearchOffset: TMessageSearchOffset | undefined
  let userSearchOffset: TUserSearchOffset | undefined
  if (globalSearchResult) {
    const { nextSearchOffset } = globalSearchResult
    messageSearchOffset = nextSearchOffset.messageSearchOffset
    userSearchOffset = nextSearchOffset.userSearchOffset
  }
  return {
    messageSearchOffset,
    userSearchOffset,
    searchLimit: SEARCH_LIMIT,
  }
}

type TSearchType = "users" | "messages"

type TSearchResultProps = {
  searchResult: TGlobalSearchData
  globalSearchInputRef: React.RefObject<HTMLInputElement | null>
}

const SearchResult = ({ searchResult, globalSearchInputRef }: TSearchResultProps) => {
  const { users, messages } = searchResult
  const [activeTab, setActiveTab] = useState<TSearchType>("users")
  const buttonsGroupRef = useRef<HTMLDivElement>(null)
  const navToConversation = useNavToConversation()
  const navToTempDirectChat = useNavToTempDirectChat()
  const dispatch = useAppDispatch()
  const user = useUser()!
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const { globalSearchResult, noMoreMessages, noMoreUsers } = useAppSelector(
    (state) => state.search
  )
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const loadMoreObserver = useRef<IntersectionObserver | null>(null)

  const startChatHandler = async (
    type: "users" | "messages",
    chatType: EChatType,
    chatId?: number,
    otherUser?: TUserWithProfile,
    messageId?: number
  ) => {
    if (type === "messages" && chatId && messageId) {
      dispatch((_, getState) => {
        if (getState().messages.directChat?.id === chatId) {
          eventEmitter.emit(EInternalEvents.SCROLL_TO_QUERIED_MESSAGE, messageId)
        } else {
          navToConversation(chatId, chatType, false, messageId)
        }
      })
    } else if (type === "users" && otherUser) {
      const otherUserId = otherUser.id
      directChatService
        .findConversationWithOtherUser(otherUserId)
        .then((directChat) => {
          if (directChat) {
            navToConversation(directChat.id, EChatType.DIRECT)
          } else {
            dispatch(resetAllChatData())
            navToTempDirectChat(user, otherUser)
          }
        })
        .catch((err) => {
          toast.error(axiosErrorHandler.handleHttpError(err).message)
        })
    }
  }

  const handleTabClick = (e: React.MouseEvent<HTMLButtonElement>, tab: TSearchType) => {
    setActiveTab(tab)
    const buttonsGroup = buttonsGroupRef.current
    if (buttonsGroup) {
      const activeTabIndicator = buttonsGroup.querySelector<HTMLSpanElement>(
        ".QUERY-active-tab-indicator"
      )
      if (activeTabIndicator) {
        const buttonWidth = e.currentTarget.offsetWidth
        const buttonOffsetLeft = e.currentTarget.offsetLeft
        activeTabIndicator.style.width = `${buttonWidth}px`
        activeTabIndicator.style.left = `${buttonOffsetLeft}px`
      }
    }
  }

  const setupActiveTab = () => {
    if (users && users.length > 0) {
      buttonsGroupRef.current?.querySelector<HTMLButtonElement>(".QUERY-tab-button-users")?.click()
    } else if (messages && messages.length > 0) {
      buttonsGroupRef.current
        ?.querySelector<HTMLButtonElement>(".QUERY-tab-button-messages")
        ?.click()
    }
  }

  const loadMore = () => {
    const { messageSearchOffset, userSearchOffset, searchLimit } =
      getSearchPayload(globalSearchResult)
    const keyword = globalSearchInputRef.current?.value
    if (!keyword) return
    setIsSearching(true)
    searchService
      .searchGlobally(keyword, searchLimit, messageSearchOffset, userSearchOffset)
      .then((res) => {
        const { messages, users } = res
        if (messages && messages.length > 0) {
          dispatch(addMessages(messages))
        } else {
          dispatch(setNoMoreMessages(true))
        }
        if (users && users.length > 0) {
          dispatch(addUsers(users))
        } else {
          dispatch(setNoMoreUsers(true))
        }
      })
      .catch((err) => {
        toast.error(axiosErrorHandler.handleHttpError(err).message)
      })
      .finally(() => {
        setIsSearching(false)
      })
  }

  const initLoadMore = () => {
    const loadMoreEle = loadMoreRef.current
    if (loadMoreEle) {
      loadMoreObserver.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadMore()
            }
          })
        },
        {
          threshold: 1.0,
        }
      )
      loadMoreObserver.current.observe(loadMoreEle)
    }
  }

  useEffect(() => {
    initLoadMore()
  }, [activeTab, searchResult])

  useEffect(() => {
    setupActiveTab()
  }, [searchResult])

  useEffect(() => {
    return () => {
      if (loadMoreObserver.current) {
        loadMoreObserver.current.disconnect()
        loadMoreObserver.current = null
      }
    }
  }, [])

  const usersExist = users && users.length > 0
  const messagesExist = messages && messages.length > 0

  return (
    (usersExist || messagesExist) && (
      <div className="flex flex-col gap-2">
        <div
          className="flex px-2 relative border-b-2 border-regular-black-cl"
          ref={buttonsGroupRef}
        >
          <span className="QUERY-active-tab-indicator bg-regular-violet-cl h-1 transition duration-200 absolute bottom-0 left-0"></span>
          <button
            className={`${activeTab === "users" ? "text-regular-violet-cl" : "text-regular-white-cl"} QUERY-tab-button-users px-4 pb-3 pt-3 hover:bg-regular-hover-card-cl`}
            onClick={(e) => handleTabClick(e, "users")}
          >
            Users
          </button>
          <button
            className={`${activeTab === "messages" ? "text-regular-violet-cl" : "text-regular-white-cl"} QUERY-tab-button-messages px-4 pb-3 pt-3 hover:bg-regular-hover-card-cl`}
            onClick={(e) => handleTabClick(e, "messages")}
          >
            Messages
          </button>
        </div>
        <div className="pb-2 px-2 STYLE-styled-scrollbar overflow-y-auto">
          {activeTab === "users" && (
            <div className="QUERY-users-list w-full">
              {usersExist &&
                users.map((user) => (
                  <ResultCard
                    key={user.id}
                    avatarUrl={user.Profile.avatar}
                    convName={user.Profile.fullName || ""}
                    subtitle=""
                    onStartChat={() =>
                      startChatHandler("users", EChatType.DIRECT, undefined, user, undefined)
                    }
                    email={user.email}
                  />
                ))}
              {usersExist && !isSearching && !noMoreUsers && (
                <div
                  className="QUERY-load-more-users h-5 w-full flex justify-center items-center mt-4"
                  ref={loadMoreRef}
                >
                  {isSearching && <Spinner size="small" className="text-regular-hover-card-cl" />}
                </div>
              )}
            </div>
          )}
          {activeTab === "messages" && (
            <div className="QUERY-messages-list w-full">
              {messagesExist &&
                messages.map((message) => (
                  <ResultCard
                    key={message.id}
                    convName={message.conversationName}
                    subtitle={message.messageContent}
                    highlights={message.highlights}
                    onStartChat={() =>
                      startChatHandler(
                        "messages",
                        message.chatType,
                        message.chatId,
                        undefined,
                        message.id
                      )
                    }
                  />
                ))}
              {messagesExist && !isSearching && !noMoreMessages && (
                <div
                  className="QUERY-load-more-messages h-5 w-full flex justify-center items-center mt-4"
                  ref={loadMoreRef}
                >
                  {isSearching && <Spinner size="small" className="text-regular-hover-card-cl" />}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  )
}

type TSearchSectionProps = {
  inputFocused: boolean
  globalSearchInputRef: React.RefObject<HTMLInputElement | null>
}

const SearchSection = ({ inputFocused, globalSearchInputRef }: TSearchSectionProps) => {
  const globalSearchResult = useAppSelector((state) => state.search.globalSearchResult)

  return (
    <div
      className={`${inputFocused ? "animate-super-zoom-out-fade-in" : "animate-super-zoom-in-fade-out"} z-20 pt-2 pb-5 absolute top-0 left-0 box-border w-full h-full overflow-x-hidden overflow-y-auto STYLE-styled-scrollbar`}
    >
      {globalSearchResult ? (
        <SearchResult
          searchResult={globalSearchResult}
          globalSearchInputRef={globalSearchInputRef}
        />
      ) : (
        <div className="flex justify-center items-center h-full w-full">
          <p className="text-regular-icon-cl">No results found</p>
        </div>
      )}
    </div>
  )
}

type TGlobalSearchBarProps = {
  setIsSearching: Dispatch<SetStateAction<boolean>>
  setInputFocused: Dispatch<SetStateAction<boolean>>
  inputFocused: boolean
  isSearching: boolean
  globalSearchInputRef: React.RefObject<HTMLInputElement | null>
}

const GlobalSearchBar = ({
  setInputFocused,
  setIsSearching,
  inputFocused,
  isSearching,
  globalSearchInputRef,
}: TGlobalSearchBarProps) => {
  const debounce = useDebounce()
  const dispatch = useAppDispatch()

  const searchGlobally = debounce(async (e: ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.trim()
    if (!inputValue) return
    dispatch((dispatch, getState) => {
      dispatch(resetSearch())
      const { messageSearchOffset, userSearchOffset, searchLimit } = getSearchPayload(
        getState().search.globalSearchResult
      )
      setIsSearching(true)
      searchService
        .searchGlobally(inputValue, searchLimit, messageSearchOffset, userSearchOffset)
        .then((res) => {
          dispatch(setGlobalSearchResult(res))
          const { messages, users } = res
          if (!messages || messages.length === 0) dispatch(setNoMoreMessages(true))
          if (!users || users.length === 0) dispatch(setNoMoreUsers(true))
        })
        .catch((err) => {
          toast.error(axiosErrorHandler.handleHttpError(err).message)
        })
        .finally(() => {
          setIsSearching(false)
        })
    })
  }, 300)

  const closeSearch = () => {
    if (globalSearchInputRef.current?.value) globalSearchInputRef.current.value = ""
    setInputFocused(false)
  }

  const clearInput = () => {
    if (globalSearchInputRef.current?.value) globalSearchInputRef.current.value = ""
    dispatch(resetSearch())
  }

  return (
    <div className="flex gap-1 items-center px-2 box-border text-regular-placeholder-cl">
      <div
        className={`flex ${inputFocused ? "animate-appear-zoom-in-s40" : "animate-disappear-zoom-out-s40"}`}
      >
        <IconButton
          className="flex justify-center items-center h-[40px] w-[40px]"
          onClick={closeSearch}
        >
          <ArrowLeft color="currentColor" size={20} />
        </IconButton>
      </div>

      <div className="flex flex-auto relative w-full">
        {isSearching ? (
          <span className="absolute top-1/2 -translate-y-1/2 z-20 h-5 w-5 left-3">
            <Spinner size="small" className="text-regular-violet-cl" />
          </span>
        ) : (
          <span className="absolute top-1/2 -translate-y-1/2 z-20 h-5 w-5 left-3">
            <SearchIcon color="currentColor" size={20} />
          </span>
        )}

        <input
          type="text"
          className="box-border h-[40px] w-full px-10 rounded-full transition duration-200 border-2 placeholder:text-regular-placeholder-cl outline-none text-white bg-regular-hover-card-cl border-regular-hover-card-cl hover:border-regular-violet-cl hover:bg-regular-hover-card-cl focus:border-regular-violet-cl"
          placeholder="Search..."
          onChange={searchGlobally}
          onFocus={() => setInputFocused(true)}
          ref={globalSearchInputRef}
        />

        <IconButton
          className="flex justify-center items-center right-1 h-[35px] w-[35px] absolute top-1/2 -translate-y-1/2 z-20"
          onClick={clearInput}
        >
          <X color="currentColor" />
        </IconButton>
      </div>
    </div>
  )
}

const convertSubtitleTypeToText = (
  subtitleType: EMessageTypes,
  subtitleContent: string
): string => {
  switch (subtitleType) {
    case EMessageTypes.STICKER:
      return "Sticker"
    case EMessageTypes.MEDIA:
      return "Media"
    case EMessageTypes.PIN_NOTICE:
      return subtitleContent
    default:
      return "Unknown"
  }
}

const getPinIndexClass = (pinIndex: number): string => {
  switch (pinIndex) {
    case 1:
      return "order-1"
    case 2:
      return "order-2"
    case 3:
      return "order-3"
    default:
      return "order-4"
  }
}

type TConversationCardProps = {
  onNavToConversation: (id: number, type: EChatType) => void
  isPinned: boolean
  pinLoading: boolean
  conversationData: TConversationCard
  onTogglePin: (directChatId?: number, groupChatId?: number) => void
}

const ConversationCard = ({
  onNavToConversation,
  isPinned,
  pinLoading,
  conversationData,
  onTogglePin,
}: TConversationCardProps) => {
  const { id, type, avatar, title, lastMessageTime, subtitle, pinIndex, unreadMessageCount } =
    conversationData
  const subtitleType = subtitle.type
  const subtitleContent = subtitle.content
  const pinIndexClass = getPinIndexClass(pinIndex)

  const handleExecuteTogglePin = () => {
    if (type === EChatType.DIRECT) {
      onTogglePin(id)
    } else {
      onTogglePin(undefined, id)
    }
  }

  return (
    <div
      className={`group flex gap-2 items-center px-3 py-2 w-full cursor-pointer hover:bg-regular-hover-card-cl rounded-lg ${pinIndexClass} group`}
      key={`${type}-${id}`}
      onClick={() => onNavToConversation(id, type)}
    >
      <div>
        <CustomAvatar
          src={avatar.src || undefined}
          imgSize={50}
          fallback={avatar.fallback.toUpperCase()}
          fallbackClassName="bg-regular-violet-cl text-2xl"
        />
      </div>
      <div className="w-[215px]">
        <div className="flex justify-between items-center w-full gap-3">
          <h3 className="truncate font-bold grow text-left leading-snug">{title}</h3>
          <div className="text-[10px] w-max min-w-max text-regular-icon-cl">
            {dayjs(lastMessageTime).format("MMM D, YYYY")}
          </div>
        </div>
        <div className="flex justify-between items-center mt-1 box-border gap-3">
          {subtitleType !== EMessageTypes.TEXT ? (
            <p className="truncate text-regular-placeholder-cl text-sm">
              <span className="text-regular-icon-cl italic">
                {convertSubtitleTypeToText(subtitleType, subtitleContent)}
              </span>
            </p>
          ) : (
            <p
              dangerouslySetInnerHTML={{
                __html: santizeMsgContent(subtitleContent),
              }}
              className="truncate opacity-60 text-regular-white-cl text-sm leading-normal STYLE-conversation-subtitle"
            ></p>
          )}
          <div className="flex items-center gap-1">
            {unreadMessageCount > 0 && (
              <span className="flex items-center gap-1 h-5">
                <span className="w-min px-1 h-full bg-regular-violet-cl rounded-full leading-none">
                  {unreadMessageCount > MAX_UNREAD_MESSAGES_COUNT
                    ? `${MAX_UNREAD_MESSAGES_COUNT}+`
                    : unreadMessageCount}
                </span>
              </span>
            )}
            <div className="flex items-center gap-1">
              <div
                className={`transition-opacity ${isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
              >
                <PinButton
                  isPinned={isPinned}
                  onToggle={handleExecuteTogglePin}
                  loading={pinLoading}
                  size={16}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
    pinService.togglePinConversation(directChatId, groupChatId).then((pinnedChat) => {
      if (pinnedChat) {
        fetchPinChatsByUserId()
      }
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
    if (type === EChatType.DIRECT && directChat) {
      const lastDirectChatData = localStorageManager.getLastDirectChatData()
      if (lastDirectChatData) {
        localStorageManager.setLastDirectChatData({
          tempId: directChat.id,
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
    eventEmitter.on(EInternalEvents.UNREAD_MESSAGES_COUNT, listenUnreadMessagesCount)
    eventEmitter.on(EInternalEvents.SEND_MESSAGE_DIRECT, listenSendMessage)
    return () => {
      clientSocket.socket.off(ESocketEvents.new_conversation, listenNewConversation)
      eventEmitter.off(EInternalEvents.UNREAD_MESSAGES_COUNT, listenUnreadMessagesCount)
      eventEmitter.off(EInternalEvents.SEND_MESSAGE_DIRECT, listenSendMessage)
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
      {conversations.map((conversation) => {
        return (
          <ConversationCard
            key={`${conversation.id}-${conversation.type}`}
            onNavToConversation={navToDirectChat}
            isPinned={isChatPinned(conversation.id, conversation.type)}
            pinLoading={pinLoading}
            conversationData={conversation}
            onTogglePin={handlePinToggle}
          />
        )
      })}
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
            className="w-full text-regular-white-cl hover:bg-regular-dark-gray-cl"
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

export const Conversations = () => {
  const [inputFocused, setInputFocused] = useState<boolean>(false)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [openGroupChat, setOpenGroupChat] = useState<boolean>(false)
  const globalSearchInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="relative w-convs-list h-full overflow-hidden">
      <div
        id="QUERY-conversations-list"
        className={`${openGroupChat ? "pointer-events-none" : ""} screen-medium-chatting:flex flex-col relative hidden w-full py-3 box-border h-full bg-regular-dark-gray-cl border-regular-hover-card-cl border-r`}
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
      </div>

      <AddMembersBoard open={openGroupChat} onOpen={setOpenGroupChat} />
    </div>
  )
}
