"use client"

import { CustomAvatar, CustomTooltip, toast } from "@/components/materials"
import { Search as SearchIcon, ArrowLeft, X } from "lucide-react"
import dayjs from "dayjs"
import { useDebounce } from "@/hooks/debounce"
import type { TGlobalSearchData } from "@/utils/types/be-api"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { ChangeEvent, Dispatch, SetStateAction, useRef, useState } from "react"
import { Spinner } from "@/components/materials/spinner"
import { IconButton } from "@/components/materials/icon-button"
import { useRouter } from "next/navigation"
import { sortDirectChatsByPinned } from "@/redux/conversations/conversations-selectors"
import { unwrapResult } from "@reduxjs/toolkit"
import Image from "next/image"
import { searchService } from "@/services/search.service"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { createPathWithParams } from "@/utils/helpers"
import { fetchDirectChatThunk } from "@/redux/conversations/conversations-thunks"

const MAX_NUMBER_OF_PINNED_CONVERSATIONS: number = 3

type TResultCardProps = {
   avatarUrl?: string
   convName: string
   textUnder: string
}

const ResultCard = ({ avatarUrl, convName, textUnder }: TResultCardProps) => {
   return (
      <CustomTooltip title="Click to open a chat" placement="right">
         <div className="flex w-full p-3 py-2 cursor-pointer hover:bg-regular-hover-card-cl rounded-xl gap-3">
            <div>
               {avatarUrl ? (
                  <CustomAvatar src={avatarUrl} imgSize={50} />
               ) : (
                  <CustomAvatar imgSize={50} fallback={convName[0]} />
               )}
            </div>
            <div className="flex flex-col justify-center gap-1">
               <span className="font-bold text-base">{convName}</span>
               <span className="text-xs text-regular-icon-cl">{textUnder}</span>
            </div>
         </div>
      </CustomTooltip>
   )
}

type TSearchResultProps = {
   loading: boolean
   searchResult: TGlobalSearchData
}

const SearchResult = ({ loading, searchResult }: TSearchResultProps) => {
   const { users, messages } = searchResult
   const router = useRouter()
   const dispatch = useAppDispatch()

   const startDirectChat = async () => {
      const res = await dispatch(fetchDirectChatThunk({ recipientId: id }))
      const convData = unwrapResult(res)
      router.push(createPathWithParams("/conversations", { cid: convData.id.toString() }))
   }

   return users && users.length && messages && messages.length ? (
      <div>
         <div>
            <h3 className="font-bold pl-3 pb-1 text-regular-icon-cl">Users</h3>
            <div>
               {users &&
                  users.length > 0 &&
                  users.map((user) => (
                     <ResultCard
                        key={user.id}
                        convName={user.fullName || "Unnamed"}
                        avatarUrl={user.avatarUrl}
                        textUnder={user.isOnline ? "Online" : "Offline"}
                     />
                  ))}
            </div>
         </div>
         <div>
            <h3 className="font-bold pl-3 pb-1 text-regular-icon-cl">Messages</h3>
            <div>
               {messages &&
                  messages.length > 0 &&
                  messages.map((message) => (
                     <ResultCard
                        key={message.id}
                        convName={message.conversationName}
                        textUnder={message.messageContent}
                        avatarUrl={message.avatarUrl}
                     />
                  ))}
            </div>
         </div>
      </div>
   ) : (
      <div className="flex justify-center items-center pt-5">
         {loading && <Spinner size="large" />}
      </div>
   )
}

