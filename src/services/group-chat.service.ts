import {
  deleteDeleteGroupAvatar,
  getFetchGroupChat,
  postCreateGroup,
  postUploadGroupAvatar,
} from "@/apis/group-chat"
import type { TFetchGroupChatData, TUploadGroupAvatarData } from "@/utils/types/be-api"
import type { TSuccess } from "@/utils/types/global"

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

  async createGroup(groupName: string, memberIds: number[], avatarUrl?: string): Promise<TSuccess> {
    const { data } = await postCreateGroup(groupName, memberIds, avatarUrl)
    return data
  }

  async fetchGroupChat(groupChatId: number): Promise<TFetchGroupChatData> {
    const { data } = await getFetchGroupChat(groupChatId)
    return data
  }
}

export const groupChatService = new GroupChatService()
