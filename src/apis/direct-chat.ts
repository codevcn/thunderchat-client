import { clientAxios, requestConfig } from "@/configs/axios"
import type { TDirectChat, TFetchDirectChatsData } from "../utils/types/be-api"

export const getFetchDirectChat = (id: number, signal?: AbortSignal) =>
  clientAxios.get<TFetchDirectChatsData>("/direct-chat/fetch/" + id, {
    ...requestConfig,
    signal,
  })

export const getFetchDirectChats = (limit: number, lastId?: number) =>
  clientAxios.get<TFetchDirectChatsData[]>("/direct-chat/fetch-direct-chats", {
    ...requestConfig,
    params: {
      lastId,
      limit,
    },
  })

export const getFindConversationWithOtherUser = (otherUserId: number) =>
  clientAxios.get<TDirectChat>(
    "/direct-chat/find-conversation-with-other-user/" + otherUserId,
    requestConfig
  )
export const getDirectMessageContext = (messageId: number) => {
  const url = `/message/context/${messageId}`
  return clientAxios.get(url, requestConfig)
}

export const getNewerDirectMessages = (directChatId: number, msgOffset: number, limit?: number) =>
  clientAxios.get(`/message/get-newer-messages`, {
    ...requestConfig,
    params: { directChatId, msgOffset, ...(limit ? { limit } : {}) },
  })

export const checkCanSendDirectMessage = (receiverId: number) =>
  clientAxios.get<{ canSend: boolean }>(`/message/can-send-message`, {
    ...requestConfig,
    params: { receiverId },
  })
// API xoá/thu hồi tin nhắn direct chat
export const deleteDirectMessage = (messageId: number) =>
  clientAxios.patch(`/delete-message/${messageId}`, undefined, requestConfig)
