"use client"

import { JSX, useEffect, useRef } from "react"
import { EAuthStatus } from "@/utils/enums"
import { useAuth } from "@/hooks/auth"
import { useUser } from "@/hooks/user"
import { chattingService } from "@/services/chatting.service"
import { ESocketEvents, ESocketInitEvents } from "@/utils/socket/events"
import { clientSocket } from "@/utils/socket/client-socket"
import { toast } from "sonner"

export const SocketProvider = ({ children }: { children: JSX.Element }) => {
   const { authStatus } = useAuth()
   const user = useUser()
   const tempFlagUseEffectRef = useRef<boolean>(true)

   useEffect(() => {
      if (tempFlagUseEffectRef.current) {
         tempFlagUseEffectRef.current = false
         if (authStatus === EAuthStatus.AUTHENTICATED && user) {
            clientSocket.socket.on(ESocketInitEvents.connect, () => {
               console.log(">>> Socket connected to server")
               chattingService.sendOfflineMessages()
            })

            clientSocket.socket.on(ESocketInitEvents.connect_error, (error) => {
               console.log(">>> Socket fails to connect to server >>>", error)
               toast.error("Something went wrong! Can't connect to Server")
            })

            clientSocket.socket.on(ESocketEvents.error, (payload) => {
               toast.error(payload.message)
            })

            clientSocket.setAuth(user.id)
            clientSocket.socket.connect()
         } else if (authStatus === EAuthStatus.UNAUTHENTICATED) {
            clientSocket.socket.disconnect()
         }
      }
      return () => {
         clientSocket.socket.removeAllListeners(ESocketInitEvents.connect)
         clientSocket.socket.removeAllListeners(ESocketInitEvents.connect_error)
         clientSocket.socket.removeAllListeners(ESocketEvents.error)
      }
   }, [authStatus])

   return children
}
