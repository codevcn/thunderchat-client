import { clientAxios, requestConfig } from "@/configs/axios"
import type { TFetchDirectChatsData } from "../utils/types/be-api"

export const getFetchDirectChat = (id: number) =>
  clientAxios.get<TFetchDirectChatsData>("/direct-chat/fetch/" + id, requestConfig)

export const getFetchDirectChats = (limit: number, lastId?: number) =>
  clientAxios.get<TFetchDirectChatsData[]>("/direct-chat/fetch-direct-chats", {
    ...requestConfig,
    params: {
      lastId,
      limit,
    },
  })

export const getDirectMessageContext = (messageId: number) => {
  const url = `/message/context/${messageId}`
  console.log("[DEBUG] Gọi API context:", url)
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
