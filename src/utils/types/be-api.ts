/**
 * This file contains the types for the BE API server (backend api server)
 */
import type {
  EFriendRequestStatus,
  EGroupChatRole,
  EMessageTypes,
  ESortTypes,
  EChatType,
  EMessageMediaTypes,
  EAppRole,
  EReportCategory,
  EViolationReportStatus,
  EBanType,
  EGroupChatPermissions,
} from "@/utils/enums"
import type { EMessageStatus } from "@/utils/socket/enums"
import { TReportedMessageFE } from "./fe-api"

// ================================= DB entities =================================
export type TUser = {
  id: number
  email: string
  password: string
  createdAt: string
  role: EAppRole
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
  lastSentMessageId?: number
}

export type TMessage = {
  id: number
  createdAt: string
  content: string
  authorId: number
  directChatId?: number
  groupChatId?: number
  status: EMessageStatus
  stickerId?: number
  mediaId?: number
  type: EMessageTypes
  isDeleted: boolean
  isViolated: boolean
}

export type TMessageMedia = {
  id: number
  type: EMessageMediaTypes
  createdAt: Date
  url: string
  fileSize: number
  fileName: string
  thumbnailUrl: string
}

export type TMsgWithMediaSticker = TMessage & {
  Media?: TMessageMedia
  Sticker?: TSticker
}

export type TMessageWithMedia = TMessage & {
  Media?: TMessageMedia
}

export type TMessageWithSticker = TMessage & {
  Sticker?: TSticker
}

export type TMessageWithAuthor = TMessage & {
  Author: TUserWithProfile
}

export type TMessageFullInfo = TMessageWithAuthor & {
  ReplyTo:
    | (TMsgWithMediaSticker & {
        Author: TUserWithProfile
      })
    | null
  Media: TMessageMedia | null
  Sticker: TSticker | null
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
  lastSentMessageId?: number
  inviteCode?: string
}

export type TGroupChatMember = {
  id: number
  userId: number
  groupChatId: number
  joinedAt: string
  role: EGroupChatRole
}

export type TGroupChatMemberWithUser = TGroupChatMember & {
  User: TUser & {
    Profile: TProfile
  }
}

export type TBlockedUser = {
  id: number
  blockerUserId: number
  blockedUserId: number
  createdAt: Date
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
  Sender: TUserWithProfile
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
  msgOffset?: number
  directChatId: number
  limit: number
  sortType: ESortTypes
  isFirstTime: boolean
}

export type TGetMessagesMessage = TMessageFullInfo

export type TGetDirectMessagesData = {
  hasMoreMessages: boolean
  directMessages: TGetMessagesMessage[]
}

export type TGlobalSearchData = {
  users: (TUserWithProfile & {
    isOnline: boolean
  })[]
  messages: {
    id: number
    avatarUrl?: string
    conversationName: string
    messageContent: string
    highlights: string[]
    chatType: EChatType
    chatId: number
    createdAt: string
  }[]
  nextSearchOffset: {
    messageSearchOffset?: TMessageSearchOffset
    userSearchOffset?: TUserSearchOffset
  }
}

export type TFetchDirectChatsData = TDirectChat & {
  LastSentMessage?: TMessage
  Recipient: TUserWithProfile
  Creator: TUserWithProfile
  unreadMessageCount?: number
}

export type TUploadGroupAvatarData = {
  avatarUrl: string
}

export type TGetGroupMsgsParams = {
  msgOffset?: number
  groupChatId: number
  limit: number
  sortType: ESortTypes
  isFirstTime: boolean
}

export type TGetGroupMessagesData = {
  hasMoreMessages: boolean
  groupMessages: TGetMessagesMessage[]
}

export type TGroupChatData = TGroupChat & {
  Creator: TUserWithProfile
  Members: TGroupChatMemberWithUser[]
}

export type TGroupChatState = TGroupChat & {
  Creator: TUserWithProfile
}

export type TFetchGroupChatsData = TGroupChat & {
  LastSentMessage?: TMessage
  Creator: TUserWithProfile
  unreadMessageCount?: number
}

export type TUpdateGroupChatParams = {
  groupName?: string
  avatarUrl?: string
}

export type TUserSettings = {
  id: number
  userId: number
  onlyReceiveFriendMessage: boolean
}

export type TUpdateUserSettingsParams = {
  onlyReceiveFriendMessage: boolean
}

export type TCheckCanSendDirectMessageRes = {
  canSend: boolean
}
// Response khi xoá/thu hồi tin nhắn direct chat
export type TDeleteDirectMessageRes = {
  isDeleted: boolean
  content: string
}

export type TMessageSearchOffset = [string, string]

export type TUserSearchOffset = [string, string, string]

