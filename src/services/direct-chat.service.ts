import {
  getFetchDirectChat,
  getFetchDirectChats,
  getFindConversationWithOtherUser,
  getDirectMessageContext,
  getNewerDirectMessages,
  checkCanSendDirectMessage,
  deleteDirectMessage,
  deleteDirectChat,
} from "@/apis/direct-chat"
import { DirectChatError } from "@/utils/custom-errors"
import { convertToDirectChatsUIData } from "@/utils/data-convertors/conversations-convertor"
import { EDirectChatErrMsgs } from "@/utils/enums"
import type { TDirectChat, TDirectChatData, TUserWithProfile } from "@/utils/types/be-api"
import type { TConversationCard, TSuccess } from "@/utils/types/global"

class DirectChatService {
  async fetchDirectChat(directChatId: number, signal?: AbortSignal): Promise<TDirectChatData> {
    const { data } = await getFetchDirectChat(directChatId, signal)
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

  async findConversationWithOtherUser(otherUserId: number): Promise<TDirectChat | null> {
    const { data } = await getFindConversationWithOtherUser(otherUserId)
    return data
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

  async checkCanSendMessage(receiverId: number): Promise<boolean> {
    const { data } = await checkCanSendDirectMessage(receiverId)
    return !!data?.canSend
  }

  // Xoá/thu hồi tin nhắn direct chat
  async deleteMessage(messageId: number) {
    const { data } = await deleteDirectMessage(messageId)
    return data
  }

  async deleteDirectChat(directChatId: number): Promise<TSuccess> {
    const { data } = await deleteDirectChat(directChatId)
    return data
  }
}

export const directChatService = new DirectChatService()
