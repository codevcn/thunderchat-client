import {
  getFetchDirectMedia,
  getFetchDirectMessages,
  getFetchGroupMessages,
  getFetchVoiceMessages,
} from "@/apis/messages"
import { ESortTypes } from "@/utils/enums"
import type {
  TGetDirectMessagesData,
  TGetDirectMsgsParams,
  TGetGroupMessagesData,
  TGetGroupMsgsParams,
  TMessageFullInfo,
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
}

export const messageService = new MessageService()
