import { clientAxios, requestConfig } from "@/configs/axios"
import type {
  TGlobalSearchData,
  TMessageSearchOffset,
  TUserSearchOffset,
} from "@/utils/types/be-api"

export const searchGlobally = async (
  keyword: string,
  limit: number,
  messageSearchOffset?: TMessageSearchOffset,
  userSearchOffset?: TUserSearchOffset
) =>
  await clientAxios.post<TGlobalSearchData>(
    "/search/global-search",
    {
      keyword,
      limit,
      messageSearchOffset,
      userSearchOffset,
    },
    { ...requestConfig }
  )
