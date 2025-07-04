"use client"

// >>> fix this: remove
import { dev_test_values } from "../../../temp/test"

import { CustomAvatar, CustomTooltip, Skeleton } from "@/components/materials"
import { IconButton } from "@/components/materials/icon-button"
import { Messages } from "./messages"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import validator from "validator"
import { Search, Phone, MoreVertical, User } from "lucide-react"
import { InfoBar } from "./info-bar"
import { openInfoBar } from "@/redux/conversations/conversations-slice"
import { setLastSeen } from "@/utils/helpers"
import { fetchDirectChatThunk } from "@/redux/conversations/conversations-thunks"
import { TypeMessageBar } from "./type-message-bar"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"

const TypingIndicator = () => {
   return (
      <div className="flex items-center gap-2">
         <div className="flex items-center gap-1 grow pt-1">
            <span className="w-1 h-1 bg-regular-placeholder-cl rounded-full animate-typing-message delay-0"></span>
            <span className="w-1 h-1 bg-regular-placeholder-cl rounded-full animate-typing-message delay-150"></span>
            <span className="w-1 h-1 bg-regular-placeholder-cl rounded-full animate-typing-message delay-300"></span>
         </div>
         <p className="text-xs text-regular-placeholder-cl font-semibold">The user is typing...</p>
      </div>
   )
}

type THeaderProps = {
   infoBarIsOpened: boolean
   onOpenInfoBar: (open: boolean) => void
}

const Header = ({ infoBarIsOpened, onOpenInfoBar }: THeaderProps) => {
   const recipient = useAppSelector(({ messages }) => messages.directChat?.Recipient)
   const [isTyping, setIsTyping] = useState<boolean>(false)

   const handleTypingMessage = (typing: boolean) => {
      setIsTyping(typing)
   }

   useEffect(() => {
      clientSocket.socket.on(ESocketEvents.typing_direct, handleTypingMessage)
      return () => {
         clientSocket.socket.removeListener(ESocketEvents.typing_direct, handleTypingMessage)
      }
   }, [])

   return (
      <div className="flex justify-between gap-2 px-6 py-1.5 bg-regular-dark-gray-cl w-full box-border h-header">
         {recipient ? (
            <CustomTooltip title="View user info" placement="bottom">
               <div className="flex gap-2 cursor-pointer" onClick={() => onOpenInfoBar(true)}>
                  {recipient.Profile && recipient.Profile.avatar ? (
                     <CustomAvatar src={recipient.Profile.avatar} imgSize={45} />
                  ) : (
                     <CustomAvatar
                        imgSize={45}
                        fallback={
                           recipient.Profile?.fullName[0] || <User size={25} color="white" />
                        }
                        className="bg-user-avt-bgimg text-white"
                     />
                  )}
                  <div className="flex flex-col">
                     <h3 className="text-lg font-bold w-fit text-white">
                        {recipient.Profile?.fullName || "Unnamed"}
                     </h3>
                     {isTyping ? (
                        <TypingIndicator />
                     ) : (
                        <div className="text-xs text-regular-text-secondary-cl">
                           {"Last seen " + setLastSeen(dev_test_values.user_1.lastOnline)}
                        </div>
                     )}
                  </div>
               </div>
            </CustomTooltip>
         ) : (
            <div className="gap-2">
               <Skeleton className="h-11 w-11 rounded-full bg-[#b8b8b826]" />
               <div className="flex flex-col justify-between h-full">
                  <Skeleton className="h-5 w-[100px] bg-[#b8b8b826]" />
                  <Skeleton className="h-5 w-[150px] bg-[#b8b8b826]" />
               </div>
            </div>
         )}

         <div
            className={`${infoBarIsOpened ? "screen-large-chatting:translate-x-slide-header-icons" : "translate-x-0"} flex items-center gap-2 transition duration-300 ease-slide-info-bar-timing`}
         >
            <CustomTooltip title="Search this chat" placement="bottom" align="end">
               <div>
                  <IconButton className="flex justify-center items-center text-regular-icon-cl w-[40px] h-[40px]">
                     <Search />
                  </IconButton>
               </div>
            </CustomTooltip>

            <CustomTooltip title="Call" placement="bottom" align="end">
               <div>
                  <IconButton className="flex justify-center items-center text-regular-icon-cl w-[40px] h-[40px]">
                     <Phone />
                  </IconButton>
               </div>
            </CustomTooltip>

            <CustomTooltip title="More actions" placement="bottom" align="end">
               <div>
                  <IconButton className="flex justify-center items-center text-regular-icon-cl w-[40px] h-[40px]">
                     <MoreVertical />
                  </IconButton>
               </div>
            </CustomTooltip>
         </div>
      </div>
   )
}

// const TestDisconnectSocket = () => {
//    const handleDisOrConnect = async () => {
//       if (clientSocket.socket.connected) {
//          clientSocket.socket.disconnect()
//       } else {
//          clientSocket.socket.connect()
//       }
//    }

//    return (
//       <div className="fixed top-0 left-1/2">
//          <button className="px-3 py-2 bg-black text-white" onClick={handleDisOrConnect}>
//             Dis / connect
//          </button>
//       </div>
//    )
// }

export const Chat = () => {
   const { directChat } = useAppSelector(({ messages }) => messages)
   const dispatch = useAppDispatch()
   const searchParams = useSearchParams()
   const [directChatId, setDirectChatId] = useState<number>()
   const { infoBarIsOpened } = useAppSelector(({ conversations }) => conversations)

   const hanldeOpenInfoBar = async (open: boolean) => {
      dispatch(openInfoBar(open))
   }

   useEffect(() => {
      const directChatId = searchParams.get("cid")
      if (directChatId && validator.isNumeric(directChatId)) {
         const convId = parseInt(directChatId)
         setDirectChatId(convId)
         dispatch(fetchDirectChatThunk(convId))
      }
   }, [])

   return (
      directChatId &&
      directChat && (
         <div className="screen-medium-chatting:w-chat-n-info-container flex w-full box-border overflow-hidden relative">
            <div className="flex flex-col items-center w-full box-border h-screen bg-no-repeat bg-transparent bg-cover bg-center relative">
               <Header infoBarIsOpened={infoBarIsOpened} onOpenInfoBar={hanldeOpenInfoBar} />
               <div
                  className={`${infoBarIsOpened ? "screen-large-chatting:translate-x-slide-chat-container screen-large-chatting:w-msgs-container" : "translate-x-0 w-full"} flex flex-col justify-between items-center h-chat-container transition duration-300 ease-slide-info-bar-timing overflow-hidden`}
               >
                  <Messages directChat={directChat} />

                  <TypeMessageBar directChat={directChat} />
               </div>
            </div>
            <InfoBar />
         </div>
      )
   )
}
