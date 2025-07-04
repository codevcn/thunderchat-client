import type { IEmitSocketEvents, IListenSocketEvents } from "./interfaces"
import { ESocketNamespaces } from "./namespaces"
import { io, Socket } from "socket.io-client"

class ClientSocket {
   readonly socket: Socket<IListenSocketEvents, IEmitSocketEvents>

   constructor() {
      this.socket = io(process.env.NEXT_PUBLIC_SERVER_HOST + `/${ESocketNamespaces.app}`, {
         autoConnect: false,
         withCredentials: true,
         auth: {},
      })
   }

   setAuth(clientId: number): void {
      this.socket.auth = {
         ...(this.socket.auth || {}),
         clientId,
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
