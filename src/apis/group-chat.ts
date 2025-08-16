import { clientAxios, requestConfig } from "@/configs/axios"
import type { TSuccess } from "@/utils/types/global"
import type {
  TFetchGroupChatsData,
  TGroupChat,
  TGroupChatData,
  // TJoinGroupChatByInviteLinkRes,
  TCreateInviteLinkRes,
  TUpdateGroupChatParams,
  TUploadGroupAvatarData,
  TFetchGroupChatPermissionsRes,
  TGroupChatPermissionState,
  TGroupJoinRequestWithUser,
  TGroupJoinRequest,
  TGroupChatWithCreator,
} from "@/utils/types/be-api"
import { EJoinRequestStatus } from "@/utils/enums"

export const postUploadGroupAvatar = (data: FormData) =>
  clientAxios.post<TUploadGroupAvatarData>("/group-chat/upload-group-avatar", data, requestConfig)

export const deleteDeleteGroupAvatar = (avatarUrl: string) =>
  clientAxios.delete<TSuccess>("/group-chat/delete-group-avatar", {
    ...requestConfig,
    params: { avatarUrl },
  })

export const postCreateGroupChat = (groupName: string, memberIds: number[], avatarUrl?: string) =>
  clientAxios.post<TGroupChat>(
    "/group-chat/create-group-chat",
    { groupName, memberIds, avatarUrl },
    requestConfig
  )

export const getFetchGroupChat = (groupChatId: number, signal?: AbortSignal) =>
  clientAxios.get<TGroupChatData>("/group-chat/fetch-group-chat", {
    ...requestConfig,
    params: { groupChatId },
    signal,
  })

export const getFetchGroupChats = (limit: number, lastId?: number) =>
  clientAxios.get<TFetchGroupChatsData[]>("/group-chat/fetch-group-chats", {
    ...requestConfig,
    params: { limit, lastId },
  })

export const putUpdateGroupChat = (groupChatId: number, updates: Partial<TUpdateGroupChatParams>) =>
  clientAxios.put<TSuccess>(
    "/group-chat/update-group-chat",
    { ...updates, groupChatId },
    requestConfig
  )

export const getGroupMessageContext = (messageId: number) => {
  const url = `/message/context/${messageId}`
  return clientAxios.get(url, requestConfig)
}

// API xoá/thu hồi tin nhắn direct chat
export const deleteGroupMessage = (messageId: number) =>
  clientAxios.patch(`/delete-message/${messageId}`, undefined, requestConfig)

// export const postRequestToJoinGroupChat = (inviteCode: string) =>
//   clientAxios.post<TJoinGroupChatByInviteLinkRes>(`/group-chat/request-to-join-group-chat`, {
//     ...requestConfig,
//     params: { inviteCode },
//   })

export const postCreateInviteLink = (groupChatId: number) =>
  clientAxios.post<TCreateInviteLinkRes>(
    `/group-chat/create-invite-link`,
    { groupChatId },
    requestConfig
  )

export const putUpdateGroupChatPermissions = (
  groupChatId: number,
  permissions: TGroupChatPermissionState
) =>
  clientAxios.put<TSuccess>(
    `/group-chat/update-permissions`,
    { groupChatId, permissions },
    requestConfig
  )

export const getFetchGroupChatPermissions = (groupChatId: number) =>
  clientAxios.get<TFetchGroupChatPermissionsRes>(`/group-chat/fetch-permissions`, {
    ...requestConfig,
    params: { groupChatId },
  })

export const getFetchGroupJoiningRequests = (groupChatId: number, status?: EJoinRequestStatus) =>
  clientAxios.get<TGroupJoinRequestWithUser[]>(`/group-chat/fetch-join-requests`, {
    ...requestConfig,
    params: { groupChatId, status },
  })

export const putProcessGroupJoinRequest = (
  joinRequestId: number,
  status: EJoinRequestStatus,
  groupChatId: number
) =>
  clientAxios.put<TGroupJoinRequestWithUser>(
    `/group-chat/process-join-request`,
    {
      joinRequestId,
      status,
      groupChatId,
    },
    requestConfig
  )

export const postCreateGroupJoinRequest = (groupChatId: number) =>
  clientAxios.post<TGroupJoinRequest>(
    `/group-chat/create-join-request`,
    { groupChatId },
    requestConfig
  )

export const getFetchGroupChatByInviteCode = (inviteCode: string) =>
  clientAxios.get<TGroupChatWithCreator | null>(`/group-chat/fetch-group-chat-by-invite-code`, {
    ...requestConfig,
    params: { inviteCode },
  })

export const deleteDeleteGroupChat = (groupChatId: number) =>
  clientAxios.delete<TSuccess>(`/group-chat/delete-group-chat`, {
    ...requestConfig,
    params: { groupChatId },
  })
