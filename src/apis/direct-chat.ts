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
