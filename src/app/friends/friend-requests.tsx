"use client"

import type { TGetFriendRequestsData, TUserWithoutPassword } from "@/utils/types/be-api"
import { CustomAvatar, CustomDropdown, DefaultAvatar } from "@/components/materials"
import { Spinner } from "@/components/materials/spinner"
import { useUser } from "@/hooks/user"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { displayTimeDifference } from "@/utils/date-time"
import { EFriendRequestStatus } from "@/utils/enums"
import {
   ArrowLeft,
   ArrowRight,
   Repeat,
   CheckCircle,
   Filter,
   Trash,
   CheckCheck,
   X,
   Mail,
} from "lucide-react"
import { CustomTooltip } from "@/components/materials"
import { useEffect, useMemo, useRef, useState } from "react"
import { EPaginations } from "@/utils/enums"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { toast } from "@/components/materials"
import { handleEventDelegation } from "@/utils/helpers"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"
import type { TFriendRequestPayload } from "@/utils/types/socket"
import { friendRequestService } from "@/services/friend-request.service"

type TRequestCardProps = {
   req: TGetFriendRequestsData
   loading: TLoading | null
   user: TUserWithoutPassword
}

const RequestCard = ({ req, loading, user }: TRequestCardProps) => {
   const { Sender, createdAt, id, status, Recipient } = req
   const senderId = Sender.id
   const isSentRequest = user.id === senderId

   let userInfo = Sender
   if (isSentRequest) {
      userInfo = Recipient
   }

   const { Profile, email } = userInfo

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
                  <span className="text-sm text-regular-placeholder-cl">{` (${displayTimeDifference(createdAt)})`}</span>
               </div>
               <div className="text-sm text-regular-icon-cl">
                  <span>{isSentRequest ? `Sent to ${email}` : `Received from ${email}`}</span>
               </div>
            </div>
         </div>
         {status === EFriendRequestStatus.PENDING ? (
            isSentRequest ? (
               <div className="px-3 py-2 rounded-md text-regular-black-cl bg-regular-white-cl">
                  Pending
               </div>
            ) : (
               <div className="flex items-center gap-x-5">
                  {loading === `request-card-ACCEPTED-${id}` ? (
                     <Spinner size="small" />
                  ) : (
                     <CustomTooltip title="Accept" placement="bottom">
                        <div
                           data-request-info={JSON.stringify({
                              requestId: id,
                              friendEmail: email,
                              action: EFriendRequestStatus.ACCEPTED,
                              senderId,
                           })}
                           className="QUERY-request-card-action hover:scale-125 cursor-pointer transition-transform"
                        >
                           <CheckCircle size={20} />
                        </div>
                     </CustomTooltip>
                  )}
                  {loading === `request-card-REJECTED-${id}` ? (
                     <Spinner size="small" />
                  ) : (
                     <CustomTooltip title="Reject" placement="bottom">
                        <div
                           data-request-info={JSON.stringify({
                              requestId: id,
                              friendEmail: email,
                              action: EFriendRequestStatus.REJECTED,
                              senderId,
                           })}
                           className="QUERY-request-card-action hover:scale-125 cursor-pointer transition-transform"
                        >
                           <Trash size={20} className="text-regular-red-cl" />
                        </div>
                     </CustomTooltip>
                  )}
               </div>
            )
         ) : status === EFriendRequestStatus.ACCEPTED ? (
            <CustomTooltip title="The invitation has been accepted." placement="bottom">
               <div className="px-3 py-2 rounded-md text-regular-white-cl bg-regular-green-cl">
                  <CheckCheck size={20} />
               </div>
            </CustomTooltip>
         ) : (
            <CustomTooltip title="The invitation has been rejected." placement="bottom">
               <div className="px-3 py-2 rounded-md text-regular-white-cl bg-regular-red-cl">
                  <X size={20} />
               </div>
            </CustomTooltip>
         )}
      </div>
   )
}

type TLoadMoreBtnProps = {
   onLoadMore: () => void
   hidden: boolean
}

