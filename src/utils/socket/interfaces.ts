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
import type { ESocketEvents, ESocketInitEvents } from "./events"
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
  TCallCalleeSetSessionEmitPayload,
} from "../types/socket"
import type { EChatType, ESDPType, EVoiceCallStatus } from "../enums"
import type { EOnlineStatus } from "./enums"

export interface IListenSocketEvents {
  [ESocketEvents.server_hello]: (payload: string) => void
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
  [ESocketEvents.pin_message_group]: (data: TPinGroupMessageEventData) => void
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
  [ESocketEvents.remove_group_chat_members]: (memberIds: number[], groupChat: TGroupChat) => void
  [ESocketEvents.add_group_chat_members]: (newMemberIds: number[], groupChat: TGroupChat) => void
  [ESocketEvents.update_group_chat_info]: (
    groupChatId: number,
    groupChat: Partial<TGroupChat>
  ) => void
  [ESocketEvents.update_user_info]: (
    directChatId: number,
    userId: number,
    updates: TUpdateUserInfoPayload
  ) => void
  [ESocketEvents.delete_direct_chat]: (directChatId: number, deleter: TUserWithProfile) => void
  [ESocketEvents.delete_group_chat]: (groupChatId: number) => void
  [ESocketEvents.member_leave_group_chat]: (groupChatId: number, memberId: number) => void
  [ESocketEvents.call_status]: (status: EVoiceCallStatus) => void
  [ESocketEvents.call_offer_answer]: (SDP: string, type: ESDPType) => void
  [ESocketEvents.call_request]: (activeCallSession: TActiveVoiceCallSession) => void
  [ESocketEvents.callee_set_session]: () => void
  [ESocketEvents.call_ice]: (candidate: string, sdpMid?: string, sdpMLineIndex?: number) => void
}

export interface IEmitSocketEvents {
  [ESocketEvents.client_hello]: (
    payload: string,
    cb: (data: TSuccess | TSocketErrorRes) => void
  ) => void
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
    cb: (data: TSuccess | TSocketErrorRes) => void
  ) => void
  [ESocketEvents.join_group_chat_room]: (
    payload: TJoinGroupChatRoomEmitPayload,
    cb: (data: TSuccess | TSocketErrorRes) => void
  ) => void
  [ESocketEvents.call_request]: (
    payload: TCallRequestEmitPayload,
    cb: (data: TCallRequestEmitRes) => void
  ) => void
  [ESocketEvents.call_offer_answer]: (payload: TCallOfferAnswerEmitPayload) => void
  [ESocketEvents.call_accept]: (payload: TCallAcceptEmitPayload) => void
  [ESocketEvents.call_reject]: (payload: TCallRejectEmitPayload) => void
  [ESocketEvents.call_hangup]: (payload: TCallHangupEmitPayload) => void
  [ESocketEvents.call_ice]: (payload: TCallIceEmitPayload) => void
  [ESocketEvents.callee_set_session]: (payload: TCallCalleeSetSessionEmitPayload) => void
}
