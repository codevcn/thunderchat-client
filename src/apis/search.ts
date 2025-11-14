import { clientAxios, requestConfig } from "@/configs/axios"
import type {
  TGlobalSearchData,
  TMessageSearchOffset,
  TSmartSearchPayload,
  TSmartSearchResponse,
  TUserSearchOffset,
} from "@/utils/types/be-api"
import type { TConversationSearchResult } from "@/utils/types/global"

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

export const searchConversations = async (
  keyword: string
): Promise<TConversationSearchResult[]> => {
  try {
    const response = await clientAxios.post(
      "/search/conversations",
      {
        keyword,
      },
      { ...requestConfig }
    )
    return response.data
  } catch (error) {
    console.error("Error searching conversations:", error)
    throw error
  }
}

export const postSmartSearch = (data: TSmartSearchPayload) =>
  clientAxios.post<TSmartSearchResponse>("smart-search/search", data, requestConfig)
