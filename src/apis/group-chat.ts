import { clientAxios, requestConfig } from "@/configs/axios"
import type { TGroupChat, TFetchGroupChatsData } from "../utils/types/be-api"

export const getFetchGroupChat = (id: number, signal?: AbortSignal) =>
  clientAxios.get<TFetchGroupChatsData>("/group-chat/fetch/" + id, {
    ...requestConfig,
    signal,
  })

export const getFetchGroupChats = (limit: number, lastId?: number) =>
  clientAxios.get<TFetchGroupChatsData[]>("/group-chat/fetch-group-chats", {
    ...requestConfig,
    params: {
      lastId,
      limit,
    },
  })

export const getFindConversationWithOtherUser = (otherUserId: number) =>
  clientAxios.get<TGroupChat>(
    "/group-chat/find-conversation-with-other-user/" + otherUserId,
    requestConfig
  )
export const getGroupMessageContext = (messageId: number) => {
  const url = `/message/context/${messageId}`
  return clientAxios.get(url, requestConfig)
}

export const getNewerGroupMessages = (groupChatId: number, msgOffset: number, limit?: number) =>
  clientAxios.get(`/message/get-newer-messages`, {
    ...requestConfig,
    params: { groupChatId, msgOffset, ...(limit ? { limit } : {}) },
  })

export const checkCanSendGroupMessage = (receiverId: number) =>
  clientAxios.get<{ canSend: boolean }>(`/message/can-send-message`, {
    ...requestConfig,
    params: { receiverId },
  })
// API xoá/thu hồi tin nhắn group chat
export const deleteGroupMessage = (messageId: number) =>
  clientAxios.patch(`/delete-message/${messageId}`, undefined, requestConfig)