const LoadMoreBtn = ({ onLoadMore, hidden }: TLoadMoreBtnProps) => {
   const [isLastRequest, setIsLastRequest] = useState<boolean>(false)

   useEffect(() => {
      const handleLastFriendRequest = () => {
         setIsLastRequest(true)
      }

      eventEmitter.on(EInternalEvents.LAST_FRIEND_REQUEST, handleLastFriendRequest)

      return () => {
         eventEmitter.removeListener(EInternalEvents.LAST_FRIEND_REQUEST, handleLastFriendRequest)
      }
   }, [])

   return (
      <div className="flex mt-7" hidden={isLastRequest || hidden}>
         <button
            onClick={onLoadMore}
            className="hover:bg-regular-hover-bgcl m-auto cursor-pointer px-5 py-2 rounded-md bg-regular-button-bgcl"
         >
            Load More
         </button>
      </div>
   )
}

enum EFilterLabels {
   ALL = "All",
   SENT = "Sent",
   RECEIVED = "Received",
}

type TLoading =
   | "friend-requests"
   | `request-card-${EFriendRequestStatus.ACCEPTED | EFriendRequestStatus.REJECTED}-${number}`
   | undefined

type TMenuItemProps = {
   children: React.JSX.Element | React.JSX.Element[]
   type: EFilterLabels
}

type TFriendRequestActionsParams = {
   action: EFriendRequestStatus.ACCEPTED | EFriendRequestStatus.REJECTED
   friendEmail: string
   requestId: number
   senderId: number
}

