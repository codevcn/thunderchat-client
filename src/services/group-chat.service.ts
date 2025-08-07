import {
  deleteDeleteGroupAvatar,
  getFetchGroupChat,
  getFetchGroupChats,
  putUpdateGroupChat,
  postCreateGroupChat,
  postUploadGroupAvatar,
  getGroupMessageContext,
  getNewerGroupMessages,
  deleteGroupMessage,
} from "@/apis/group-chat"
import type {
  TGroupChat,
  TGroupChatData,
  TUpdateGroupChatParams,
  TUploadGroupAvatarData,
  TUserWithProfile,
} from "@/utils/types/be-api"
import type { TConversationCard, TSuccess } from "@/utils/types/global"
import { convertToGroupChatsUIData } from "@/utils/data-convertors/conversations-convertor"
import { GroupChatError } from "@/utils/custom-errors"

class GroupChatService {
  async uploadGroupAvatar(avatar: File): Promise<TUploadGroupAvatarData> {
    const formData = new FormData()
    formData.append("avatar", avatar)
    const { data } = await postUploadGroupAvatar(formData)
    return data
  }

  async deleteGroupAvatar(avatarUrl: string): Promise<TSuccess> {
    const { data } = await deleteDeleteGroupAvatar(avatarUrl)
    return data
  }

  async createGroupChat(
    groupName: string,
    memberIds: number[],
    avatarUrl?: string
  ): Promise<TGroupChat> {
    const { data } = await postCreateGroupChat(groupName, memberIds, avatarUrl)
    return data
  }

  async fetchGroupChat(groupChatId: number, signal?: AbortSignal): Promise<TGroupChatData> {
    const { data } = await getFetchGroupChat(groupChatId, signal)
    return data
  }

  async fetchGroupChats(
    limit: number,
    user: TUserWithProfile,
    lastId?: number
  ): Promise<TConversationCard[]> {
    const { data } = await getFetchGroupChats(limit, lastId)
    return convertToGroupChatsUIData(data, user)
  }

  async updateGroupChat(
    groupChatId: number,
    updates: Partial<TUpdateGroupChatParams>
  ): Promise<TSuccess> {
    const { data } = await putUpdateGroupChat(groupChatId, updates)
    return data
  }

  async getMessageContext(messageId: number) {
    const { data } = await getGroupMessageContext(messageId)
    if (!data) throw new GroupChatError("Không tìm thấy context message")
    return data
  }

  async getNewerMessages(directChatId: number, msgOffset: number, limit?: number) {
    const { data } = await getNewerGroupMessages(directChatId, msgOffset, limit)
    if (!data) throw new GroupChatError("Không tìm thấy messages mới hơn")
    return data
  }

  // Xoá/thu hồi tin nhắn direct chat
  async deleteMessage(messageId: number) {
    const { data } = await deleteGroupMessage(messageId)
    return data
  }
}

export const groupChatService = new GroupChatService()
