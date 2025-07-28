import type { TGlobalSearchData } from "@/utils/types/be-api"
import type { TConversationSearchResult } from "@/utils/types/global"
import { searchGlobally, searchConversations as searchConversationsAPI } from "@/apis/search"

class SearchService {
  async searchGlobally(
    keyword: string,
    isFirstSearch: boolean,
    searchLimit: number,
    messageOffsetId?: number,
    messageOffsetCreatedAt?: string,
    userOffsetId?: number,
    userOffsetFullName?: string,
    userOffsetEmail?: string
  ): Promise<TGlobalSearchData> {
    const { data } = await searchGlobally(
      keyword,
      isFirstSearch,
      searchLimit,
      messageOffsetId,
      messageOffsetCreatedAt,
      userOffsetId,
      userOffsetFullName,
      userOffsetEmail
    )
    return data
  }
}

export const searchService = new SearchService()

export const searchConversations = async (
  keyword: string
): Promise<TConversationSearchResult[]> => {
  try {
    const response = await searchConversationsAPI(keyword)
    return response
  } catch (error) {
    console.error("Error in searchConversations service:", error)
    throw error
  }
}
