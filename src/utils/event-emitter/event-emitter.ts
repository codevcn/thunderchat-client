import EventEmitter from "eventemitter3"
import type { EInternalEvents } from "./events"
import type { TMsgContent } from "./types"
import type { TGetMessagesMessage, TGetFriendRequestsData, TGroupChat } from "../types/be-api"
import type { EChatType } from "../enums"
import type { TEmitLogMessage } from "../types/global"

interface IEventEmitter {
  [EInternalEvents.SCROLL_TO_BOTTOM_MSG_ACTION]: () => void
  [EInternalEvents.SCROLL_TO_BOTTOM_MSG_UI]: () => void
  [EInternalEvents.SCROLL_OUT_OF_BOTTOM]: () => void
  [EInternalEvents.CLICK_ON_LAYOUT]: (e: MouseEvent) => void
  [EInternalEvents.MSG_TEXTFIELD_EDITED]: (e: TMsgContent) => void
  [EInternalEvents.UNREAD_MESSAGES_COUNT]: (count: number, chatId: number, type: EChatType) => void
  [EInternalEvents.LAST_FRIEND_REQUEST]: () => void
  [EInternalEvents.SAME_PATH_NAVIGATION]: () => void
  [EInternalEvents.SEND_FRIEND_REQUEST]: (requestData: TGetFriendRequestsData) => void
  [EInternalEvents.OPEN_MANAGE_MEMBERS]: (groupChatId: number) => void
  [EInternalEvents.SCROLL_TO_MESSAGE_MEDIA]: (messageId: number) => void
  [EInternalEvents.FRIEND_REMOVED]: (friendRowId: number) => void
  [EInternalEvents.FETCH_DIRECT_CHAT]: (directChatId: number) => void
  [EInternalEvents.FETCH_GROUP_CHAT]: (groupChatId: number) => void
  [EInternalEvents.SEND_MESSAGE_DIRECT]: (newMessage: TGetMessagesMessage) => void
  [EInternalEvents.SEND_MESSAGE_GROUP]: (newMessage: TGetMessagesMessage) => void
  [EInternalEvents.SCROLL_TO_QUERIED_MESSAGE]: (messageId: number) => void
  [EInternalEvents.REMOVE_GROUP_CHAT_MEMBERS]: (memberIds: number[], groupChat: TGroupChat) => void
  [EInternalEvents.SEND_MESSAGE]: () => void
  [EInternalEvents.ADD_GROUP_CHAT_MEMBERS]: (newMemberIds: number[], groupChat: TGroupChat) => void
  [EInternalEvents.JOIN_CHAT_ROOM_FOR_CONVERSATIONS]: () => void
  [EInternalEvents.VOICE_CALL_REQUEST_RECEIVED]: () => void
  [EInternalEvents.EMIT_LOG]: (messages: TEmitLogMessage[]) => void
  [EInternalEvents.INIT_REMOTE_STREAM]: () => void
  [EInternalEvents.VOICE_CALL_CONNECTED]: () => void
  [EInternalEvents.CALL_REJECTED]: (directChatId: number) => void
  [EInternalEvents.REMOTE_VIDEO_UPDATED]: (stream: MediaStream) => void // Thêm cho update remote video stream
  [EInternalEvents.MIC_TOGGLED]: (enabled: boolean) => void // Thêm cho toggle mic (nếu cần sync riêng)
  [EInternalEvents.REMOTE_STREAM_UPDATED]: (stream: MediaStream) => void // Thêm cho update remote stream tổng quát (audio/video)
  [EInternalEvents.VIDEO_TOGGLED]: (enabled: boolean) => void
  [EInternalEvents.CALL_REJECTED_BY_PEER]: (data: { directChatId?: number }) => void
  [EInternalEvents.CALL_CANCEL]: (directChatId: number) => void
  [EInternalEvents.CALL_CANCELLED_BY_PEER]: (data: { directChatId?: number }) => void
  [EInternalEvents.CALL_STARTED]: (payload: {
    directChatId?: number // Optional for direct chat
    groupChatId?: number // Optional for group chat
    initiatorId: number
    type: string
    timestamp: Date
  }) => void
}

export const eventEmitter = new EventEmitter<IEventEmitter>()