const ConversationCards = () => {
   const directChats = useAppSelector(sortDirectChatsByPinned)

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

   return (
      directChats &&
      directChats.length > 0 &&
      directChats.map(({ id, avatar, lastMessageTime, pinIndex, subtitle, title }) => (
         <div
            className={`flex gap-x-2 items-center px-3 py-3 w-full cursor-pointer hover:bg-regular-hover-card-cl rounded-xl ${getPinIndexClass(pinIndex)}`}
            key={id}
         >
            <div>
               <CustomAvatar className="mt-auto" src={avatar} imgSize={50} />
            </div>
            <div className="w-[195px]">
               <div className="flex justify-between items-center w-full gap-3">
                  <h3 className="truncate font-bold w-fit">{title}</h3>
                  <div className="text-[10px] w-max text-regular-icon-cl">
                     {dayjs(lastMessageTime).format("MMM D, YYYY")}
                  </div>
               </div>
               <div className="flex justify-between items-center mt-1 box-border gap-3">
                  <p className="truncate text-regular-placeholder-cl">{subtitle}</p>
                  {pinIndex &&
                     pinIndex !== -1 &&
                     pinIndex <= MAX_NUMBER_OF_PINNED_CONVERSATIONS && (
                        <CustomTooltip title="This directChat was pinned" placement="bottom">
                           <Image
                              src="/icons/pinned-conv.svg"
                              alt="Pinned Icon"
                              width={21}
                              height={21}
                              color="#766ac8"
                           />
                        </CustomTooltip>
                     )}
               </div>
            </div>
         </div>
      ))
   )
}

type TGlobalSearchBarProps = {
   setIsSearching: Dispatch<SetStateAction<boolean>>
   setInputFocused: Dispatch<SetStateAction<boolean>>
   inputFocused: boolean
   setSearchResult: (result: TGlobalSearchData) => void
}

const GlobalSearchBar = ({
   setInputFocused,
   setIsSearching,
   inputFocused,
   setSearchResult,
}: TGlobalSearchBarProps) => {
   const inputRef = useRef<HTMLInputElement>(null)
   const debounce = useDebounce()

   const searchGlobally = debounce(async (e: ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value.trim()
      if (!inputValue) return
      setIsSearching(true)
      searchService
         .searchGlobally(inputValue)
         .then((res) => {
            setSearchResult(res)
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
   }

   return (
      <div className="flex gap-1 items-center px-2 box-border text-regular-placeholder-cl">
         <div
            className={`flex ${inputFocused ? "animate-appear-zoom-in-s40" : "animate-disappear-zoom-out-s40"}`}
         >
            <IconButton
               className="flex justify-center items-center h-[40px] w-[40px]"
               onClick={closeSearch}
               title={{ text: "Cancel" }}
            >
               <ArrowLeft color="currentColor" size={20} />
            </IconButton>
         </div>

         <div className="flex flex-auto relative w-full">
            <span className="absolute top-1/2 -translate-y-1/2 z-20 left-3">
               <SearchIcon color="currentColor" size={20} />
            </span>

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
               title={{ text: "Clear" }}
            >
               <X color="currentColor" />
            </IconButton>
         </div>
      </div>
   )
}

export const Conversations = () => {
   const [inputFocused, setInputFocused] = useState<boolean>(false)
   const [isSearching, setIsSearching] = useState<boolean>(false)
   const [searchResult, setSearchResult] = useState<TGlobalSearchData>()

   return (
      <div
         id="QUERY-conversations-list"
         className="screen-medium-chatting:flex flex-col hidden w-convs-list py-3 box-border h-full bg-regular-dark-gray-cl border-regular-hover-card-cl border-r"
      >
         <GlobalSearchBar
            setInputFocused={setInputFocused}
            setIsSearching={setIsSearching}
            inputFocused={inputFocused}
            setSearchResult={setSearchResult}
         />

         <div className="relative z-10 grow overflow-hidden">
            <div
               className={`${inputFocused ? "animate-super-zoom-out-fade-in" : "animate-super-zoom-in-fade-out"} py-5 absolute top-0 left-0 z-20 px-2 box-border w-full h-full overflow-x-hidden overflow-y-auto STYLE-styled-scrollbar`}
            >
               {searchResult ? (
                  <SearchResult loading={isSearching} searchResult={searchResult} />
               ) : (
                  <div className="flex justify-center items-center pt-5">
                     <p className="text-regular-icon-cl">No results found</p>
                  </div>
               )}
            </div>

            <div
               className={`${inputFocused ? "animate-zoom-fade-out" : "animate-zoom-fade-in"} !flex flex-col w-full absolute top-0 left-0 z-30 px-2 h-full overflow-x-hidden overflow-y-auto STYLE-styled-scrollbar`}
            >
               <ConversationCards />
            </div>
         </div>
      </div>
   )
}
