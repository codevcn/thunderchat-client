import { clientAxios, requestConfig } from "@/configs/axios"
import type {
  TDirectMessage,
  TGetDirectMessagesData,
  TGetDirectMsgsParams,
  TGetGroupMessagesData,
  TGetGroupMsgsParams,
} from "../utils/types/be-api"
import { ESortTypes } from "@/utils/enums"

export const getFetchDirectMessages = (params: TGetDirectMsgsParams) =>
  clientAxios.get<TGetDirectMessagesData>("message/get-direct-messages/", {
    ...requestConfig,
    params,
  })

export const getFetchGroupMessages = (params: TGetGroupMsgsParams) =>
  clientAxios.get<TGetGroupMessagesData>("message/get-group-messages/", {
    ...requestConfig,
    params,
  })

// API mới để lấy chỉ voice messages
export const getFetchVoiceMessages = (
  directChatId: number,
  limit?: number,
  offset?: number,
  sortType?: ESortTypes
) =>
  clientAxios.get<TGetDirectMessagesData>("message/direct-message/voices/" + directChatId, {
    ...requestConfig,
    params: { limit, offset, sortType },
  })

// ================================= Media Pagination API =================================

import type {
  TGetMediaMessagesResponse,
  TGetMediaStatisticsResponse,
  TGetMediaMessagesParams,
} from "../utils/types/be-api"

/**
 * Get media messages with pagination and filters
 */
export const getMediaMessages = (params: TGetMediaMessagesParams) =>
  clientAxios.get<TGetMediaMessagesResponse>(`media-message/${params.directChatId}`, {
    ...requestConfig,
    params: {
      type: params.type,
      types: params.types,
      senderId: params.senderId,
      fromDate: params.fromDate,
      toDate: params.toDate,
      page: params.page,
      limit: params.limit,
      sort: params.sort,
    },
  })

/**
 * Get media statistics for a chat
 */
export const getMediaStatistics = (directChatId: number) =>
  clientAxios.get<TGetMediaStatisticsResponse>(`media-message/${directChatId}/statistics`, {
    ...requestConfig,
  })
