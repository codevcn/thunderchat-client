import { clientAxios, requestConfig } from "@/configs/axios"
import type { TSuccess } from "@/utils/types/global"
import type {
  TFetchGroupChatsData,
  TGroupChat,
  TGroupChatData,
  TUpdateGroupChatParams,
  TUploadGroupAvatarData,
} from "@/utils/types/be-api"

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

export const getFetchGroupChat = (groupChatId: number) =>
  clientAxios.get<TGroupChatData>("/group-chat/fetch-group-chat", {
    ...requestConfig,
    params: { groupChatId },
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
