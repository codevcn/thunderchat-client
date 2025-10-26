import type { AxiosError, HttpStatusCode } from "axios"
import type {
  TMessage,
  TDirectChat,
  TMessageFullInfo,
  TDirectChatData,
  TPinnedChat,
  TPushNotificationSubscription,
} from "@/utils/types/be-api"
import type { EChatType, EMessageMediaTypes, EMessageTypes, EVoiceCallStatus } from "../enums"
import type { Socket } from "socket.io-client"

export type TStateMessage = TMessageFullInfo & {
  isNewMsg?: boolean
  originMsgId?: number // id tin nhắn gốc nếu là PIN_NOTICE
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

export type TNoParamsFunction<R> = () => R

export type TSocketErrorRes = {
  isError: boolean
  message: string
}

export type TSendDirectMessageErrorRes = TSocketErrorRes

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
  msgUpdates: Partial<TStateMessage>
}

export type TPlacement = "top" | "right" | "bottom" | "left"

export type TAlign = "center" | "start" | "end"

export type TRemoveGroupChatMemberState = {
  memberIds: number[]
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
  conversationId: number
  type: EChatType
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
  isViolated: boolean
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

export type TSocketId = Socket["id"]

export type TUsePinChats = {
  pinChats: TPinnedChat[]
  setPinChats: (pinChats: TPinnedChat[]) => void
  loading: boolean
  fetchPinChatsByUserId: () => Promise<void>
  isChatPinned: (chatId: number, chatType: EChatType) => boolean
  getPinnedChat: (chatId: number, chatType: EChatType) => TPinnedChat | undefined
}

export type TRemoveConversationState = {
  conversationId: number
  type: EChatType
}

export type TMemberPermissionRenderingResult = {
  hasPermission: boolean
  message: string
}

export type TUpdateUserInfoPayload = Partial<{
  fullName: string
  birthday: Date
  avatar: string
  about: string
}>

export type TUsePushNotification = {
  subscribe: () => Promise<TSubscribePushNotificationRes | null>
  unsubscribe: () => Promise<TUnsubscribePushNotificationRes | null>
  checkIfSupported: () => Promise<boolean>
}

export type TSettingsState = {
  pushNotification: {
    enabled: boolean
  }
  privacy: {
    onlyReceiveFriendMessage: boolean
  }
}

export type TSubscribePushNotificationRes = {
  subscription: PushSubscription | null
  subscriptionData: TPushNotificationSubscription | null
}

export type TUnsubscribePushNotificationRes = {
  oldSubscription: PushSubscription | null
}

export type TActiveVoiceCallSession = {
  id: string
  status: EVoiceCallStatus
  callerUserId: number
  calleeUserId: number
  directChatId: number
  isVideoCall: boolean
}

export type TEmitLogMessage = {
  order: number
  message: string
}

export type TEmitLogStaticConst = {
  ORDER: number
}

export type TDetectCollisionWithViewportEdgesResult = {
  edge: "left" | "right" | "top" | "bottom" | null
}

export type TActionSendIcon = "start" | "end"
