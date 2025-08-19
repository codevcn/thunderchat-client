"use client"

import { JSX, useEffect } from "react"
import { EAuthStatus } from "@/utils/enums"
import { useAuth } from "@/hooks/auth"
import { useUser } from "@/hooks/user"
import { chattingService } from "@/services/chatting.service"
import { ESocketEvents, ESocketInitEvents } from "@/utils/socket/events"
import { clientSocket } from "@/utils/socket/client-socket"
import { toast } from "sonner"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"

export const SocketProvider = ({ children }: { children: JSX.Element }) => {
  const { authStatus } = useAuth()
  const user = useUser()

  const handleConnectSocket = (connected: boolean) => {
    if (connected) {
      clientSocket.socket.connect()
    } else {
      clientSocket.socket.disconnect()
    }
  }

  useEffect(() => {
    if (authStatus === EAuthStatus.AUTHENTICATED && user) {
      clientSocket.socket.on(ESocketEvents.server_hello, (payload) => {
        console.log(">>> Server hello:", payload)
        eventEmitter.emit(EInternalEvents.JOIN_CHAT_ROOM_FOR_CONVERSATIONS)
      })

      clientSocket.socket.on(ESocketInitEvents.connect, () => {
        console.log(">>> Socket connected to server")
        chattingService.sendOfflineMessages()
        console.log(">>> Check socket connected:", clientSocket.socket.connected)
        handleConnectSocket(true)
        clientSocket.socket.emit(ESocketEvents.client_hello, "VCN Hello", (data) => {
          console.log(">>> Client hello response:", data)
        })
      })

      clientSocket.socket.on(ESocketInitEvents.connect_error, (error) => {
        console.log(">>> Socket fails to connect to server >>>", error)
        toast.error("Something went wrong! Can't connect to Server")
      })

      clientSocket.socket.on(ESocketEvents.error, (payload) => {
        toast.error(payload.message)
      })

      clientSocket.setAuth(user.id)
      handleConnectSocket(true)
    } else if (authStatus === EAuthStatus.UNAUTHENTICATED) {
      handleConnectSocket(false)
    }
    return () => {
      clientSocket.socket.removeAllListeners(ESocketInitEvents.connect)
      clientSocket.socket.removeAllListeners(ESocketInitEvents.connect_error)
      clientSocket.socket.removeAllListeners(ESocketEvents.error)
    }
  }, [authStatus])

  return children
}
