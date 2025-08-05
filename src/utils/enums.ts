export enum EAuthStatus {
  UNKNOWN = "AUTH_STATUS_UNKNOWN",
  AUTHENTICATED = "AUTH_STATUS_AUTHENTICATED",
  UNAUTHENTICATED = "AUTH_STATUS_UNAUTHENTICATED",
}

export enum EAdminAuthStatus {
  UNKNOWN = "ADMIN_AUTH_STATUS_UNKNOWN",
  AUTHENTICATED = "ADMIN_AUTH_STATUS_AUTHENTICATED",
  UNAUTHENTICATED = "ADMIN_AUTH_STATUS_UNAUTHENTICATED",
}

export enum EAdminMessages {
  ADMIN_ACCESS_REQUIRED = "Admin access required",
  USER_NOT_AUTHENTICATED = "User not authenticated",
  INVALID_ADMIN_CREDENTIALS = "Invalid admin credentials",
  ADMIN_NOT_FOUND = "Admin not found",
}

export enum EPaginations {
  FRIEND_REQUESTS_PAGE_SIZE = 5,
  FRIENDS_PAGE_SIZE = 5,
  SEARCH_USERS_PAGE_SIZE = 20,
  DIRECT_MESSAGES_PAGE_SIZE = 20,
}

export enum EDirectChatErrMsgs {
  CONV_NOT_FOUND = "Direct Chat not found",
  CONVS_NOT_FOUND = "Direct Chats not found",
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
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  DOCUMENT = "DOCUMENT",
  AUDIO = "AUDIO",
  PIN_NOTICE = "PIN_NOTICE",
}

export enum EGroupChatRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export enum EChatType {
  DIRECT = "DIRECT",
  GROUP = "GROUP",
}

export enum EAppRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum EReportCategory {
  SENSITIVE_CONTENT = "SENSITIVE_CONTENT",
  BOTHER = "BOTHER",
  FRAUD = "FRAUD",
  OTHER = "OTHER",
}

// Violation Report Status
export enum EViolationReportStatus {
  PENDING = "PENDING",
  RESOLVED = "RESOLVED",
  DISMISSED = "DISMISSED",
}

// Ban Type
export enum EBanType {
  WARNING = "WARNING",
  TEMPORARY_BAN = "TEMPORARY_BAN",
  PERMANENT_BAN = "PERMANENT_BAN",
}
