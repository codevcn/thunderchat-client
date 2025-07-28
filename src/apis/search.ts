import { clientAxios, requestConfig } from "@/configs/axios"
import type { TGlobalSearchData } from "@/utils/types/be-api"
import type { TConversationSearchResult } from "@/utils/types/global"

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
