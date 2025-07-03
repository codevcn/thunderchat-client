import EventEmitter from "eventemitter3"
import type { EInternalEvents } from "./events"
import type { TMsgContent } from "./types"
import type { TGetFriendRequestsData } from "../types/be-api"

interface IEventEmitter {
   [EInternalEvents.SCROLL_TO_BOTTOM_MSG_ACTION]: () => void
   [EInternalEvents.SCROLL_TO_BOTTOM_MSG_UI]: () => void
   [EInternalEvents.SCROLL_OUT_OF_BOTTOM]: () => void
   [EInternalEvents.CLICK_ON_LAYOUT]: (e: MouseEvent) => void
   [EInternalEvents.MSG_TEXTFIELD_EDITED]: (e: TMsgContent) => void
   [EInternalEvents.UNREAD_MESSAGES_COUNT]: (count: number) => void
   [EInternalEvents.LAST_FRIEND_REQUEST]: () => void
   [EInternalEvents.SAME_PATH_NAVIGATION]: () => void
   [EInternalEvents.SEND_FRIEND_REQUEST]: (requestData: TGetFriendRequestsData) => void
}

export const eventEmitter = new EventEmitter<IEventEmitter>()
