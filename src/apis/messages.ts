import { clientAxios, requestConfig } from "@/configs/axios"
import type {
  TGetDirectMessagesData,
  TGetDirectMsgsParams,
  TGetGroupMessagesData,
  TGetGroupMsgsParams,
} from "../utils/types/be-api"

export const getFetchDirectMessages = (params: TGetDirectMsgsParams) =>
  clientAxios.get<TGetDirectMessagesData>("message/get-direct-messages/", {
    ...requestConfig,
    params,
  })

export const getFetchGroupMessages = (params: TGetGroupMsgsParams) =>
  clientAxios.get<TGetGroupMessagesData>("message/get-group-messages/", {
    ...requestConfig,
    params,
  })
