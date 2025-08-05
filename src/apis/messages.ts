import { clientAxios, requestConfig } from "@/configs/axios"
import type {
  TGetDirectMessagesData,
  TGetDirectMsgsParams,
  TGetGroupMessagesData,
  TGetGroupMsgsParams,
  TMessageFullInfo,
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

export const getFetchDirectMedia = (
  directChatId: number,
  limit?: number,
  offset?: number,
  sortType?: ESortTypes
) =>
  clientAxios.get<TMessageFullInfo[]>("message/direct-message/media/" + directChatId, {
    ...requestConfig,
    params: { limit, offset, sortType },
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
