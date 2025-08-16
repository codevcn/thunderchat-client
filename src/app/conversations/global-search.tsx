"use client"

import { CustomAvatar, CustomTooltip, toast } from "@/components/materials"
import { Search as SearchIcon, ArrowLeft, X } from "lucide-react"
import { useDebounce } from "@/hooks/debounce"
import type {
  TGlobalSearchData,
  TUserSearchOffset,
  TMessageSearchOffset,
  TUserWithProfile,
} from "@/utils/types/be-api"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { ChangeEvent, Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import { Spinner } from "@/components/materials/spinner"
import { IconButton } from "@/components/materials/icon-button"
import { searchService } from "@/services/search.service"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { extractHighlightOffsets } from "@/utils/helpers"
import { directChatService } from "@/services/direct-chat.service"
import { EChatType } from "@/utils/enums"
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
import { resetAllChatData } from "@/redux/messages/messages.slice"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"

const SEARCH_LIMIT: number = 10

type TResultCardProps = {
  avatarUrl?: string
  convName: string
  subtitle: string
  highlights?: string[]
  onStartChat: () => void
  email?: string
  mediaContent?: string
}

const ResultCard = ({
  avatarUrl,
  convName,
  subtitle,
  highlights,
  onStartChat,
  email,
  mediaContent,
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
                {renderHighlightedContent(
                  subtitle || mediaContent || "",
                  extractHighlightOffsets(subtitle || mediaContent || "", highlights)
                )}
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
        const { directChat, groupChat } = getState().messages
        if (directChat?.id === chatId || groupChat?.id === chatId) {
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
      <div className="flex flex-col gap-2 h-full">
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
        <div className="pb-2 px-2 STYLE-styled-scrollbar overflow-y-auto grow">
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
                    mediaContent={message.mediaContent}
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

export const SearchSection = ({ inputFocused, globalSearchInputRef }: TSearchSectionProps) => {
  const globalSearchResult = useAppSelector((state) => state.search.globalSearchResult)

  return (
    <div
      className={`${inputFocused ? "animate-super-zoom-out-fade-in" : "animate-super-zoom-in-fade-out"} z-20 pt-2 absolute top-0 left-0 box-border w-full h-full overflow-hidden`}
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

export const GlobalSearchBar = ({
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

        {inputFocused && (
          <IconButton
            className="flex justify-center items-center right-1 h-[35px] w-[35px] absolute top-1/2 -translate-y-1/2 z-20"
            onClick={clearInput}
          >
            <X color="currentColor" />
          </IconButton>
        )}
      </div>
    </div>
  )
}
