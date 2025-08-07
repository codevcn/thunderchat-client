import {
  getFetchGroupChat,
  getFetchGroupChats,
  getFindConversationWithOtherUser,
  getGroupMessageContext,
  getNewerGroupMessages,
  checkCanSendGroupMessage,
  deleteGroupMessage,
} from "@/apis/group-chat"
import { GroupChatError } from "@/utils/custom-errors"
import { convertToGroupChatsUIData } from "@/utils/data-convertors/conversations-convertor"
import { EGroupChatErrMsgs } from "@/utils/enums"
import type { TGroupChat, TGroupChatData, TUser } from "@/utils/types/be-api"
import type { TConversationCard } from "@/utils/types/global"

class GroupChatService {
  async fetchGroupChat(groupChatId: number, signal?: AbortSignal): Promise<TGroupChatData> {
    const { data } = await getFetchGroupChat(groupChatId, signal)
    if (!data) {
      throw new GroupChatError(EGroupChatErrMsgs.CONV_NOT_FOUND)
    }
    return data
  }

  async fetchGroupChats(limit: number, user: TUser, lastId?: number): Promise<TConversationCard[]> {
    const { data } = await getFetchGroupChats(limit, lastId)
    if (!data) {
      throw new GroupChatError(EGroupChatErrMsgs.CONVS_NOT_FOUND)
    }
    return convertToGroupChatsUIData(data, user)
  }

  async findConversationWithOtherUser(otherUserId: number): Promise<TGroupChat | null> {
    const { data } = await getFindConversationWithOtherUser(otherUserId)
    return data
  }

  async getMessageContext(messageId: number) {
    const { data } = await getGroupMessageContext(messageId)
    if (!data) throw new GroupChatError("Không tìm thấy context message")
    return data
  }

  async getNewerMessages(groupChatId: number, msgOffset: number, limit?: number) {
    const { data } = await getNewerGroupMessages(groupChatId, msgOffset, limit)
    if (!data) throw new GroupChatError("Không tìm thấy messages mới hơn")
    return data
  }

  async checkCanSendMessage(receiverId: number): Promise<boolean> {
    const { data } = await checkCanSendGroupMessage(receiverId)
    return !!data?.canSend
  }

  // Xoá/thu hồi tin nhắn group chat
  async deleteMessage(messageId: number) {
    const { data } = await deleteGroupMessage(messageId)
    return data
  }
}

export const groupChatService = new GroupChatService()
