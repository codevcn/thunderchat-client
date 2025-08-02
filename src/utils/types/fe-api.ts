/**
 * This file contains the types for the FE API server (frontend api server)
 */
import type { TEmoji } from "@/utils/types/global"
import type { TUserWithoutPassword, TProfile } from "@/utils/types/be-api"
import type { TUserSettings } from "./be-api"

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
}

export type TCheckCanSendDirectMessageRes = {
  canSend: boolean
}

// ================================= Media Pagination Frontend Types =================================

export type TMediaPaginationState = {
  items: any[]
  currentPage: number
  totalPages: number
  totalItems: number
  hasMore: boolean
  loading: boolean
  error: string | null
  filters: {
    type?: "image" | "video" | "file" | "voice"
    senderId?: number
    fromDate?: string
    toDate?: string
  }
  sortOrder: "asc" | "desc"
}

export type TMediaCacheState = {
  cachedPages: Map<number, any[]>
  lastUpdated: Map<number, Date>
  memoryUsage: number
  maxCacheSize: number
}
