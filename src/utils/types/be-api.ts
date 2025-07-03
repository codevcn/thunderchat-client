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
   birthday: string | null
   about: string | null
   avatar: string | null
   userId: number
}

export type TUserWithProfile = TUser & { Profile: Omit<TProfile, "id" | "userId"> | null }

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
   stickerUrl: string | null
   type: EMessageTypes
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
   firstName: string
   lastName: string
   birthday: string
}

export type TSearchUsersData = {
   id: number
   email: string
   Profile: {
      id: number
      fullName: string
      avatar: string | null
   } | null
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
