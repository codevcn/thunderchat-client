import type {
  TGlobalSearchData,
  TMessageSearchOffset,
  TUserSearchOffset,
} from "@/utils/types/be-api"
import { searchGlobally } from "@/apis/search"

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
    return data
  }
}

export const searchService = new SearchService()
