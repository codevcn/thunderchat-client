import {
  getFetchDirectChat,
  getFetchDirectChats,
  getDirectMessageContext,
  getNewerDirectMessages,
  postCreateDirectChat,
} from "@/apis/direct-chat"
import { DirectChatError } from "@/utils/custom-errors"
import { convertToDirectChatsUIData } from "@/utils/data-convertors/conversations-convertor"
import { EDirectChatErrMsgs } from "@/utils/enums"
import type { TDirectChatData, TUserWithProfile } from "@/utils/types/be-api"
import { TConversationCard } from "@/utils/types/global"

class DirectChatService {
  async fetchDirectChat(directChatId: number): Promise<TDirectChatData> {
    const { data } = await getFetchDirectChat(directChatId)
    if (!data) {
      throw new DirectChatError(EDirectChatErrMsgs.CONV_NOT_FOUND)
    }
    return data
  }

  async fetchDirectChats(
    user: TUserWithProfile,
    limit: number,
    lastId?: number
  ): Promise<TConversationCard[]> {
    const { data } = await getFetchDirectChats(limit, lastId)
    if (!data) {
      throw new DirectChatError(EDirectChatErrMsgs.CONVS_NOT_FOUND)
    }
    return convertToDirectChatsUIData(data, user)
  }

  async getMessageContext(messageId: number) {
    const { data } = await getDirectMessageContext(messageId)
    if (!data) throw new DirectChatError("Không tìm thấy context message")
    return data
  }

  async getNewerMessages(directChatId: number, msgOffset: number, limit?: number) {
    const { data } = await getNewerDirectMessages(directChatId, msgOffset, limit)
    if (!data) throw new DirectChatError("Không tìm thấy messages mới hơn")
    return data
  }

  async createOrGetDirectChat(recipientId: number) {
    const { data } = await postCreateDirectChat(recipientId)
    return data
  }
}

export const directChatService = new DirectChatService()
