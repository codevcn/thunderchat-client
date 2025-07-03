import { getFetchDirectChat } from "@/apis/direct-chat"
import { DirectChatError } from "@/utils/custom-errors"
import { EDirectChatErrMsgs } from "@/utils/enums"
import type { TDirectChatData } from "@/utils/types/be-api"

class DirectChatService {
   async fetchDirectChat(directChatId: number): Promise<TDirectChatData> {
      const { data } = await getFetchDirectChat(directChatId)
      if (!data) {
         throw new DirectChatError(EDirectChatErrMsgs.CONV_NOT_FOUND)
      }
      return data
   }
}

export const directChatService = new DirectChatService()
