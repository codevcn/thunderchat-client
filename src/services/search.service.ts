import type {
  TGlobalSearchData,
  TMessageSearchOffset,
  TUserSearchOffset,
} from "@/utils/types/be-api"
import type { TConversationSearchResult } from "@/utils/types/global"
import { searchGlobally, searchConversations as searchConversationsAPI } from "@/apis/search"

class SearchService {
  async searchGlobally(
    keyword: string,
    searchLimit: number,
    messageSearchOffset?: TMessageSearchOffset,
    userSearchOffset?: TUserSearchOffset
  ): Promise<TGlobalSearchData> {
    const { data } = await searchGlobally(
      keyword,
      searchLimit,
      messageSearchOffset,
      userSearchOffset
    )
    console.log(">>> data 22:", data)
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
