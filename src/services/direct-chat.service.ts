import { getFetchDirectChat, getFetchDirectChats } from "@/apis/direct-chat"
import { DirectChatError } from "@/utils/custom-errors"
import { convertToDirectChatsUIData } from "@/utils/data-convertors/conversations-convertor"
import { EDirectChatErrMsgs } from "@/utils/enums"
import type { TDirectChatData } from "@/utils/types/be-api"
import { TConversationCard } from "@/utils/types/global"

class DirectChatService {
   async fetchDirectChat(directChatId: number): Promise<TDirectChatData> {
      const { data } = await getFetchDirectChat(directChatId)
      if (!data) {
         throw new DirectChatError(EDirectChatErrMsgs.CONV_NOT_FOUND)
      }
      return data
   }

   async fetchDirectChats(limit: number, lastId?: number): Promise<TConversationCard[]> {
      const { data } = await getFetchDirectChats(limit, lastId)
      if (!data) {
         throw new DirectChatError(EDirectChatErrMsgs.CONVS_NOT_FOUND)
      }
      return convertToDirectChatsUIData(data)
   }
}

export const directChatService = new DirectChatService()
