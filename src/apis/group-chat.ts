import { clientAxios, requestConfig } from "@/configs/axios"
import type { TSuccess } from "@/utils/types/global"
import type { TFetchGroupChatData, TUploadGroupAvatarData } from "@/utils/types/be-api"

export const postUploadGroupAvatar = (data: FormData) =>
  clientAxios.post<TUploadGroupAvatarData>("/group-chat/upload-group-avatar", data, requestConfig)

export const deleteDeleteGroupAvatar = (avatarUrl: string) =>
  clientAxios.delete<TSuccess>("/group-chat/delete-group-avatar", {
    ...requestConfig,
    params: { avatarUrl },
  })

export const postCreateGroup = (groupName: string, memberIds: number[], avatarUrl?: string) =>
  clientAxios.post<TSuccess>(
    "/group-chat/create-group",
    { groupName, memberIds, avatarUrl },
    requestConfig
  )

export const getFetchGroupChat = (groupChatId: number) =>
  clientAxios.get<TFetchGroupChatData>("/group-chat/fetch-group-chat", {
    ...requestConfig,
    params: { groupChatId },
  })
