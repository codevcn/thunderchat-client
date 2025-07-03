import { ObjectQueue } from "@/utils/algorithms/queue"
import { EMessageTypes } from "@/utils/enums"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"
import type { TChattingPayload } from "@/utils/types/socket"
import type { TSendMessageCallback } from "@/utils/types/global"

type TOfflineMessage = TChattingPayload

class ChattingService {
   private offlineMessages: TOfflineMessage[]
   private messagesQueue: ObjectQueue<TChattingPayload>
   private acknowledgmentFlag: boolean
   private readonly MAX_TIMEOUT_MESSAGING: number = 5000

   constructor() {
      this.offlineMessages = []
      this.messagesQueue = new ObjectQueue<TChattingPayload>()
      this.acknowledgmentFlag = true
   }

   async sendMessage(
      type: EMessageTypes,
      message: TChattingPayload["msgPayload"],
      callback: TSendMessageCallback
   ): Promise<void> {
      if (clientSocket.socket.connected) {
         if (this.getAcknowledgmentFlag()) {
            this.setAcknowledgmentFlag(false)
            clientSocket.socket.timeout(this.MAX_TIMEOUT_MESSAGING).emit(
               ESocketEvents.send_message_direct,
               {
                  type,
                  msgPayload: message,
               },
               (error, data) => {
                  if (error) {
                     this.saveOfflineMessage({ type, msgPayload: message })
                  } else {
                     callback(data)
                  }
               }
            )
         } else {
            this.messagesQueue.enqueue({ type, msgPayload: message })
         }
      } else {
         this.saveOfflineMessage({ type, msgPayload: message })
      }
   }

   getMessageToken() {
      return crypto.randomUUID()
   }

   sendOfflineMessages() {
      this.recursiveSendingOfflineMessages()
   }

   recursiveSendingQueueMessages() {
      const message = this.messagesQueue.dequeue()
      if (message) {
         this.sendMessage(message.type, message.msgPayload, (data) => {
            if ("success" in data && data.success) {
               this.setAcknowledgmentFlag(true)
               this.recursiveSendingQueueMessages()
            }
         })
      }
   }

   recursiveSendingOfflineMessages() {
      const message = this.offlineMessages.shift()
      if (message) {
         this.sendMessage(message.type, message.msgPayload, (data) => {
            if ("success" in data && data.success) {
               this.setAcknowledgmentFlag(true)
               this.recursiveSendingOfflineMessages()
            }
         })
      }
   }

   saveOfflineMessage(chattingPayload: TChattingPayload) {
      let offlineMessages = this.offlineMessages
      if (offlineMessages && offlineMessages.length > 0) {
         offlineMessages = [...offlineMessages, chattingPayload]
      } else {
         offlineMessages = [chattingPayload]
      }
      this.offlineMessages = offlineMessages
   }

   setAcknowledgmentFlag(flag: boolean) {
      this.acknowledgmentFlag = flag
   }

   getAcknowledgmentFlag() {
      return this.acknowledgmentFlag
   }

   clearOfflineMessages() {
      this.offlineMessages = []
   }
}

export const chattingService = new ChattingService()
