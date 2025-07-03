"use client"

import type { TGetFriendsData } from "@/utils/types/be-api"
import { CustomAvatar, DefaultAvatar } from "@/components/materials"
import { Spinner } from "@/components/materials/spinner"
import { useUser } from "@/hooks/user"
import { friendService } from "@/services/friend.service"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { displayTimeDifference } from "@/utils/date-time"
import { useEffect, useMemo, useRef, useState } from "react"
import { EPaginations } from "@/utils/enums"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { toast } from "@/components/materials"
import { Contact } from "lucide-react"

type TFriendCardProps = {
   friend: TGetFriendsData
}

const FriendCard = ({ friend }: TFriendCardProps) => {
   const { Recipient, createdAt } = friend
   const { Profile, email } = Recipient

   return (
      <div className="flex justify-between items-center w-full mb-3 gap-x-5 px-4 py-3 bg-regular-modal-board-bgcl rounded-md">
         <div className="flex items-center gap-x-3">
            <div>
               <CustomAvatar
                  fallback={<DefaultAvatar size={45} />}
                  src={Profile?.avatar || undefined}
                  imgSize={45}
               />
            </div>
            <div className="h-fit">
               <div>
                  <span className="mb-1 font-bold">{Profile?.fullName || "Unnamed"}</span>
               </div>
               <div className="text-sm text-regular-icon-cl">
                  <span>{email}</span>
               </div>
            </div>
         </div>
         <div className="text-regular-placeholder-cl">
            {`Be friend ${displayTimeDifference(createdAt)}`}
         </div>
      </div>
   )
}

type TLoadMoreBtnProps = {
   onLoadMore: () => void
   hidden: boolean
}

const LoadMoreBtn = ({ onLoadMore, hidden }: TLoadMoreBtnProps) => {
   const [isLastFriend, setIsLastFriend] = useState<boolean>(false)

   useEffect(() => {
      const handleLastFriend = () => {
         setIsLastFriend(true)
      }

      eventEmitter.on(EInternalEvents.LAST_FRIEND_REQUEST, handleLastFriend)

      return () => {
         eventEmitter.removeListener(EInternalEvents.LAST_FRIEND_REQUEST, handleLastFriend)
      }
   }, [])

   return (
      <div className="flex mt-7" hidden={isLastFriend || hidden}>
         <button
            onClick={onLoadMore}
            className="hover:bg-regular-hover-bgcl m-auto cursor-pointer px-5 py-2 rounded-md bg-regular-button-bgcl"
         >
            Load More
         </button>
      </div>
   )
}

type TLoading = "friends" | undefined

export const FriendsList = () => {
   const [friends, setFriends] = useState<TGetFriendsData[]>([])
   const [loading, setLoading] = useState<TLoading>(undefined)
   const user = useUser()
   const tempFlagUseEffectRef = useRef<boolean>(true)

   const filteredFriends = useMemo(() => {
      return friends
   }, [friends])

   const getFriendsHandler = async (lastFriendId?: number) => {
      setLoading("friends")
      friendService
         .getFriends({
            limit: EPaginations.FRIENDS_PAGE_SIZE,
            userId: user!.id,
            lastFriendId,
         })
         .then((friends) => {
            if (friends && friends.length > 0) {
               setFriends((pre) => [...pre, ...friends])
            } else {
               eventEmitter.emit(EInternalEvents.LAST_FRIEND_REQUEST)
            }
         })
         .catch((error) => {
            toast.error(axiosErrorHandler.handleHttpError(error).message)
         })
         .finally(() => {
            setLoading(undefined)
         })
   }

   useEffect(() => {
      if (tempFlagUseEffectRef.current) {
         tempFlagUseEffectRef.current = false
         if (!friends || friends.length === 0) {
            getFriendsHandler()
         }
      }
   }, [])

   const onLoadMore = () => {
      if (friends) {
         const friendsLen = friends.length
         if (friendsLen > 0) {
            getFriendsHandler(friends[friendsLen - 1].id)
         }
      }
   }

   return (
      <div className="mt-2 border-t border-regular-hover-card-cl border-solid pt-3">
         <div>
            {filteredFriends && filteredFriends.length > 0
               ? filteredFriends.map((friend) => <FriendCard key={friend.id} friend={friend} />)
               : !loading && (
                    <div className="flex flex-col items-center gap-4 mt-8">
                       <Contact className="w-16 h-16 text-regular-icon-cl" />
                       <h3 className="text-lg font-medium text-regular-icon-cl text-center">
                          No friends yet
                       </h3>
                       <p className="text-sm text-regular-icon-cl text-center max-w-[300px]">
                          You can add friends by clicking the Add Friend button in the page corner
                       </p>
                    </div>
                 )}
         </div>
         <div className="flex w-full justify-center mt-5" hidden={!loading}>
            <Spinner size="medium" />
         </div>
         <LoadMoreBtn onLoadMore={onLoadMore} hidden={loading === "friends"} />
      </div>
   )
}