export const FriendRequests = () => {
   const [requests, setRequests] = useState<TGetFriendRequestsData[]>([])
   const [loading, setLoading] = useState<TLoading>(undefined)
   const user = useUser()
   const [filter, setFilter] = useState<EFilterLabels>(EFilterLabels.ALL)
   const tempFlagUseEffectRef = useRef<boolean>(true)

   const updateRequest = (reqId: number, action: EFriendRequestStatus) => {
      setRequests((pre) =>
         pre.map((req) => {
            if (req.id === reqId) {
               return {
                  ...req,
                  status: action,
               }
            }
            return req
         })
      )
   }

   const filterRequests = (requests: TGetFriendRequestsData[]): TGetFriendRequestsData[] => {
      switch (filter) {
         case EFilterLabels.SENT:
            return requests.filter((req) => req.Sender.id === user!.id)
         case EFilterLabels.RECEIVED:
            return requests.filter((req) => req.Sender.id !== user!.id)
      }
      return requests
   }

   const filteredRequests = useMemo(() => {
      if (requests && requests.length > 0) {
         return filterRequests(requests)
      }
      return requests
   }, [filter, requests])

   const fetchFriendRequests = async (lastFriendRequestId?: number) => {
      setLoading("friend-requests")
      friendRequestService
         .getFriendRequests({
            limit: EPaginations.FRIEND_REQUESTS_PAGE_SIZE,
            userId: user!.id,
            lastFriendRequestId,
         })
         .then((requests) => {
            if (requests && requests.length > 0) {
               setRequests((pre) => {
                  return [...pre, ...requests]
               })
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

   const listenSendFriendRequest = (requestData: TGetFriendRequestsData) => {
      setRequests((pre) => {
         /*
          * Check if the request is already in the list
          * If it is, update the request
          * If it is not, insert the request to start of the list
          */
         let updated: boolean = false
         const updatedRequests = pre.map((req) => {
            if (req.id === requestData.id) {
               updated = true
               return {
                  ...req,
                  ...requestData,
               }
            }
            return req
         })
         if (!updated) {
            return [requestData, ...pre]
         }
         return updatedRequests
      })
   }

   const handleFriendRequestActions = (e: React.MouseEvent<HTMLDivElement>) => {
      const dataset = handleEventDelegation<TFriendRequestActionsParams>(e, {
         datasetName: "data-request-info",
         className: "QUERY-request-card-action",
      })
      if (!dataset) return
      const { action, friendEmail, requestId, senderId } = dataset
      setLoading(`request-card-${action}-${requestId}`)
      friendRequestService
         .friendRequestAction({ action, requestId, senderId })
         .then(() => {
            if (action === EFriendRequestStatus.ACCEPTED) {
               toast.success(`The user ${friendEmail} now becomes your friend.`)
            } else {
               toast.success(`You rejected invitation of the user ${friendEmail}.`)
            }
            updateRequest(requestId, action)
         })
         .catch((error) => {
            toast.error(axiosErrorHandler.handleHttpError(error).message)
         })
         .finally(() => {
            setLoading(undefined)
         })
   }

   const onLoadMore = () => {
      if (requests) {
         const requestsLen = requests.length
         if (requestsLen > 0) {
            fetchFriendRequests(requests[requestsLen - 1].id)
         }
      }
   }

   const listenFriendRequestAction = (payload: TFriendRequestPayload) => {
      const { requestId, action } = payload
      updateRequest(requestId, action)
   }

   useEffect(() => {
      if (tempFlagUseEffectRef.current) {
         tempFlagUseEffectRef.current = false
         if (!requests || requests.length === 0) {
            fetchFriendRequests()
         }
      }
      clientSocket.socket.on(ESocketEvents.friend_request_action, listenFriendRequestAction)
      eventEmitter.on(EInternalEvents.SEND_FRIEND_REQUEST, listenSendFriendRequest)
      return () => {
         eventEmitter.removeListener(EInternalEvents.SEND_FRIEND_REQUEST, listenSendFriendRequest)
      }
   }, [])

   const MenuItem = ({ children, type }: TMenuItemProps) => (
      <button
         className={`flex gap-x-2 w-full p-2 border-none text-regular-icon-cl outline-none hover:bg-regular-hover-card-cl rounded-md ${filter === type ? "text-regular-white-cl" : ""}`}
         onClick={() => setFilter(type)}
      >
         {children}
      </button>
   )

   return (
      <div className="mt-2 border-t border-regular-hover-card-cl border-solid pt-3">
         <div className="mb-4">
            <CustomDropdown
               triggerButton={
                  <button className="flex items-center gap-x-2 px-4 py-2 outline-none border-none rounded-md text-regular-icon-cl bg-regular-modal-board-bgcl">
                     <Filter className="h-5 w-5" />
                     <span className="text-lg leading-none font-medium">{filter}</span>
                  </button>
               }
               align="start"
            >
               <MenuItem type={EFilterLabels.ALL}>
                  <Repeat className="h-5 w-5" />
                  <span>All</span>
               </MenuItem>
               <MenuItem type={EFilterLabels.SENT}>
                  <ArrowRight className="h-5 w-5" />
                  <span>Sent</span>
               </MenuItem>
               <MenuItem type={EFilterLabels.RECEIVED}>
                  <ArrowLeft className="h-5 w-5" />
                  <span>Received</span>
               </MenuItem>
            </CustomDropdown>
         </div>
         <div onClick={handleFriendRequestActions}>
            {filteredRequests && filteredRequests.length > 0
               ? filteredRequests.map((req) => (
                    <RequestCard key={req.id} req={req} loading={loading} user={user!} />
                 ))
               : !loading && (
                    <div className="flex flex-col items-center gap-4 mt-8">
                       <Mail className="w-16 h-16 text-regular-icon-cl" />
                       <h3 className="text-lg font-medium text-regular-icon-cl text-center">
                          No friend requests yet
                       </h3>
                       <p className="text-sm text-regular-icon-cl text-center max-w-[300px]">
                          You can add friends by clicking the Add Friend button in the page corner
                       </p>
                    </div>
                 )}
         </div>
         <div className="flex w-full justify-center mt-5" hidden={!(loading === "friend-requests")}>
            <Spinner size="medium" />
         </div>
         {filteredRequests && filteredRequests.length > 0 && !loading && (
            <LoadMoreBtn onLoadMore={onLoadMore} hidden={loading === "friend-requests"} />
         )}
      </div>
   )
}
