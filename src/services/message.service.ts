import { getFetchDirectMessages, getFetchGroupMessages } from "@/apis/messages"
import type {
  TGetDirectMessagesData,
  TGetDirectMsgsParams,
  TGetGroupMessagesData,
  TGetGroupMsgsParams,
} from "@/utils/types/be-api"

class MessageService {
  async fetchDirectMessages(params: TGetDirectMsgsParams): Promise<TGetDirectMessagesData> {
    const { data } = await getFetchDirectMessages(params)
    console.log(">>> DEBUG data:", data)
    return data
  }

  async fetchGroupMessages(params: TGetGroupMsgsParams): Promise<TGetGroupMessagesData> {
    const { data } = await getFetchGroupMessages(params)
    return data
  }
}

export const messageService = new MessageService()
