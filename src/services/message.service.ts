import {
  getFetchDirectMedia,
  getFetchDirectMessages,
  getFetchGroupMessages,
  getFetchGroupVoiceMessages,
  getFetchVoiceMessages,
  getMediaMessages as getMediaMessagesAPI,
  getMediaStatistics,
} from "@/apis/messages"
import { ESortTypes, EMessageMediaTypes } from "@/utils/enums"
import type {
  TGetDirectMessagesData,
  TGetDirectMsgsParams,
  TGetGroupMessagesData,
  TGetGroupMsgsParams,
  TMessageFullInfo,
  TGetMediaMessagesResponse,
  TGetMediaStatisticsResponse,
  TGetMediaMessagesParams,
} from "@/utils/types/be-api"

class MessageService {
  async fetchDirectMessages(params: TGetDirectMsgsParams): Promise<TGetDirectMessagesData> {
    const { data } = await getFetchDirectMessages(params)
    return data
  }

  async fetchGroupMessages(params: TGetGroupMsgsParams): Promise<TGetGroupMessagesData> {
    const { data } = await getFetchGroupMessages(params)
    return data
  }

  async fetchDirectMedia(
    directChatId: number,
    limit = 100,
    offset = 0,
    sortType: ESortTypes
  ): Promise<TMessageFullInfo[]> {
    const { data } = await getFetchDirectMedia(directChatId, limit, offset, sortType)
    return data
  }

  async fetchVoiceMessages(
    directChatId: number,
    limit = 100,
    offset = 0,
    sortType: ESortTypes
  ): Promise<TGetDirectMessagesData> {
    const { data } = await getFetchVoiceMessages(directChatId, limit, offset, sortType)
    return data
  }

  async fetchGroupVoiceMessages(
    groupChatId: number,
    limit = 100,
    offset = 0,
    sortType: ESortTypes
  ): Promise<TGetGroupMessagesData> {
    const { data } = await getFetchGroupVoiceMessages(groupChatId, limit, offset, sortType)
    return data
  }

  // ================================= Media Pagination Methods =================================

  /**
   * Get media messages with pagination and filters
   */
  async getMediaMessages(params: TGetMediaMessagesParams): Promise<TGetMediaMessagesResponse> {
    try {
      const { data } = await getMediaMessagesAPI(params)
      return data
    } catch (error) {
      console.error("[MessageService] Error fetching media messages:", error)
      throw error
    }
  }

  /**
   * Get media statistics for a chat
   */
  async getMediaStatistics(directChatId: number): Promise<TGetMediaStatisticsResponse> {
    try {
      const { data } = await getMediaStatistics(directChatId)
      return data
    } catch (error) {
      console.error("[MessageService] Error fetching media statistics:", error)
      throw error
    }
  }

  /**
   * Get media messages with default pagination
   */
  async getMediaMessagesWithDefaults(
    directChatId: number,
    page: number = 1,
    limit: number = 20,
    sort: "asc" | "desc" = "desc"
  ): Promise<TGetMediaMessagesResponse> {
    return this.getMediaMessages({
      directChatId,
      page,
      limit,
      sort,
    })
  }

  /**
   * Get media messages with filters
   */
  async getMediaMessagesWithFilters(
    directChatId: number,
    filters: {
      type?: EMessageMediaTypes
      types?: EMessageMediaTypes[]
      senderId?: number
      fromDate?: string
      toDate?: string
    },
    page: number = 1,
    limit: number = 20,
    sort: "asc" | "desc" = "desc"
  ): Promise<TGetMediaMessagesResponse> {
    return this.getMediaMessages({
      directChatId,
      ...filters,
      page,
      limit,
      sort,
    })
  }

  /**
   * Get media messages with multiple types (for Images/Video tab)
   */
  async getMediaMessagesWithMultipleTypes(
    directChatId: number,
    types: EMessageMediaTypes[],
    filters: {
      senderId?: number
      fromDate?: string
      toDate?: string
    } = {},
    page: number = 1,
    limit: number = 20,
    sort: "asc" | "desc" = "desc"
  ): Promise<TGetMediaMessagesResponse> {
    return this.getMediaMessages({
      directChatId,
      types,
      ...filters,
      page,
      limit,
      sort,
    })
  }
}

export const messageService = new MessageService()
