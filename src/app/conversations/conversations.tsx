"use client"

import { CustomAvatar, CustomPopover, CustomTooltip, Skeleton, toast } from "@/components/materials"
import { Search as SearchIcon, ArrowLeft, X, Pin, Menu, Users } from "lucide-react"
import dayjs from "dayjs"
import { useDebounce } from "@/hooks/debounce"
import type { TGlobalSearchData, TUserWithProfile } from "@/utils/types/be-api"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { ChangeEvent, Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import { Spinner } from "@/components/materials/spinner"
import { IconButton } from "@/components/materials/icon-button"
import { sortDirectChatsByPinned } from "@/redux/conversations/conversations.selectors"
import { searchService } from "@/services/search.service"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { extractHighlightOffsets, santizeMsgContent } from "@/utils/helpers"
import { directChatService } from "@/services/direct-chat.service"
import { EChatType, EMessageTypes, EPaginations } from "@/utils/enums"
import { addConversations } from "@/redux/conversations/conversations.slice"
import { toaster } from "@/utils/toaster"
import { AddMembersBoard } from "./group/create-group-chat"
import { groupChatService } from "@/services/group-chat.service"
import { TConversationCard } from "@/utils/types/global"
import { useUser } from "@/hooks/user"
import { clearGlobalSearchResult, setGlobalSearchResult } from "@/redux/search/search.slice"
import { renderHighlightedContent } from "@/utils/tsx-helpers"
import { useNavToConversation } from "@/hooks/navigation"
import { setTempChatData } from "@/redux/messages/messages.slice"

const MAX_NUMBER_OF_PINNED_CONVERSATIONS: number = 3

type TResultCardProps = {
  avatarUrl?: string
  convName: string
  subtitle: string
  highlights?: string[]
  onStartChat: () => void
}

const ResultCard = ({
  avatarUrl,
  convName,
  subtitle,
  highlights,
  onStartChat,
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
            {highlights && highlights.length > 0 && (
              <span className="text-xs text-regular-icon-cl truncate w-full">
                {renderHighlightedContent(subtitle, extractHighlightOffsets(subtitle, highlights))}
              </span>
            )}
          </div>
        </div>
      </CustomTooltip>
    </div>
  )
}

type TSearchType = "users" | "messages"

type TSearchResultProps = {
  searchResult: TGlobalSearchData
}

const SearchResult = ({ searchResult }: TSearchResultProps) => {
  const { users, messages } = searchResult
  const [activeTab, setActiveTab] = useState<TSearchType>("users")
  const buttonsGroupRef = useRef<HTMLDivElement>(null)
  const navToConversation = useNavToConversation()
  const dispatch = useAppDispatch()
  const user = useUser()!
  console.log(">>> search result:", searchResult)

  const startChatHandler = async (
    type: "users" | "messages",
    chatType: EChatType,
    chatId?: number,
    otherUser?: TUserWithProfile
  ) => {
    console.log(">>> start chat params:", { type, chatType, chatId, otherUser })
    if (type === "messages" && chatId) {
      navToConversation(chatId, chatType)
    } else if (type === "users" && otherUser) {
      const otherUserId = otherUser.id
      directChatService.findConversationWithOtherUser(otherUserId).then((directChat) => {
        if (directChat) {
          navToConversation(directChat.id, EChatType.DIRECT)
        } else {
          dispatch(
            setTempChatData({
              id: -1,
              createdAt: new Date().toISOString(),
              creatorId: user.id,
              recipientId: otherUserId,
              Creator: {
                id: user.id,
                email: user.email,
                password: user.password,
                createdAt: user.createdAt,
                Profile: user.Profile,
              },
              Recipient: {
                id: otherUserId,
                email: "",
                password: "",
                createdAt: "",
                Profile: otherUser.Profile,
              },
              lastSentMessageId: undefined,
            })
          )
          navToConversation(-1, EChatType.DIRECT)
        }
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

  useEffect(() => {
    setupActiveTab()
  }, [searchResult])

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
        <div className="pt-2 px-2 STYLE-styled-scrollbar">
          <div hidden={activeTab !== "users"} className="w-full">
            {usersExist &&
              users.map((user) => (
                <ResultCard
                  key={user.id}
                  avatarUrl={user.Profile.avatar}
                  convName={user.Profile.fullName || ""}
                  subtitle={""}
                  onStartChat={() => startChatHandler("users", EChatType.DIRECT, undefined, user)}
                />
              ))}
          </div>
          <div hidden={activeTab !== "messages"} className="w-full">
            {messagesExist &&
              messages.map((message) => (
                <ResultCard
                  key={message.id}
                  convName={message.conversationName}
                  subtitle={message.messageContent}
                  highlights={message.highlights}
                  onStartChat={() => startChatHandler("messages", message.chatType, message.chatId)}
                />
              ))}
          </div>
        </div>
      </div>
    )
  )
}

type TSearchSectionProps = {
  inputFocused: boolean
}

const SearchSection = ({ inputFocused }: TSearchSectionProps) => {
  const globalSearchResult = useAppSelector((state) => state.search.globalSearchResult)

  return (
    <div
      className={`${inputFocused ? "animate-super-zoom-out-fade-in" : "animate-super-zoom-in-fade-out"} z-20 pt-2 pb-5 absolute top-0 left-0 box-border w-full h-full overflow-x-hidden overflow-y-auto STYLE-styled-scrollbar`}
    >
      {globalSearchResult ? (
        <SearchResult searchResult={globalSearchResult} />
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
}

const GlobalSearchBar = ({
  setInputFocused,
  setIsSearching,
  inputFocused,
  isSearching,
}: TGlobalSearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const debounce = useDebounce()
  const dispatch = useAppDispatch()

  const searchGlobally = debounce(async (e: ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.trim()
    if (!inputValue) return
    setIsSearching(true)
    searchService
      .searchGlobally(inputValue)
      .then((res) => {
        dispatch(setGlobalSearchResult(res))
      })
      .catch((err) => {
        toast.error(axiosErrorHandler.handleHttpError(err).message)
      })
      .finally(() => {
        setIsSearching(false)
      })
  }, 300)

  const closeSearch = () => {
    if (inputRef.current?.value) inputRef.current.value = ""
    setInputFocused(false)
  }

  const clearInput = () => {
    if (inputRef.current?.value) inputRef.current.value = ""
    dispatch(clearGlobalSearchResult())
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
          ref={inputRef}
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

const ConversationCards = () => {
  const dispatch = useAppDispatch()
  const conversations = useAppSelector(sortDirectChatsByPinned)
  const directChatLastId = useRef<number | undefined>(undefined)
  const groupChatLastId = useRef<number | undefined>(undefined)
  const tempFlagUseEffectRef = useRef<boolean>(true)
  const navToConversation = useNavToConversation()
  const [loading, setLoading] = useState<boolean>(false)
  const user = useUser()!

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
        groupChatLastId.current
      )
    } catch (err) {
      toaster.error(axiosErrorHandler.handleHttpError(err).message)
    } finally {
      setLoading(false)
    }
    return []
  }

  const sortConversations = (conversations: TConversationCard[]) => {
    // sort by lastMessageTime, if not have lastMessageTime, sort by createdAt
    conversations.sort((a, b) => {
      const getTimestamp = (chat: TConversationCard) => {
        return new Date(chat.lastMessageTime ?? chat.createdAt).getTime()
      }
      return getTimestamp(b) - getTimestamp(a) // Mới nhất lên đầu
    })
    return conversations
  }

  const fetchConversations = async () => {
    const [directChats, groupChats] = await Promise.all([fetchDirectChats(), fetchGroupChats()])
    const sortedChats = sortConversations([...directChats, ...groupChats])
    dispatch(addConversations(sortedChats))
  }

  const navToDirectChat = (id: number, type: EChatType) => {
    navToConversation(id, type)
  }

  useEffect(() => {
    if (tempFlagUseEffectRef.current) {
      tempFlagUseEffectRef.current = false
      if (!conversations || conversations.length === 0) {
        fetchConversations()
      }
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
    <div className="flex flex-col w-full h-full mt-3 overflow-x-hidden overflow-y-auto STYLE-styled-scrollbar">
      {conversations.map(({ id, avatar, lastMessageTime, pinIndex, subtitle, title, type }) => (
        <div
          className={`flex gap-2 items-center px-3 py-2 w-full cursor-pointer hover:bg-regular-hover-card-cl rounded-lg ${getPinIndexClass(pinIndex)}`}
          key={`${type}-${id}`}
          onClick={() => navToDirectChat(id, type)}
        >
          <div>
            <CustomAvatar
              src={avatar.src || undefined}
              imgSize={50}
              fallback={avatar.fallback.toUpperCase()}
              fallbackClassName="bg-regular-violet-cl text-2xl"
            />
          </div>
          <div className="w-[195px]">
            <div className="flex justify-between items-center w-full gap-3">
              <h3 className="truncate font-bold grow text-left">{title}</h3>
              <div className="text-[10px] w-max text-regular-icon-cl">
                {dayjs(lastMessageTime).format("MMM D, YYYY")}
              </div>
            </div>
            <div className="flex justify-between items-center mt-1 box-border gap-3">
              {subtitle.type === EMessageTypes.STICKER ? (
                <p className="truncate text-regular-placeholder-cl text-sm">
                  <span className="text-regular-icon-cl italic">Sticker</span>
                </p>
              ) : (
                <p className="truncate text-regular-placeholder-cl text-sm">
                  {santizeMsgContent(subtitle.content)}
                </p>
              )}
              {!!pinIndex && pinIndex !== -1 && pinIndex <= MAX_NUMBER_OF_PINNED_CONVERSATIONS && (
                <CustomTooltip title="This directChat was pinned" placement="bottom">
                  <Pin color="currentColor" size={21} />
                </CustomTooltip>
              )}
            </div>
          </div>
        </div>
      ))}
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
        />

        <div className="relative z-10 grow overflow-hidden">
          <SearchSection inputFocused={inputFocused} />

          <div
            className={`${inputFocused ? "animate-zoom-fade-out" : "animate-zoom-fade-in"} w-full h-full absolute top-0 left-0 z-30 px-2`}
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
