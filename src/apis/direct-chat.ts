import { clientAxios, requestConfig } from "@/configs/axios"
import type { TDirectChatData } from "../utils/types/be-api"

export const getFetchDirectChat = (id: number) =>
   clientAxios.get<TDirectChatData>("/direct-chat/fetch/" + id, requestConfig)
