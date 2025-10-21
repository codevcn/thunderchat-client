import type {
  IMessagingEmitSocketEvents,
  IMessagingListenSocketEvents,
  IVoiceCallEmitSocketEvents,
  IVoiceCallListenSocketEvents,
} from "./interfaces"
import { ESocketNamespaces } from "../enums"
import { io, Socket } from "socket.io-client"
import { ClientCookieManager } from "../cookie"

class ClientSocket {
  readonly socket: Socket<IMessagingListenSocketEvents, IMessagingEmitSocketEvents>
  readonly voiceCallSocket: Socket<IVoiceCallListenSocketEvents, IVoiceCallEmitSocketEvents>

  constructor() {
    const WEBSOCKET_MESSAGING_HOST =
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_WEBSOCKET_MESSAGING_ENDPOINT
        : process.env.NEXT_PUBLIC_WEBSOCKET_MESSAGING_ENDPOINT_DEV

    const WEBSOCKET_CALLING_HOST =
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_WEBSOCKET_CALLING_ENDPOINT
        : process.env.NEXT_PUBLIC_WEBSOCKET_CALLING_ENDPOINT_DEV

    this.socket = io(WEBSOCKET_MESSAGING_HOST + `/${ESocketNamespaces.messaging}`, {
      autoConnect: false,
      withCredentials: true,
      auth: {},
    })

    this.voiceCallSocket = io(WEBSOCKET_CALLING_HOST + `/${ESocketNamespaces.voice_call}`, {
      autoConnect: false,
      withCredentials: true,
      auth: {},
    })
  }

  setAuthCookie() {
    this.socket.auth = {
      ...(this.socket.auth || {}),
      authToken: ClientCookieManager.getAuthCookie(),
    }
  }

  setVoiceCallAuthCookie() {
    this.voiceCallSocket.auth = {
      ...(this.voiceCallSocket.auth || {}),
      authToken: ClientCookieManager.getAuthCookie(),
    }
  }

  setSocketAuth(clientId: number): void {
    this.socket.auth = {
      ...(this.socket.auth || {}),
      clientId,
    }
  }

  setVoiceCallSocketAuth(userId: number): void {
    this.voiceCallSocket.auth = {
      ...(this.voiceCallSocket.auth || {}),
      userId,
    }
  }

  setMessageOffset(messageOffset: number, directChatId: number): void {
    this.socket.auth = {
      ...(this.socket.auth || {}),
      messageOffset,
      directChatId,
    }
  }
}

export const clientSocket = new ClientSocket()
