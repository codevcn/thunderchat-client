import type { HttpStatusCode } from "axios"
import type { EMessageStatus } from "../socket/enums"
import type { EFriendRequestStatus, EMessageTypes } from "@/utils/enums"
import type { TSuccess } from "./global"
import type { TDirectChat, TMessage } from "./be-api"

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
    token: string
    timestamp: Date
    replyToId?: number
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
  directChatId: number
}

export type TFriendRequestPayload = {
  requestId: number
  action: EFriendRequestStatus
}

export type TPinMessageEventData = {
  messageId: number
  directChatId: number
  isPinned: boolean
  userId: any
}

export type TPinDirectChatEventData = {
  directChatId: number
  isPinned: boolean
  userId: number
  pinnedBy: number
}

export type TSendDirectMessageRes = TSuccess & {
  directChat: TDirectChat
  newMessage: TMessage
  isNewDirectChat: boolean
}
