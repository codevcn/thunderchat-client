import {
  deleteDeleteGroupAvatar,
  getFetchGroupChat,
  getFetchGroupChats,
  putUpdateGroupChat,
  postCreateGroupChat,
  postUploadGroupAvatar,
  getGroupMessageContext,
  deleteGroupMessage,
  // getJoinGroupChatByInviteLink,
  postCreateInviteLink,
  putUpdateGroupChatPermissions,
  getFetchGroupChatPermissions,
  getFetchGroupJoiningRequests,
  putProcessGroupJoinRequest,
  postCreateGroupJoinRequest,
  getFetchGroupChatByInviteCode,
  postLeaveGroupChat,
} from "@/apis/group-chat"
import type {
  TGroupChat,
  TGroupChatData,
  // TJoinGroupChatByInviteLinkRes,
  TCreateInviteLinkRes,
  TUpdateGroupChatParams,
  TUploadGroupAvatarData,
  TUserWithProfile,
  TFetchGroupChatPermissionsRes,
  TGroupChatPermissionState,
  TGroupJoinRequestWithUser,
  TGroupJoinRequest,
  TGroupChatWithCreator,
} from "@/utils/types/be-api"
import type { TConversationCard, TSuccess } from "@/utils/types/global"
import { convertToGroupChatsUIData } from "@/utils/data-convertors/conversations-convertor"
import { GroupChatError } from "@/utils/custom-errors"
import { getNewerGroupMessages } from "@/apis/direct-chat"
import { EJoinRequestStatus } from "@/utils/enums"

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

  async getNewerMessages(groupChatId: number, msgOffset: number, limit?: number) {
    const { data } = await getNewerGroupMessages(groupChatId, msgOffset, limit)
    if (!data) throw new GroupChatError("Không tìm thấy messages mới hơn")
    return data
  }

  // Xoá/thu hồi tin nhắn direct chat
  async deleteMessage(messageId: number) {
    const { data } = await deleteGroupMessage(messageId)
    return data
  }

  // async joinGroupChatByInviteLink(token: string): Promise<TJoinGroupChatByInviteLinkRes> {
  //   const { data } = await getJoinGroupChatByInviteLink(token)
  //   return data
  // }

  async createInviteLink(groupChatId: number): Promise<TCreateInviteLinkRes> {
    const { data } = await postCreateInviteLink(groupChatId)
    return data
  }

  async updateGroupChatPermissions(
    groupChatId: number,
    permissions: TGroupChatPermissionState
  ): Promise<TSuccess> {
    const { data } = await putUpdateGroupChatPermissions(groupChatId, permissions)
    return data
  }

  async fetchGroupChatPermissions(groupChatId: number): Promise<TFetchGroupChatPermissionsRes> {
    const { data } = await getFetchGroupChatPermissions(groupChatId)
    return data
  }

  async fetchGroupJoiningRequests(
    groupChatId: number,
    status?: EJoinRequestStatus
  ): Promise<TGroupJoinRequestWithUser[]> {
    const { data } = await getFetchGroupJoiningRequests(groupChatId, status)
    return data
  }

  async processGroupJoinRequest(
    joinRequestId: number,
    status: EJoinRequestStatus,
    groupChatId: number
  ): Promise<TGroupJoinRequestWithUser> {
    const { data } = await putProcessGroupJoinRequest(joinRequestId, status, groupChatId)
    return data
  }

  async createGroupJoinRequest(groupChatId: number): Promise<TGroupJoinRequest> {
    const { data } = await postCreateGroupJoinRequest(groupChatId)
    return data
  }

  async fetchGroupChatByInviteCode(inviteCode: string): Promise<TGroupChatWithCreator | null> {
    const { data } = await getFetchGroupChatByInviteCode(inviteCode)
    return data
  }

  async leaveGroupChat(groupChatId: number): Promise<TSuccess> {
    const { data } = await postLeaveGroupChat(groupChatId)
    return data
  }
}

export const groupChatService = new GroupChatService()
