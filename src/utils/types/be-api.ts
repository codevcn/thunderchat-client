/**
 * This file contains the types for the BE API server (backend api server)
 */
import type { EFriendRequestStatus, EGroupChatRole, EMessageTypes, ESortTypes } from "@/utils/enums"
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
  stickerUrl?: string
  mediaUrl?: string
  type: EMessageTypes
  fileName?: string
  fileType?: string
  fileSize?: number
  thumbnailUrl?: string | null
  isDeleted: boolean
}

export type TDirectMessageWithAuthor = TDirectMessage & {
  Author: TUserWithProfile
}

export type TDirectMessageWithAuthorAndReplyTo = TDirectMessageWithAuthor & {
  ReplyTo: TDirectMessageWithAuthor | null
}

export type TFriend = {
  id: number
  senderId: number
  recipientId: number
  createdAt: string
}

export type TFriendRequest = {
  id: number
  senderId: number
  recipientId: number
  status: EFriendRequestStatus
  createdAt: string
  updatedAt: string
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
  createdAt: string
  lastSentMessageId: number
}

export type TGroupMessage = {
  id: number
  createdAt: string
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
  joinedAt: string
  role: EGroupChatRole
}

export type TGroupChatMemberWithUser = Omit<TGroupChatMember, "userId"> & {
  User: TUser & {
    Profile: TProfile
  }
}

// ================================= API types =================================
export type TLoginUserParams = {
  email: string
  password: string
  keepSigned: boolean
}

export type TDirectChatData = TDirectChat & {
  Recipient: TUserWithProfile
  Creator: TUserWithProfile
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

export type TGetDirectMessagesMessage = TDirectMessageWithAuthorAndReplyTo

export type TGetDirectMessagesData = {
  hasMoreMessages: boolean
  directMessages: TGetDirectMessagesMessage[]
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
  LastSentMessage?: TDirectMessage
  Recipient: TUserWithProfile
  Creator: TUserWithProfile
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

export type TGroupChatData = TGroupChat

export type TFetchGroupChatsData = TGroupChat & {
  LastSentMessage?: TGroupMessage
  Creator: TUserWithProfile
}

export type TUpdateGroupChatParams = {
  groupName?: string
  avatarUrl?: string
}

// Response khi xoá/thu hồi tin nhắn direct chat
export type TDeleteDirectMessageRes = {
  isDeleted: boolean
  content: string
}
