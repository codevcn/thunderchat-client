import { clientAxios, requestConfig } from "@/configs/axios"
import type { TGlobalSearchData } from "@/utils/types/be-api"

export const searchGlobally = async (
  keyword: string,
  isFirstSearch: boolean,
  limit: number,
  messageOffsetId?: number,
  messageOffsetCreatedAt?: string,
  userOffsetId?: number,
  userOffsetFullName?: string,
  userOffsetEmail?: string
) =>
  await clientAxios.post<TGlobalSearchData>(
    "/search/global-search",
    {
      keyword,
      limit,
      messageOffsetId,
      messageOffsetCreatedAt,
      userOffsetId,
      userOffsetFullName,
      userOffsetEmail,
      isFirstSearch,
    },
    { ...requestConfig }
  )
