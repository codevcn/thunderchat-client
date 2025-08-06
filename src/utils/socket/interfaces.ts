import type {
  TMessageFullInfo,
  TGetFriendRequestsData,
  TUserWithProfile,
  TDirectChat,
  TMessage,
  TGroupChat,
} from "@/utils/types/be-api"
import type { TSendDirectMessageErrorRes } from "../types/global"
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
} from "../types/socket"
import { EChatType } from "../enums"

export interface IListenSocketEvents {
  [ESocketInitEvents.connect]: () => void
  [ESocketInitEvents.connect_error]: (payload: unknown) => void
  [ESocketEvents.error]: (error: TWsErrorResponse) => void
  [ESocketEvents.send_message_direct]: (newMessage: TMessageFullInfo) => void
  [ESocketEvents.send_friend_request]: (
    sender: TUserWithProfile,
    requestData: TGetFriendRequestsData
  ) => void
  [ESocketEvents.recovered_connection]: (messages: TMessageFullInfo[]) => void
  [ESocketEvents.message_seen_direct]: (payload: TMsgSeenListenPayload) => void
  [ESocketEvents.typing_direct]: (isTyping: boolean, directChatId: number) => void
  [ESocketEvents.friend_request_action]: (payload: TFriendRequestPayload) => void
  [ESocketEvents.pin_message]: (data: TPinMessageEventData) => void
  [ESocketEvents.pin_direct_chat]: (data: TPinDirectChatEventData) => void
  [ESocketEvents.new_conversation]: (
    directChat: TDirectChat | null,
    groupChat: TGroupChat | null,
    type: EChatType,
    newMessage: TMessage,
    sender: TUserWithProfile
  ) => void
}

export interface IEmitSocketEvents {
  [ESocketEvents.send_message_direct]: (
    message: TChattingPayload,
    cb: (data: TSendDirectMessageErrorRes | TSendDirectMessageRes) => void
  ) => void
  [ESocketEvents.message_seen_direct]: (payload: TMsgSeenEmitPayload) => void
  [ESocketEvents.typing_direct]: (payload: TTypingEmitPayload) => void
}
