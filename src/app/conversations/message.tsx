import { ETimeFormats } from "@/utils/enums"
import { santizeMsgContent } from "@/utils/helpers"
import { EMessageStatus } from "@/utils/socket/enums"
import type { TUserWithoutPassword } from "@/utils/types/be-api"
import type { TStateDirectMessage } from "@/utils/types/global"
import dayjs from "dayjs"
import { Check, CheckCheck } from "lucide-react"
import Image from "next/image"
import { CSS_VARIABLES } from "@/configs/css-variables"

type TContentProps = {
   content: string
   stickerUrl: string | null
}

const Content = ({ content, stickerUrl }: TContentProps) => {
   return content ? (
      <div
         className="max-w-full break-words whitespace-pre-wrap text-sm inline"
         dangerouslySetInnerHTML={{ __html: santizeMsgContent(content) }}
      ></div>
   ) : stickerUrl ? (
      <Image
         src={stickerUrl}
         alt="sticker"
         width={CSS_VARIABLES.STICKER.WIDTH}
         height={CSS_VARIABLES.STICKER.HEIGHT}
         priority
      />
   ) : (
      <></>
   )
}

type TStickyTimeProps = {
   stickyTime: string
}

const StickyTime = ({ stickyTime }: TStickyTimeProps) => {
   return (
      <div className="flex w-full py-2 text-regular-text-secondary-cl">
         <div className="m-auto py-0.5 px-1 cursor-pointer font-bold">{stickyTime}</div>
      </div>
   )
}

type TMessageProps = {
   message: TStateDirectMessage
   user: TUserWithoutPassword
   stickyTime: string | null
}

export const Message = ({ message, user, stickyTime }: TMessageProps) => {
   const { authorId, content, createdAt, isNewMsg, id, status, stickerUrl } = message

   const msgTime = dayjs(createdAt).format(ETimeFormats.HH_mm)

   return (
      <>
         {stickyTime && <StickyTime stickyTime={stickyTime} />}

         <div className="w-full text-regular-white-cl">
            {user.id === authorId ? (
               <div className={`QUERY-user-message-${id} flex justify-end w-full`}>
                  <div
                     className={`${isNewMsg ? "animate-new-user-message -translate-x-[3.5rem] translate-y-[1rem] opacity-0" : ""} ${stickerUrl ? "" : "bg-regular-violet-cl"} max-w-[70%] w-max rounded-t-2xl rounded-bl-2xl py-1.5 pb-1 pl-2 pr-1`}
                  >
                     <Content content={content} stickerUrl={stickerUrl} />
                     <div className="flex justify-end items-center gap-x-1 mt-1.5 w-full">
                        <span className="text-xs text-regular-creator-msg-time-cl leading-none">
                           {msgTime}
                        </span>
                        <div className="flex ml-0.5">
                           {status === EMessageStatus.SENT ? (
                              <Check size={15} />
                           ) : (
                              status === EMessageStatus.SEEN && <CheckCheck size={15} />
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            ) : (
               <div
                  className={`${isNewMsg || status === EMessageStatus.SENT ? "QUERY-unread-message" : ""} origin-left flex justify-start w-full`}
                  data-msg-id={id}
               >
                  <div
                     className={`${isNewMsg ? "animate-new-friend-message translate-x-[3.5rem] translate-y-[1rem] opacity-0" : ""} ${stickerUrl ? "" : "w-max bg-regular-dark-gray-cl"} max-w-[70%] rounded-t-2xl rounded-br-2xl pt-1.5 pb-1 px-2 relative`}
                  >
                     <Content content={content} stickerUrl={stickerUrl} />
                     <div className="flex justify-end items-center mt-1.5">
                        <span className="text-xs text-regular-creator-msg-time-cl">{msgTime}</span>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </>
   )
}
