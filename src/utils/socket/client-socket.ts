import type {
  IMessagingEmitSocketEvents,
  IMessagingListenSocketEvents,
  IVoiceCallEmitSocketEvents,
  IVoiceCallListenSocketEvents,
} from "./interfaces"
import { ESocketNamespaces } from "../enums"
import { io, Socket } from "socket.io-client"

const SERVER_HOST =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_SERVER_HOST
    : process.env.NEXT_PUBLIC_SERVER_HOST_DEV

class ClientSocket {
  readonly socket: Socket<IMessagingListenSocketEvents, IMessagingEmitSocketEvents>
  readonly voiceCallSocket: Socket<IVoiceCallListenSocketEvents, IVoiceCallEmitSocketEvents>

  constructor() {
    this.socket = io(SERVER_HOST + `/${ESocketNamespaces.messaging}`, {
      autoConnect: false,
      withCredentials: true,
      auth: {},
    })

    this.voiceCallSocket = io(SERVER_HOST + `/${ESocketNamespaces.voice_call}`, {
      autoConnect: false,
      withCredentials: true,
      auth: {},
    })
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
