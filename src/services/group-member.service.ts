import {
  getFetchGroupChatMembers,
  getSearchGroupChatMembers,
  removeGroupChatMember,
} from "@/apis/group-member"
import type { TGroupChatMemberWithUser } from "@/utils/types/be-api"

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
    console.log(">>> info:", { groupChatId, userId })
    await removeGroupChatMember(groupChatId, userId)
  }
}

export const groupMemberService = new GroupMemberService()
