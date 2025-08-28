import type {
  TMessageFullInfo,
  TGetFriendRequestsData,
  TUserWithProfile,
  TDirectChat,
  TMessage,
  TGroupChat,
} from "@/utils/types/be-api"
import type {
  TActiveVoiceCallSession,
  TSendDirectMessageErrorRes,
  TSocketErrorRes,
  TSuccess,
  TUpdateUserInfoPayload,
} from "../types/global"
import type { EMessagingEvents, ESocketInitEvents, EVoiceCallEvents } from "./events"
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
  TCallOfferAnswerEmitPayload,
  TCallRequestEmitPayload,
  TCallRequestEmitRes,
  TCallAcceptEmitPayload,
  TCallRejectEmitPayload,
  TCallHangupEmitPayload,
  TCallIceEmitPayload,
} from "../types/socket"
import type { EChatType, ESDPType, EVoiceCallStatus } from "../enums"
import type { EOnlineStatus } from "./enums"

export interface IMessagingListenSocketEvents {
  [ESocketInitEvents.error]: (error: TWsErrorResponse) => void
  [EMessagingEvents.server_hello]: (payload: string) => void
  [ESocketInitEvents.connect]: () => void
  [ESocketInitEvents.connect_error]: (payload: unknown) => void
  [EMessagingEvents.send_message_direct]: (newMessage: TMessageFullInfo) => void
  [EMessagingEvents.send_message_group]: (newMessage: TMessageFullInfo) => void
  [EMessagingEvents.send_friend_request]: (
    sender: TUserWithProfile,
    requestData: TGetFriendRequestsData
  ) => void
  [EMessagingEvents.recovered_connection]: (messages: TMessageFullInfo[]) => void
  [EMessagingEvents.message_seen_direct]: (payload: TMsgSeenListenPayload) => void
  [EMessagingEvents.message_seen_group]: (payload: TMsgSeenListenPayload) => void
  [EMessagingEvents.typing_direct]: (isTyping: boolean, directChatId: number) => void
  [EMessagingEvents.typing_group]: (
    isTyping: boolean,
    groupChatId: number,
    user: TUserWithProfile
  ) => void
  [EMessagingEvents.friend_request_action]: (payload: TFriendRequestPayload) => void
  [EMessagingEvents.pin_message]: (data: TPinMessageEventData) => void
  [EMessagingEvents.pin_message_group]: (data: TPinGroupMessageEventData) => void
  [EMessagingEvents.pin_direct_chat]: (data: TPinDirectChatEventData) => void
  [EMessagingEvents.new_conversation]: (
    directChat: TDirectChat | null,
    groupChat: TGroupChat | null,
    type: EChatType,
    newMessage: TMessage | null,
    sender: TUserWithProfile
  ) => void
  [EMessagingEvents.broadcast_user_online_status]: (
    userId: number,
    onlineStatus: EOnlineStatus
  ) => void
  [EMessagingEvents.remove_group_chat_members]: (memberIds: number[], groupChat: TGroupChat) => void
  [EMessagingEvents.add_group_chat_members]: (newMemberIds: number[], groupChat: TGroupChat) => void
  [EMessagingEvents.update_group_chat_info]: (
    groupChatId: number,
    groupChat: Partial<TGroupChat>
  ) => void
  [EMessagingEvents.update_user_info]: (
    directChatId: number,
    userId: number,
    updates: TUpdateUserInfoPayload
  ) => void
  [EMessagingEvents.delete_direct_chat]: (directChatId: number, deleter: TUserWithProfile) => void
  [EMessagingEvents.delete_group_chat]: (groupChatId: number) => void
  [EMessagingEvents.member_leave_group_chat]: (groupChatId: number, memberId: number) => void
}

export interface IMessagingEmitSocketEvents {
  [EMessagingEvents.client_hello]: (
    payload: string,
    cb: (data: TSuccess | TSocketErrorRes) => void
  ) => void
  [EMessagingEvents.send_message_direct]: (
    message: TChattingPayload,
    cb: (data: TSendDirectMessageErrorRes | TSendDirectMessageRes) => void
  ) => void
  [EMessagingEvents.send_message_group]: (
    message: TChattingPayloadForGroup,
    cb: (data: TSendDirectMessageErrorRes | TSendDirectMessageRes) => void
  ) => void
  [EMessagingEvents.message_seen_direct]: (payload: TMsgSeenEmitPayload) => void
  [EMessagingEvents.message_seen_group]: (payload: TMsgSeenEmitPayload) => void
  [EMessagingEvents.typing_direct]: (payload: TTypingEmitPayload) => void
  [EMessagingEvents.typing_group]: (payload: TGroupTypingEmitPayload) => void
  [EMessagingEvents.check_user_online_status]: (
    payload: TCheckUserOnlineEmitPayload,
    cb: (data: TCheckUserOnlineStatusRes) => void
  ) => void
  [EMessagingEvents.join_direct_chat_room]: (
    payload: TJoinDirectChatRoomEmitPayload,
    cb: (data: TSuccess | TSocketErrorRes) => void
  ) => void
  [EMessagingEvents.join_group_chat_room]: (
    payload: TJoinGroupChatRoomEmitPayload,
    cb: (data: TSuccess | TSocketErrorRes) => void
  ) => void
}

export interface IVoiceCallListenSocketEvents {
  [ESocketInitEvents.error]: (error: TWsErrorResponse) => void
  [EVoiceCallEvents.server_hello]: (payload: string) => void
  [EVoiceCallEvents.call_status]: (
    status: EVoiceCallStatus,
    callSession?: TActiveVoiceCallSession
  ) => void
  [EVoiceCallEvents.call_offer_answer]: (SDP: string, type: ESDPType) => void
  [EVoiceCallEvents.call_request]: (activeCallSession: TActiveVoiceCallSession) => void
  [EVoiceCallEvents.call_ice]: (candidate: string, sdpMid?: string, sdpMLineIndex?: number) => void
}

export interface IVoiceCallEmitSocketEvents {
  [EVoiceCallEvents.client_hello]: (
    payload: string,
    cb: (data: TSuccess | TSocketErrorRes) => void
  ) => void
  [EVoiceCallEvents.call_request]: (
    payload: TCallRequestEmitPayload,
    cb: (data: TCallRequestEmitRes) => void
  ) => void
  [EVoiceCallEvents.call_offer_answer]: (payload: TCallOfferAnswerEmitPayload) => void
  [EVoiceCallEvents.call_accept]: (payload: TCallAcceptEmitPayload) => void
  [EVoiceCallEvents.call_reject]: (payload: TCallRejectEmitPayload) => void
  [EVoiceCallEvents.call_hangup]: (payload: TCallHangupEmitPayload) => void
  [EVoiceCallEvents.call_ice]: (payload: TCallIceEmitPayload) => void
}
