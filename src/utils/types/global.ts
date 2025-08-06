import type { AxiosError, HttpStatusCode } from "axios"
import type {
  TMessage,
  TDirectChat,
  TGroupMessage,
  TMessageFullInfo,
  TDirectChatData,
} from "@/utils/types/be-api"
import type { EChatType, EMessageMediaTypes, EMessageTypes } from "../enums"

export type TStateDirectMessage = TMessageFullInfo & {
  isNewMsg?: boolean
  originMsgId?: number // id tin nhắn gốc nếu là PIN_NOTICE
}

export type TStateGroupMessage = TGroupMessage & {
  isNewMsg?: boolean
}

export type TDirectChatWithMessages = TDirectChat & { messages: TMessage[] }

export type THttpErrorResBody =
  | {
      name: string
      message: string
      timestamp: string
      isUserError: boolean
    }
  | string

export type TAxiosError = {
  originalError: AxiosError<THttpErrorResBody>
  statusCode: number
  message: string
  isUserError: boolean
  clientMessage: string
}

export type TSuccess = {
  success: boolean // always true
}

export type TConversationCard = {
  id: number
  avatar: {
    src?: string
    fallback: string
  }
  title: string
  subtitle: {
    content: string
    type: EMessageTypes
  }
  lastMessageTime?: string
  pinIndex: number
  type: EChatType
  createdAt: string
  unreadMessageCount: number
  email?: string
}

export type TUnknownObject = {
  [key: number | string]: any
}

export type TUnknownFunction<P, R> = (...args: P[]) => R

export type TSendDirectMessageErrorRes = {
  isError: boolean
  message: string
}

export type TSendMessageCallback = (data: TSendDirectMessageErrorRes | TSuccess) => void

export type THandledAxiosError = {
  originalError: unknown
  statusCode: HttpStatusCode
  message: string
  isUserError: boolean
}

export type TFormData = {
  [key: string]: FormDataEntryValue | FormDataEntryValue[] | TCheckboxValue | undefined
}

export type TLastPageAccessed = {
  current: string
  previous: string
}

export type TEmoji = {
  src: string
  name: string
}

export type TCheckboxValue = "on" | undefined

export type TMessageStateUpdates = {
  msgId: number
  msgUpdates: Partial<TStateDirectMessage>
}

export type TPlacement = "top" | "right" | "bottom" | "left"

export type TAlign = "center" | "start" | "end"

export type TRemoveGroupChatMemberState = {
  memberId: number
}

export type THighlightOffsets = {
  start: number
  end: number
}

export type TLastSentMessageState = {
  lastMessageId: number
  chatType: EChatType
}

export type TLastDirectChatData = {
  chatData: TDirectChatData
  tempId: number
}

export type TUpdateUnreadMsgCountState = {
  count: number
  directChatId: number
}

export type TMediaData = {
  id: number
  type: EMessageTypes
  mediaUrl: string
  fileName: string
  content: string
  createdAt: string
  authorId: number
  fileSize: number
  thumbnailUrl: string
  mediaType: EMessageMediaTypes
}

export type TMediaDataCollection = {
  images: TMediaData[]
  videos: TMediaData[]
  files: TMediaData[]
  audios: TMediaData[]
  links: TMediaData[]
}

export type TConversationSearchResult = {
  id: number
  type: EChatType
  title: string
  email?: string
  avatar?: {
    src: string
  }
  subtitle?: {
    content: string
  }
}
