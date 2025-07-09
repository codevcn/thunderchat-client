import {
  deleteDeleteGroupAvatar,
  getFetchGroupChat,
  getFetchGroupChats,
  putUpdateGroupChat,
  postCreateGroupChat,
  postUploadGroupAvatar,
} from "@/apis/group-chat"
import type {
  TGroupChat,
  TGroupChatData,
  TUpdateGroupChatParams,
  TUploadGroupAvatarData,
} from "@/utils/types/be-api"
import type { TConversationCard, TSuccess } from "@/utils/types/global"
import { convertToGroupChatsUIData } from "@/utils/data-convertors/conversations-convertor"

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

  async fetchGroupChat(groupChatId: number): Promise<TGroupChatData> {
    const { data } = await getFetchGroupChat(groupChatId)
    return data
  }

  async fetchGroupChats(limit: number, lastId?: number): Promise<TConversationCard[]> {
    const { data } = await getFetchGroupChats(limit, lastId)
    return convertToGroupChatsUIData(data)
  }

  async updateGroupChat(
    groupChatId: number,
    updates: Partial<TUpdateGroupChatParams>
  ): Promise<TSuccess> {
    const { data } = await putUpdateGroupChat(groupChatId, updates)
    return data
  }
}

export const groupChatService = new GroupChatService()
