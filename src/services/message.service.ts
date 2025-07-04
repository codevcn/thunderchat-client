import { getFetchDirectMessages } from "@/apis/messages"
import type { TGetDirectMessagesData, TGetDirectMsgsParams } from "@/utils/types/be-api"

class MessageService {
   async fetchDirectMessages(params: TGetDirectMsgsParams): Promise<TGetDirectMessagesData> {
      const { data } = await getFetchDirectMessages(params)
      return data
   }
}

export const messageService = new MessageService()
