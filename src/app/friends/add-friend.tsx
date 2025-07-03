"use client"

import axiosErrorHandler from "@/utils/axios-error-handler"
import { Search, Send, UserPlus } from "lucide-react"
import { useDebounce, useDebounceLeading } from "@/hooks/debounce"
import { Spinner } from "@/components/materials/spinner"
import { useUser } from "@/hooks/user"
import { userService } from "@/services/user.service"
import { useCallback, useRef, useState } from "react"
import type { TSearchUsersData } from "@/utils/types/be-api"
import {
   CustomAvatar,
   CustomDialog,
   CustomTooltip,
   DefaultAvatar,
   TextField,
} from "@/components/materials"
import { toast } from "@/components/materials"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { friendRequestService } from "@/services/friend-request.service"

type TUserCardProps = {
   item: TSearchUsersData
   loading: TLoading
   onSendFriendRequest: (recipientId: number) => void
}

const UserCard = ({ item, loading, onSendFriendRequest }: TUserCardProps) => {
   const profile = item.Profile
   const avatarSrc = profile?.avatar
   const fullName = profile?.fullName
   const email = item.email
   const recipientId = item.id

   return (
      <div className="hover:bg-regular-icon-btn-cl flex items-center gap-x-3 rounded-md py-2 px-3 relative">
         <CustomAvatar
            fallback={<DefaultAvatar size={45} />}
            src={avatarSrc || undefined}
            imgSize={45}
         />
         <div className="text-regular-white-cl w-full">
            {fullName && <p>{fullName}</p>}
            <p
               title={email}
               className="text-regular-icon-cl truncate leading-7 xs:max-w-[150px] sm:max-w-[200px] md:max-w-[400px] lg:max-w-[700px]"
            >
               {email}
            </p>
         </div>
         {loading === `user-card-${recipientId}` ? (
            <div className="absolute right-5 top-1/2 -translate-y-1/2">
               <Spinner size="small" />
            </div>
         ) : (
            <div
               onClick={() => onSendFriendRequest(recipientId)}
               className="absolute right-5 top-1/2 -translate-y-1/2 hover:scale-125 transition-transform"
            >
               <CustomTooltip title="Add friend" placement="bottom">
                  <Send className="text-regular-white-cl h-5 w-5 cursor-pointer" />
               </CustomTooltip>
            </div>
         )}
      </div>
   )
}

type TLoading = "searching-users" | `user-card-${number}` | undefined

export const AddFriend = () => {
   const [users, setUsers] = useState<TSearchUsersData[]>([])
   const [showModalAddFriend, setShowModalAddFriend] = useState<boolean>(false)
   const debounce = useDebounce()
   const [loading, setLoading] = useState<TLoading>(undefined)
   const user = useUser()!
   const debounceLeading = useDebounceLeading()
   const inputRef = useRef<HTMLInputElement>(null)

   const searchUsers = useCallback(
      debounce(async () => {
         const keyword = inputRef.current?.value
         if (keyword) {
            setLoading("searching-users")
            userService
               .searchUsers(keyword)
               .then((users) => {
                  setUsers(users)
               })
               .catch((error) => {
                  toast.error(axiosErrorHandler.handleHttpError(error).message)
               })
               .finally(() => {
                  setLoading(undefined)
               })
         }
      }, 300),
      []
   )

   const catchEnter = () => {
      if (!inputRef.current?.value) {
         toast.error("Please enter the keyword")
         return
      }
      searchUsers()
      return
   }

   const sendFriendRequest = debounceLeading(async (recipientId: number) => {
      setLoading(`user-card-${recipientId}`)
      friendRequestService
         .sendFriendRequest(user.id, recipientId)
         .then((res) => {
            toast.success("Sent friend request successfully!")
            eventEmitter.emit(EInternalEvents.SEND_FRIEND_REQUEST, res)
         })
         .catch((error) => {
            toast.error(axiosErrorHandler.handleHttpError(error).message)
         })
         .finally(() => {
            setLoading(undefined)
         })
   }, 2000)

   return (
      <div className="absolute top-5 right-5">
         <CustomDialog
            open={showModalAddFriend}
            dialogHeader={{
               title: "Add Friends",
               description: "Add friends to your friends list.",
            }}
            trigger={
               <button
                  onClick={() => setShowModalAddFriend(true)}
                  className="flex gap-x-1 font-medium items-center text-regular-icon-cl border-none px-3 py-1.5 border-2 hover:bg-regular-hover-card-cl rounded-md"
               >
                  <UserPlus className="h-5 w-5" />
                  <span className="text-[1rem]">Add Friend</span>
               </button>
            }
            onHideShow={setShowModalAddFriend}
            dialogBody={
               <div className="w-full my-4">
                  <TextField
                     placeholder="Enter email or user name here..."
                     classNames={{ input: "w-full py-1 text-base" }}
                     suffixIcon={<Search className="h-5 w-5" />}
                     onPressEnter={catchEnter}
                     onChange={searchUsers}
                     ref={inputRef}
                  />
                  <div className="flex flex-col gap-y-2 pr-1 mt-4 STYLE-styled-modal-scrollbar overflow-y-auto min-h-40 max-h-80">
                     {loading === "searching-users" ? (
                        <div className="flex w-full justify-center mt-5">
                           <Spinner color="text-white" className="h-7" />
                        </div>
                     ) : users && users.length > 0 ? (
                        users.map((item) => (
                           <UserCard
                              key={item.id}
                              item={item}
                              loading={loading}
                              onSendFriendRequest={sendFriendRequest}
                           />
                        ))
                     ) : (
                        <div className="w-full text-center text-regular-placeholder-cl">
                           No Users Found.
                        </div>
                     )}
                  </div>
               </div>
            }
         />
      </div>
   )
}
