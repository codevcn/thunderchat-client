"use client"

import { JSX, useEffect } from "react"
import { EAuthStatus } from "@/utils/enums"
import { useAuth } from "@/hooks/auth"
import { useUser } from "@/hooks/user"
import { chattingService } from "@/services/chatting.service"
import { EMessagingEvents, ESocketInitEvents, EVoiceCallEvents } from "@/utils/socket/events"
import { clientSocket } from "@/utils/socket/client-socket"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { toaster } from "@/utils/toaster"
import { useAppDispatch } from "@/hooks/redux"
import { initGlobalVoiceCallListener } from "@/hooks/use-global-voice-call"

export const SocketProvider = ({ children }: { children: JSX.Element }) => {
  const { authStatus } = useAuth()
  const user = useUser()
  const dispatch = useAppDispatch()
  const handleConnectMessagingSocket = (connected: boolean) => {
    if (connected) {
      clientSocket.socket.connect()
    } else {
      clientSocket.socket.disconnect()
    }
  }

  const initMessagingSocketConnection = () => {
    if (authStatus === EAuthStatus.AUTHENTICATED && user) {
      clientSocket.socket.on(EMessagingEvents.server_hello, (payload) => {
        console.log(">>> Server hello (at messaging):", payload)
        eventEmitter.emit(EInternalEvents.JOIN_CHAT_ROOM_FOR_CONVERSATIONS)
      })
      clientSocket.socket.on(ESocketInitEvents.connect, () => {
        console.log(">>> Socket connected to server (at messaging)")
        chattingService.sendOfflineMessages()
        clientSocket.socket.emit(
          EMessagingEvents.client_hello,
          "VCN Client Hello - " + (user?.Profile.fullName || ""),
          (data) => {
            console.log(">>> Client hello response (at messaging):", data)
          }
        )
      })
      clientSocket.socket.on(ESocketInitEvents.connect_error, (error) => {
        console.log(">>> Socket fails to connect to server (at messaging) >>>", error)
        toaster.error("Something went wrong! Can't connect to Server")
      })
      clientSocket.socket.on(ESocketInitEvents.error, (payload) => {
        toaster.error(payload.message)
      })

      clientSocket.setSocketAuth(user.id)
      handleConnectMessagingSocket(true)
    } else if (authStatus === EAuthStatus.UNAUTHENTICATED) {
      handleConnectMessagingSocket(false)
    }
  }

  const handleConnectcallSocket = (connected: boolean) => {
    if (connected) {
      clientSocket.callSocket.connect()
    } else {
      clientSocket.callSocket.disconnect()
    }
  }

  const initcallSocketConnection = () => {
    if (authStatus === EAuthStatus.AUTHENTICATED && user) {
      clientSocket.callSocket.on(ESocketInitEvents.connect, () => {
        console.log(">>> Socket connected to server (at voice call)")
        clientSocket.callSocket.emit(
          EVoiceCallEvents.client_hello,
          "VCN Client Hello - " + user.Profile.fullName,
          (data) => {
            console.log(">>> Client hello response (at voice call):", data)
          }
        )
      })
      clientSocket.callSocket.on(ESocketInitEvents.connect_error, (error) => {
        console.log(">>> Socket fails to connect to server (at voice call) >>>", error)
        toaster.error("Something went wrong! Can't connect to Server")
      })
      clientSocket.callSocket.on(ESocketInitEvents.error, (error) => {
        console.log(">>> Socket fails to connect to server (at voice call) >>>", error)
        toaster.error(error.message)
      })
      clientSocket.callSocket.on(EVoiceCallEvents.server_hello, (payload) => {
        console.log(">>> Server hello (at voice call):", payload)
      })

      clientSocket.setcallSocketAuth(user.id)
      handleConnectcallSocket(true)
    } else {
      handleConnectcallSocket(false)
    }
  }

  useEffect(() => {
    initMessagingSocketConnection()
    initcallSocketConnection()

    // let voiceCallCleanup: (() => void) | undefined // Biến để store cleanup từ listener

    // // Đặt ở đây: Sau initcallSocketConnection, khi socket ready và authenticated
    // if (authStatus === EAuthStatus.AUTHENTICATED && user) {
    //   voiceCallCleanup = initGlobalVoiceCallListener(dispatch) // Init listener toàn cục
    //   console.log(">>> [SocketProvider] Global voice call listener initialized")
    // }
    return () => {
      clientSocket.socket.removeAllListeners(ESocketInitEvents.connect)
      clientSocket.socket.removeAllListeners(ESocketInitEvents.connect_error)
      clientSocket.socket.removeAllListeners(ESocketInitEvents.error)
      clientSocket.socket.removeAllListeners(EMessagingEvents.server_hello)
      clientSocket.callSocket.removeAllListeners(ESocketInitEvents.connect)
      clientSocket.callSocket.removeAllListeners(ESocketInitEvents.connect_error)
      clientSocket.callSocket.removeAllListeners(ESocketInitEvents.error)
      clientSocket.callSocket.removeAllListeners(EVoiceCallEvents.server_hello)
    }
  }, [authStatus, user])

  return children
}
