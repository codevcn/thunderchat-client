import { clientAxios, requestConfig } from "@/configs/axios"
import type { TGetDirectMessagesData, TGetDirectMsgsParams } from "../utils/types/be-api"

export const getFetchDirectMessages = (params: TGetDirectMsgsParams) =>
   clientAxios.get<TGetDirectMessagesData>("message/get-direct-messages/", {
      ...requestConfig,
      params,
   })
