import { useAppSelector } from "@/hooks/redux"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { ArrowDown } from "lucide-react"
import { useEffect, useState, memo } from "react"
import { CounterBadge } from "@/components/materials"

export const ScrollToBottomMessageBtn = memo(() => {
   const [showScrollBtn, setShowScrollBtn] = useState<boolean>(false)
   const { infoBarIsOpened } = useAppSelector(({ conversations }) => conversations)
   const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0)

   const scrollToBottomMessage = () => {
      eventEmitter.emit(EInternalEvents.SCROLL_TO_BOTTOM_MSG_ACTION)
   }

   useEffect(() => {
      eventEmitter.on(EInternalEvents.SCROLL_OUT_OF_BOTTOM, () => {
         setShowScrollBtn(true)
      })
      eventEmitter.on(EInternalEvents.SCROLL_TO_BOTTOM_MSG_UI, () => {
         setShowScrollBtn(false)
      })
      eventEmitter.on(EInternalEvents.UNREAD_MESSAGES_COUNT, (count: number) => {
         setUnreadMessagesCount(count)
      })
      return () => {
         eventEmitter.removeAllListeners(EInternalEvents.SCROLL_OUT_OF_BOTTOM)
         eventEmitter.removeAllListeners(EInternalEvents.SCROLL_TO_BOTTOM_MSG_UI)
         eventEmitter.removeAllListeners(EInternalEvents.UNREAD_MESSAGES_COUNT)
      }
   }, [])

   useEffect(() => {
      if (unreadMessagesCount > 0) {
         setShowScrollBtn(true)
      }
   }, [unreadMessagesCount])

   return (
      <div
         onClick={scrollToBottomMessage}
         className={`${showScrollBtn ? "bottom-24 opacity-100" : "-bottom-20 opacity-0"} z-50 fixed right-5 cursor-pointer transition-[bottom,opacity] duration-200`}
      >
         <div
            className={`${infoBarIsOpened ? "translate-x-slide-header-icons" : "translate-x-0"} relative transition duration-300 ease-slide-info-bar-timing flex text-gray-400 items-center justify-center rounded-full h-6 w-6 bg-[#212121] p-4 box-content hover:bg-regular-violet-cl hover:text-white`}
         >
            {unreadMessagesCount > 0 && (
               <CounterBadge
                  count={unreadMessagesCount}
                  className="absolute -top-2 right-0 h-6 w-6 rounded-full"
               />
            )}
            <ArrowDown color="currentColor" />
         </div>
      </div>
   )
})
