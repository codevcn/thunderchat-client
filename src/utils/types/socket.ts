import type { HttpStatusCode } from "axios"
import type { EMessageStatus, EOnlineStatus } from "../socket/enums"
import type { EFriendRequestStatus, EMessageTypeAllTypes } from "@/utils/enums"
import type { TSuccess } from "./global"
import type { TMessage } from "./be-api"

export type TWsErrorResponse = {
  isError: boolean
  message: string
  httpStatus: HttpStatusCode
}

export type TChattingPayload = {
  type: EMessageTypeAllTypes
  msgPayload: {
    receiverId?: number
    content: string
    token: string
    timestamp: Date
    replyToId?: number
  }
}

export type TChattingPayloadForGroup = {
  type: EMessageTypeAllTypes
  msgPayload: {
    groupChatId: number
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
  receiverId?: number
  groupChatId?: number
}

export type TTypingEmitPayload = {
  receiverId: number
  isTyping: boolean
  directChatId: number
}

export type TGroupTypingEmitPayload = {
  groupChatId: number
  isTyping: boolean
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

export type TPinGroupMessageEventData = {
  messageId: number
  groupChatId: number
  isPinned: boolean
  userId: number
}

export type TPinDirectChatEventData = {
  directChatId: number
  isPinned: boolean
  userId: number
  pinnedBy: number
}

export type TSendDirectMessageRes = TSuccess & {
  newMessage: TMessage
}

export type TCheckUserOnlineEmitPayload = {
  userId: number
}

export type TCheckUserOnlineStatusRes = TSuccess & {
  onlineStatus: EOnlineStatus
}

export type TJoinDirectChatRoomEmitPayload = {
  directChatId: number
}

export type TJoinGroupChatRoomEmitPayload = {
  groupChatId: number
}
