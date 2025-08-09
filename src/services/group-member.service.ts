import {
  getFetchGroupChatMembers,
  getSearchGroupChatMembers,
  postAddMembersToGroupChat,
  removeGroupChatMember,
} from "@/apis/group-member"
import type { TAddMembersToGroupChatRes, TGroupChatMemberWithUser } from "@/utils/types/be-api"

class GroupMemberService {
  async fetchGroupChatMembers(groupChatId: number): Promise<TGroupChatMemberWithUser[]> {
    const { data } = await getFetchGroupChatMembers(groupChatId)
    return data
  }

  async searchGroupChatMembers(
    groupChatId: number,
    keyword: string
  ): Promise<TGroupChatMemberWithUser[]> {
    const { data } = await getSearchGroupChatMembers(groupChatId, keyword)
    return data
  }

  async removeGroupChatMember(groupChatId: number, userId: number): Promise<void> {
    await removeGroupChatMember(groupChatId, userId)
  }

  async addMembersToGroupChat(
    groupChatId: number,
    memberIds: number[]
  ): Promise<TAddMembersToGroupChatRes> {
    const { data } = await postAddMembersToGroupChat(groupChatId, memberIds)
    return data
  }
}

export const groupMemberService = new GroupMemberService()
