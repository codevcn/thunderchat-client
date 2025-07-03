import type { HttpStatusCode } from "axios"
import type { EMessageStatus } from "../socket/enums"
import type { EFriendRequestStatus, EMessageTypes } from "@/utils/enums"

export type TWsErrorResponse = {
   isError: boolean
   message: string
   httpStatus: HttpStatusCode
}

export type TChattingPayload = {
   type: EMessageTypes
   msgPayload: {
      receiverId: number
      content: string
      directChatId: number
      token: string
      timestamp: Date
   }
}

export type TMsgSeenListenPayload = {
   messageId: number
   status: EMessageStatus
}

export type TMsgSeenEmitPayload = {
   messageId: number
   receiverId: number
}

export type TTypingEmitPayload = {
   receiverId: number
   isTyping: boolean
}

export type TFriendRequestPayload = {
   requestId: number
   action: EFriendRequestStatus
}
