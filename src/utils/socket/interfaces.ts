import type {
  TDirectMessageWithAuthorAndReplyTo,
  TGetFriendRequestsData,
  TUserWithProfile,
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
} from "../types/socket"

export interface IListenSocketEvents {
  [ESocketInitEvents.connect]: () => void
  [ESocketInitEvents.connect_error]: (payload: unknown) => void
  [ESocketEvents.error]: (error: TWsErrorResponse) => void
  [ESocketEvents.send_message_direct]: (newMessage: TDirectMessageWithAuthorAndReplyTo) => void
  [ESocketEvents.send_friend_request]: (
    sender: TUserWithProfile,
    requestData: TGetFriendRequestsData
  ) => void
  [ESocketEvents.recovered_connection]: (messages: TDirectMessageWithAuthorAndReplyTo[]) => void
  [ESocketEvents.message_seen_direct]: (payload: TMsgSeenListenPayload) => void
  [ESocketEvents.typing_direct]: (isTyping: boolean) => void
  [ESocketEvents.friend_request_action]: (payload: TFriendRequestPayload) => void
  [ESocketEvents.pin_message]: (data: TPinMessageEventData) => void
  [ESocketEvents.pin_direct_chat]: (data: TPinDirectChatEventData) => void
}

export interface IEmitSocketEvents {
  [ESocketEvents.send_message_direct]: (
    message: TChattingPayload,
    cb: (data: TSendDirectMessageErrorRes | TSuccess) => void
  ) => void
  [ESocketEvents.message_seen_direct]: (payload: TMsgSeenEmitPayload) => void
  [ESocketEvents.typing_direct]: (payload: TTypingEmitPayload) => void
}
