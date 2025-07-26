import type { TGlobalSearchData } from "@/utils/types/be-api"
import { searchGlobally } from "@/apis/search"

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
