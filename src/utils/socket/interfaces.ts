import type {
  TMessageFullInfo,
  TGetFriendRequestsData,
  TUserWithProfile,
  TDirectChat,
  TMessage,
  TGroupChat,
} from "@/utils/types/be-api"
import type { TSendDirectMessageErrorRes, TSuccess } from "../types/global"
import { ESocketEvents, ESocketInitEvents } from "./events"
import type {
  TChattingPayload,
  TMsgSeenEmitPayload,
  TMsgSeenListenPayload,
  TTypingEmitPayload,
  TFriendRequestPayload,
  TWsErrorResponse,
  TPinMessageEventData,
  TPinDirectChatEventData,
  TSendDirectMessageRes,
  TCheckUserOnlineStatusRes,
  TCheckUserOnlineEmitPayload,
  TJoinDirectChatRoomEmitPayload,
  TJoinGroupChatRoomEmitPayload,
  TPinGroupMessageEventData,
  TGroupTypingEmitPayload,
  TChattingPayloadForGroup,
} from "../types/socket"
import { EChatType } from "../enums"
import { EOnlineStatus } from "./enums"

export interface IListenSocketEvents {
  [ESocketInitEvents.connect]: () => void
  [ESocketInitEvents.connect_error]: (payload: unknown) => void
  [ESocketEvents.error]: (error: TWsErrorResponse) => void
  [ESocketEvents.send_message_direct]: (newMessage: TMessageFullInfo) => void
  [ESocketEvents.send_message_group]: (newMessage: TMessageFullInfo) => void
  [ESocketEvents.send_friend_request]: (
    sender: TUserWithProfile,
    requestData: TGetFriendRequestsData
  ) => void
  [ESocketEvents.recovered_connection]: (messages: TMessageFullInfo[]) => void
  [ESocketEvents.message_seen_direct]: (payload: TMsgSeenListenPayload) => void
  [ESocketEvents.message_seen_group]: (payload: TMsgSeenListenPayload) => void
  [ESocketEvents.typing_direct]: (isTyping: boolean, directChatId: number) => void
  [ESocketEvents.typing_group]: (
    isTyping: boolean,
    groupChatId: number,
    user: TUserWithProfile
  ) => void
  [ESocketEvents.friend_request_action]: (payload: TFriendRequestPayload) => void
  [ESocketEvents.pin_message]: (data: TPinMessageEventData) => void
  [ESocketEvents.pin_group_message]: (data: TPinGroupMessageEventData) => void
  [ESocketEvents.pin_direct_chat]: (data: TPinDirectChatEventData) => void
  [ESocketEvents.new_conversation]: (
    directChat: TDirectChat | null,
    groupChat: TGroupChat | null,
    type: EChatType,
    newMessage: TMessage | null,
    sender: TUserWithProfile
  ) => void
  [ESocketEvents.broadcast_user_online_status]: (
    userId: number,
    onlineStatus: EOnlineStatus
  ) => void
}

export interface IEmitSocketEvents {
  [ESocketEvents.send_message_direct]: (
    message: TChattingPayload,
    cb: (data: TSendDirectMessageErrorRes | TSendDirectMessageRes) => void
  ) => void
  [ESocketEvents.send_message_group]: (
    message: TChattingPayloadForGroup,
    cb: (data: TSendDirectMessageErrorRes | TSendDirectMessageRes) => void
  ) => void
  [ESocketEvents.message_seen_direct]: (payload: TMsgSeenEmitPayload) => void
  [ESocketEvents.message_seen_group]: (payload: TMsgSeenEmitPayload) => void
  [ESocketEvents.typing_direct]: (payload: TTypingEmitPayload) => void
  [ESocketEvents.typing_group]: (payload: TGroupTypingEmitPayload) => void
  [ESocketEvents.check_user_online_status]: (
    payload: TCheckUserOnlineEmitPayload,
    cb: (data: TCheckUserOnlineStatusRes) => void
  ) => void
  [ESocketEvents.join_direct_chat_room]: (
    payload: TJoinDirectChatRoomEmitPayload,
    cb: (data: TSuccess) => void
  ) => void
  [ESocketEvents.join_group_chat_room]: (
    payload: TJoinGroupChatRoomEmitPayload,
    cb: (data: TSuccess) => void
  ) => void
}
