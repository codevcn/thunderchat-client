import type { TGlobalSearchData } from "@/utils/types/be-api"
import { searchGlobally } from "@/apis/search"

class SearchService {
   async searchGlobally(keyword: string): Promise<TGlobalSearchData> {
      const { data } = await searchGlobally(keyword)
      return data
   }
}

export const searchService = new SearchService()
