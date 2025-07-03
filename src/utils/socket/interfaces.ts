import type { TGetFriendRequestsData, TUserWithProfile } from "@/utils/types/be-api"
import type { TDirectMessage } from "@/utils/types/be-api"
import type { TSendDirectMessageErrorRes, TSuccess } from "../types/global"
import { ESocketEvents, ESocketInitEvents } from "./events"
import type {
   TChattingPayload,
   TMsgSeenEmitPayload,
   TMsgSeenListenPayload,
   TTypingEmitPayload,
   TFriendRequestPayload,
   TWsErrorResponse,
} from "../types/socket"

export interface IListenSocketEvents {
   [ESocketInitEvents.connect]: () => void
   [ESocketInitEvents.connect_error]: (payload: unknown) => void
   [ESocketEvents.error]: (error: TWsErrorResponse) => void
   [ESocketEvents.send_message_direct]: (newMessage: TDirectMessage) => void
   [ESocketEvents.send_friend_request]: (
      sender: TUserWithProfile,
      requestData: TGetFriendRequestsData
   ) => void
   [ESocketEvents.recovered_connection]: (messages: TDirectMessage[]) => void
   [ESocketEvents.message_seen_direct]: (payload: TMsgSeenListenPayload) => void
   [ESocketEvents.typing_direct]: (isTyping: boolean) => void
   [ESocketEvents.friend_request_action]: (payload: TFriendRequestPayload) => void
}

export interface IEmitSocketEvents {
   [ESocketEvents.send_message_direct]: (
      message: TChattingPayload,
      cb: (data: TSendDirectMessageErrorRes | TSuccess) => void
   ) => void
   [ESocketEvents.message_seen_direct]: (payload: TMsgSeenEmitPayload) => void
   [ESocketEvents.typing_direct]: (payload: TTypingEmitPayload) => void
}
