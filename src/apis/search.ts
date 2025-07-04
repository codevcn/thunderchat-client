import { clientAxios, requestConfig } from "@/configs/axios"
import type { TGlobalSearchData } from "@/utils/types/be-api"

export const searchGlobally = async (keyword: string) =>
   await clientAxios.get<TGlobalSearchData>("/search/global-search", {
      ...requestConfig,
      params: {
         keyword,
      },
   })
