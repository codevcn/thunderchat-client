"use client"

import { useEffect, useRef } from "react"
import { localStorageManager } from "@/utils/local-storage"
import { RootLayoutContext } from "@/contexts/root-layout.context"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"
import { getPathWithQueryString } from "@/utils/helpers"
import type { TGetFriendRequestsData, TUserWithProfile } from "@/utils/types/be-api"
import { toast } from "sonner"
import { ETabs } from "@/app/friends/sharing"
import { useRouter } from "next/navigation"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"

export const AppLayoutProvider = ({ children }: { children: React.ReactNode }) => {
   const appRootRef = useRef<HTMLDivElement>(null)
   const router = useRouter()

   const setLastPageAccessed = () => {
      localStorageManager.setLastPageAccessed(getPathWithQueryString())
   }

   const listenFriendRequest = (
      userData: TUserWithProfile,
      requestData: TGetFriendRequestsData
   ) => {
      const { Profile, email } = userData
      eventEmitter.emit(EInternalEvents.SEND_FRIEND_REQUEST, requestData)
      toast(`User "${Profile?.fullName || email}" sent you an add friend request`, {
         action: {
            label: "View",
            onClick: () => {
               router.push(`/friends?action=${ETabs.ADD_FRIEND_REQUESTS}`)
            },
         },
      })
   }

   useEffect(() => {
      clientSocket.socket.on(ESocketEvents.send_friend_request, listenFriendRequest)
      setLastPageAccessed()
      return () => {
         clientSocket.socket.removeListener(ESocketEvents.send_friend_request, listenFriendRequest)
      }
   }, [])

   return (
      <div ref={appRootRef} id="App-Root" className="bg-regular-dark-gray-cl">
         <RootLayoutContext.Provider value={{ appRootRef }}>{children}</RootLayoutContext.Provider>
      </div>
   )
}
