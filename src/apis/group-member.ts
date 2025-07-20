import { clientAxios, requestConfig } from "@/configs/axios"
import type { TGroupChatMemberWithUser } from "@/utils/types/be-api"
import type { TSuccess } from "@/utils/types/global"

export const getSearchGroupChatMembers = (groupChatId: number, keyword: string) =>
  clientAxios.get<TGroupChatMemberWithUser[]>("/group-member/search-group-chat-members", {
    ...requestConfig,
    params: { groupChatId, keyword },
  })

export const getFetchGroupChatMembers = (groupChatId: number) =>
  clientAxios.get<TGroupChatMemberWithUser[]>("/group-member/fetch-group-chat-members", {
    ...requestConfig,
    params: { groupChatId },
  })

export const removeGroupChatMember = (groupChatId: number, memberId: number) =>
  clientAxios.delete<TSuccess>("/group-member/remove-group-chat-member", {
    ...requestConfig,
    params: { groupChatId, memberId },
  })
