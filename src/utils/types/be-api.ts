/**
 * This file contains the types for the BE API server (backend api server)
 */
import type { EFriendRequestStatus, EMessageTypes, ESortTypes } from "@/utils/enums"
import type { EMessageStatus } from "@/utils/socket/enums"

// ================================= DB entities =================================
export type TUser = {
  id: number
  email: string
  password: string
  createdAt: string
}

export type TProfile = {
  id: number
  createdAt: string
  fullName: string
  birthday?: string
  about?: string
  avatar?: string
  userId: number
}

export type TUserWithProfile = TUser & { Profile: Omit<TProfile, "userId"> }

export type TUserWithoutPassword = Omit<TUser, "password">

export type TDirectChat = {
  id: number
  createdAt: string
  creatorId: number
  recipientId: number
  lastSentMessageId: number
}

export type TDirectMessage = {
  id: number
  createdAt: string
  content: string
  authorId: number
  directChatId: number
  status: EMessageStatus
  stickerUrl?: string | null
  mediaUrl: string | null
  type: EMessageTypes
  fileName?: string
  fileType?: string
  fileSize?: number
}

export type TFriend = {
  id: number
  senderId: number
  recipientId: number
  createdAt: Date
}

export type TFriendRequest = {
  id: number
  senderId: number
  recipientId: number
  status: EFriendRequestStatus
  createdAt: Date
  updatedAt: Date
}

export type TSticker = {
  id: number
  stickerName: string
  imageUrl: string
  categoryId: number
  createdAt: string
}

export type TStickerCategory = {
  name: string
  id: number
  createdAt: string
  idName: string
  thumbnailUrl: string
}

export type TGroupChat = {
  avatarUrl?: string
  id: number
  name: string
  creatorId: number
  createdAt: Date
  lastSentMessageId: number
}

export type TGroupMessage = {
  id: number
  createdAt: Date
  groupChatId: number
  content: string
  authorId: number
  type: EMessageTypes
  status: EMessageStatus
  stickerUrl?: string
}

export type TGroupChatMember = {
  id: number
  userId: number
  groupChatId: number
  joinedAt: Date
}

export type TGroupChatMemberWithUser = Omit<TGroupChatMember, "userId"> & {
  User: TUser
}

// ================================= API types =================================
export type TLoginUserParams = {
  email: string
  password: string
  keepSigned: boolean
}

export type TDirectChatData = TDirectChat & {
  Recipient: TUserWithProfile
}

export type TRegisterUserParams = {
  email: string
  password: string
  fullName: string
  birthday: string
}

export type TSearchUsersData = {
  id: number
  email: string
  Profile: {
    id: number
    fullName: string
    avatar?: string
  }
}

export type TGetFriendRequestsData = {
  id: number
  Sender: TUserWithProfile
  Recipient: TUserWithProfile
  createdAt: string
  status: EFriendRequestStatus
}

export type TGetFriendRequestsParams = {
  userId: number
  limit: number
  lastFriendRequestId?: number
}

export type TFriendRequestActionParams = {
  requestId: number
  action: EFriendRequestStatus
  senderId: number
}

export type TGetFriendsData = {
  id: number
  senderId: number
  createdAt: string
  Recipient: TUserWithProfile
}

export type TGetFriendsParams = {
  userId: number
  limit: number
  lastFriendId?: number
}

export type TSearchUsersParams = {
  keyword: string
  limit: number
  lastUserId?: number
}

export type TGetDirectMsgsParams = {
  msgOffset: number
  directChatId: number
  limit: number
  sortType: ESortTypes
  isFirstTime: boolean
}

export type TGetDirectMessagesData = {
  hasMoreMessages: boolean
  directMessages: TDirectMessage[]
}

export type TGlobalSearchData = {
  users: {
    id: number
    avatarUrl?: string
    fullName?: string
    isOnline: boolean
  }[]
  messages: {
    id: number
    avatarUrl?: string
    conversationName: string
    messageContent: string
  }[]
}

export type TFetchDirectChatsData = TDirectChat & {
  LastSentMessage: TDirectMessage
  Recipient: TUserWithProfile
  Creator: TUserWithProfile
}

export type TFetchGroupChatData = TGroupChat & {
  Members: TGroupChatMemberWithUser[]
}

export type TUploadGroupAvatarData = {
  avatarUrl: string
}

export type TGetGroupMsgsParams = {
  msgOffset: number
  groupChatId: number
  limit: number
  sortType: ESortTypes
  isFirstTime: boolean
}

export type TGetGroupMessagesData = {
  hasMoreMessages: boolean
  groupMessages: TGroupMessage[]
}

export type TGroupChatData = TGroupChat & {
  Members: TGroupChatMemberWithUser[]
}
