/**
 * This file contains the types for the FE API server (frontend api server)
 */
import type { TEmoji } from "@/utils/types/global"
import type {
  TUserWithoutPassword,
  TProfile,
  TMediaFilters,
  TMessageFullInfo,
  TViolationReportErrorDetails,
} from "@/utils/types/be-api"
import type { TUserSettings } from "./be-api"
import type { EReportCategory } from "@/utils/enums"

export type TGetEmojisRes = {
  foodDrink: TEmoji[]
  activity: TEmoji[]
  travelPlaces: TEmoji[]
  smileyPeople: TEmoji[]
}

export type TGetEmojisErrRes = {
  error: string
}

export type TUserWithProfileFE = TUserWithoutPassword & { Profile: Omit<TProfile, "userId"> }

export type TGetUserSettingsRes = TUserSettings

export type TUpdateUserSettingsReq = {
  onlyReceiveFriendMessage: boolean
  pushNotificationEnabled: boolean
}

export type TCheckCanSendDirectMessageRes = {
  canSend: boolean
}

// ================================= Media Pagination Frontend Types =================================

export type TMediaPaginationState = {
  items: TMessageFullInfo[]
  currentPage: number
  totalPages: number
  totalItems: number
  hasMore: boolean
  loading: boolean
  error: string | null
  filters: TMediaFilters
  sortOrder: "asc" | "desc"
}

export type TMediaCacheState = {
  cachedPages: Map<string, { data: TMessageFullInfo[]; timestamp: number }>
  lastUpdated: Map<string, Date>
  memoryUsage: number
  maxCacheSize: number
}

// ================================= Report Frontend Types =================================

export type TReportedMessageFE = {
  messageId: number
  messageType: string
  messageContent: string
  conversationId: number
  conversationType: "direct" | "group"
  senderName: string
  senderAvatar: string
  senderId: number
}

export type TReportSession = {
  conversationId: number
  conversationType: "direct" | "group"
  reportedMessages: TReportedMessageFE[]
  reason?: string
  description?: string
}

export type TCreateViolationReportDataFE = {
  reportedUserId: number
  reportCategory: EReportCategory
  reasonText?: string
  reportedMessages?: TReportedMessageFE[]
}

export type TCreateViolationReportResponseFE = {
  success: boolean
  reportId?: number
  message?: string
  error?: string
  code?: string
  details?: TViolationReportErrorDetails
}

// ================================= Admin Violation Reports Frontend Types =================================

export type TAdminViolationReportFE = {
  id: number
  reporterId: number
  reporterName: string
  reporterEmail: string
  reportedUserId: number
  reportedUserName: string
  reportedUserEmail: string
  reportCategory: "SENSITIVE_CONTENT" | "BOTHER" | "FRAUD" | "OTHER"
  reasonText?: string | null
  status: "PENDING" | "RESOLVED" | "DISMISSED"
  evidenceCount: {
    images: number
    messages: number
  }
  createdAt: string
  updatedAt: string
}

export type TAdminViolationReportDetailFE = {
  id: number
  reporterId: number
  reporterName: string
  reporterEmail: string
  reportedUserId: number
  reportedUserName: string
  reportedUserEmail: string
  reportCategory: "SENSITIVE_CONTENT" | "BOTHER" | "FRAUD" | "OTHER"
  reasonText?: string | null
  status: "PENDING" | "RESOLVED" | "DISMISSED"
  evidenceCount: {
    images: number
    messages: number
  }
  reportImages: Array<{
    id: number
    imageUrl: string
    createdAt: string
  }>
  reportedMessages: Array<{
    id: number
    messageId: number
    messageType: string
    messageContent: string
    createdAt: string
  }>
  createdAt: string
  updatedAt: string
}

export type TAdminViolationReportsDataFE = {
  reports: TAdminViolationReportFE[]
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

export type TGetAdminViolationReportsParamsFE = {
  page?: number
  limit?: number
  search?: string
  status?: "PENDING" | "RESOLVED" | "DISMISSED" | "ALL"
  category?: "SENSITIVE_CONTENT" | "BOTHER" | "FRAUD" | "OTHER" | "ALL"
  startDate?: string
  endDate?: string
  sortBy?: "createdAt" | "updatedAt"
  sortOrder?: "asc" | "desc"
}

export type TUpdateAdminViolationReportStatusResponseFE = {
  success: boolean
  message: string
  error?: string
}

export type TAdminBanUserResponseFE = {
  success: boolean
  message: string
  error?: string
}