export type TUploadFileRes = {
  id: number
  url: string
  fileName: string
  fileType: string
  thumbnailUrl?: string
  fileSize: string
}
// ================================= Admin API Types =================================

export type TAdminUsersParams = {
  page: number
  limit: number
  search?: string
  status?: "all" | "NORMAL" | "WARNING" | "TEMPORARY_BAN" | "PERMANENT_BAN"
}

export type TAdminUser = {
  id: number
  email: string
  fullName: string
  avatar?: string
  birthday?: string | null
  about?: string | null
  status: string
  createdAt: string
}

export type TAdminUsersData = {
  users: TAdminUser[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export type TAdminUserActionParams = {
  userId: number
  isActive: boolean
}

export type TUpdateUserEmailResponse = {
  success: boolean
  message: string
  error?: string
}

export type TAdminStatisticsData = {
  systemHealth: "good" | "warning" | "error"
  totalUsers: number
  activeUsers: number
  lockedUsers: number
  newUsersToday: number
  totalMessages: number
  totalChats: number
  totalFiles: number
}

// ================================= Media Pagination API Types =================================

export type TMediaItem = TMessageFullInfo

export type TMediaPaginationInfo = {
  currentPage: number
  totalPages: number
  totalItems: number
  hasMore: boolean
  limit: number
}

export type TGetMediaMessagesResponse = {
  success: boolean
  data: {
    items: TMediaItem[]
    pagination: TMediaPaginationInfo
  }
  message?: string
  errorCode?: string | null
}

export type TMediaFilters = {
  type?: EMessageMediaTypes
  types?: EMessageMediaTypes[]
  senderId?: number
  fromDate?: string
  toDate?: string
}

export type TGetMediaMessagesParams = {
  directChatId: number
  type?: EMessageMediaTypes
  types?: EMessageMediaTypes[]
  senderId?: number
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
  sort?: "asc" | "desc"
}

export type TMediaStatisticsData = {
  total: number
  images: number
  videos: number
  files: number
  voices: number
}

export type TGetMediaStatisticsResponse = {
  success: boolean
  data: TMediaStatisticsData
  message?: string
  errorCode?: string | null
}

// ================================= Report Types =================================

export type TReportedMessage = {
  id?: number
  messageId: number
  messageType: EMessageTypes
  messageContent: string
  reportId?: number | null
  createdAt?: string
}

export type TViolationReport = {
  id?: number
  reporterId: number
  reportedUserId: number
  reportCategory: EReportCategory
  reasonText?: string
  status: "PENDING" | "REVIEWED" | "RESOLVED"
  createdAt?: string
  updatedAt?: string
}

export type TCreateViolationReportData = {
  reportedUserId: number
  reportCategory: EReportCategory
  reasonText?: string
  reportedMessages?: TReportedMessage[]
}

export type TViolationReportErrorDetails =
  | { reportedUserId: number }
  | { existingReportId: number; createdAt: Date }
  | { currentCount: number; maxAllowed: number }
  | { error: string }
  | { originalError: string }

export type TCreateViolationReportResponse = {
  success: boolean
  reportId?: number
  message?: string
  error?: string
  code?: string
  details?: TViolationReportErrorDetails
}

// ================================= Admin Violation Reports Types =================================

export type TViolationReportStatus = EViolationReportStatus
export type TViolationReportCategory = EReportCategory

export type TAdminViolationReport = {
  id: number
  reporterId: number
  reporterName: string
  reporterEmail: string
  reportedUserId: number
  reportedUserName: string
  reportedUserEmail: string
  reportCategory: TViolationReportCategory
  reasonText?: string | null
  status: TViolationReportStatus
  evidenceCount: {
    images: number
    messages: number
  }
  createdAt: string
  updatedAt: string
}

export type TViolationAction = {
  id: number
  actionType: EBanType
  actionReason: string
  bannedUntil: string | null
  createdAt: string
}

export type TAdminViolationReportDetail = {
  id: number
  reporterId: number
  reporterName: string
  reporterEmail: string
  reportedUserId: number
  reportedUserName: string
  reportedUserEmail: string
  reportCategory: TViolationReportCategory
  reasonText?: string | null
  status: TViolationReportStatus
  evidenceCount: {
    images: number
    messages: number
  }
  reportImages: Array<{
    id: number
    imageUrl: string
    createdAt: string
  }>
  reportedMessages: TReportedMessageFE[]
  violationAction: TViolationAction | null
  latestBanAction: TViolationAction | null
  createdAt: string
  updatedAt: string
}

export type TAdminViolationReportsData = {
  reports: TAdminViolationReport[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  statistics: {
    total: number
    pending: number
    resolved: number
    dismissed: number
  }
}

export type TGetAdminViolationReportsParams = {
  page?: number
  limit?: number
  search?: string
  status?: TViolationReportStatus | "ALL"
  category?: TViolationReportCategory | "ALL"
  startDate?: string
  endDate?: string
  sortBy?: "createdAt" | "updatedAt"
  sortOrder?: "asc" | "desc"
}

export type TUpdateAdminViolationReportStatusResponse = {
  success: boolean
  message: string
  error?: string
}

export type TAdminBanUserResponse = {
  success: boolean
  message: string
  error?: string
}

export type TUserReportHistoryItem = {
  id: number
  reportCategory: TViolationReportCategory
  status: TViolationReportStatus
  createdAt: string
  reasonText: string | null
  // For 'reported' type (reports made by user)
  reportedUserName?: string
  reportedUserEmail?: string
  // For 'reportedBy' type (reports about user)
  reporterName?: string
  reporterEmail?: string
}

export type TUserReportHistoryData = {
  reports: TUserReportHistoryItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Admin Overview Types
export type TAdminOverviewTimeRange = {
  startDate: string
  endDate: string
  period: "day" | "week" | "month" | "year" | "custom"
}

export type TAdminOverviewChartData = {
  date: string
  count: number
}

export type TAdminOverviewCharts = {
  userGrowth?: TAdminOverviewChartData[]
  messageActivity?: TAdminOverviewChartData[]
  groupChatActivity?: TAdminOverviewChartData[]
  // Bar chart: Số tin nhắn theo loại chính (TEXT, STICKER, MEDIA)
  messageTypeDistribution?: Array<{
    type: "TEXT" | "STICKER" | "MEDIA"
    count: number
  }>
  // Stacked bar: Tin nhắn media theo loại (IMAGE, VIDEO, AUDIO, DOCUMENT)
  mediaMessageDistribution?: Array<{
    type: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT"
    count: number
  }>
}

export type TAdminOverviewData = {
  activeUsers: number
  totalMessages: number
  totalDirectMessages: number
  totalGroupMessages: number
  activeGroupChats: number
  totalUsers: number
  totalViolationReports: number
  resolvedViolationReports: number
  pendingViolationReports: number
  dismissedViolationReports: number
  timeRange: TAdminOverviewTimeRange
  charts?: TAdminOverviewCharts
}

export type TSystemOverviewData = {
  activeUsers: number
  totalMessages: number
  totalDirectMessages: number
  totalGroupMessages: number
  activeGroupChats: number
  totalUsers: number
  totalViolationReports: number
  resolvedViolationReports: number
  pendingViolationReports: number
  dismissedViolationReports: number
  timeRange: {
    startDate: string
    endDate: string
    period: "day" | "week" | "month" | "year" | "custom"
  }
  charts?: {
    userGrowth?: Array<{ date: string; count: number }>
    messageActivity?: Array<{ date: string; count: number }>
    groupChatActivity?: Array<{ date: string; count: number }>
    // Bar chart: Số tin nhắn theo loại chính (TEXT, STICKER, MEDIA)
    messageTypeDistribution?: Array<{
      type: "TEXT" | "STICKER" | "MEDIA"
      count: number
    }>
    // Stacked bar: Tin nhắn media theo loại (IMAGE, VIDEO, AUDIO, DOCUMENT)
    mediaMessageDistribution?: Array<{
      type: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT"
      count: number
    }>
  }
}

// Admin User Message Statistics Types
export type TAdminUserMessageStats = {
  userId: number
  email: string
  fullName: string
  avatar?: string
  directMessageCount: number
  groupMessageCount: number
  totalMessageCount: number
  lastMessageAt: string
}

export type TAdminUserMessageStatsParams = {
  page: number
  limit: number
  search?: string
  sortBy?: "directMessageCount" | "groupMessageCount" | "totalMessageCount" | "lastMessageAt"
  sortOrder?: "asc" | "desc"
}

export type TAdminUserMessageStatsData = {
  users: TAdminUserMessageStats[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export type TAddMembersToGroupChatRes = {
  addedMembers: TGroupChatMemberWithUser[]
}

export type TTogglePinGroupChatRes = {
  success: boolean
  deletedCount: number
}

export type TPinnedChat = {
  id: number
  directChatId: number | null
  groupChatId: number | null
  pinnedBy: number
  pinnedAt: Date
}

export type TBlockedUserFullInfo = TBlockedUser & {
  UserBlocker: TUserWithProfile
  UserBlocked: TUserWithProfile
}

export type TJoinGroupChatByInviteLinkRes = {
  groupChatId: number
  message?: string
}

export type TCreateInviteLinkRes = {
  inviteCode: string
}

export type TGroupChatPermissionState = {
  [key in EGroupChatPermissions]: boolean
}

export type TFetchGroupChatPermissionsRes = {
  permissions: TGroupChatPermissionState
}
