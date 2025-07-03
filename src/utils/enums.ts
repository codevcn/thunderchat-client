export enum EAuthStatus {
   UNKNOWN = "AUTH_STATUS_UNKNOWN",
   AUTHENTICATED = "AUTH_STATUS_AUTHENTICATED",
   UNAUTHENTICATED = "AUTH_STATUS_UNAUTHENTICATED",
}

export enum EPaginations {
   FRIEND_REQUESTS_PAGE_SIZE = 5,
   FRIENDS_PAGE_SIZE = 5,
   SEARCH_USERS_PAGE_SIZE = 20,
   DIRECT_MESSAGES_PAGE_SIZE = 20,
}

export enum EDirectChatErrMsgs {
   CONV_NOT_FOUND = "Direct Chat not found",
}

export enum EInvalidHttpErrMsgs {
   INVALID_REQUEST = "Invalid request",
}

export enum EServerErrMsgs {
   BAD_NETWORK_OR_ERROR = "Bad network or error from server.",
}

export enum ECustomHttpErrMsgs {
   SOMETHING_WENT_WRONG = "Something went wrong, please try again minutes later!",
}

export enum EFriendRequestStatus {
   PENDING = "PENDING",
   ACCEPTED = "ACCEPTED",
   REJECTED = "REJECTED",
}

export enum ETimeFormats {
   MMMM_DD_YYYY = "MMMM DD, YYYY",
   HH_mm = "HH:mm",
}

export enum ECommonStatus {
   SUCCESS = "success",
   FAIL = "fail",
   ERROR = "error",
}

export enum ESortTypes {
   ASC = "ASC",
   DESC = "DESC",
}

export enum ELocalStorageKeys {
   LAST_PAGE_ACCESSED = "LAST_PAGE_ACCESSED",
   THE_LAST_DIRECT_CHAT_ID = "TL_CONV_ID",
}

export enum EStickerCategory {
   FOOD_DRINK = "food-drink",
   ACTIVITY = "activity",
   TRAVEL_PLACES = "travel-places",
   SMILEY_PEOPLE = "smiley-people",
}

export enum EMessageTypes {
   TEXT = "TEXT",
   STICKER = "STICKER",
}
