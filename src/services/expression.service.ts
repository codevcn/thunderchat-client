import {
   getGetAllStickerCategories,
   getFetchStickers,
   getFetchEmojis,
   getGetGreetingSticker,
} from "@/apis/expression"
import type { TStickerCategory, TSticker } from "@/utils/types/be-api"
import type { TGetEmojisRes } from "@/utils/types/fe-api"

class ExpressionService {
   async fetchStickers(categoryId: TStickerCategory["id"]): Promise<TSticker[]> {
      const { data } = await getFetchStickers(categoryId)
      return data
   }

   async fetchAllStickerCategories(): Promise<TStickerCategory[]> {
      const { data } = await getGetAllStickerCategories()
      return data
   }

   async fetchEmojis(): Promise<TGetEmojisRes> {
      const { data } = await getFetchEmojis()
      return {
         activity: data.activity,
         foodDrink: data.foodDrink,
         smileyPeople: data.smileyPeople,
         travelPlaces: data.travelPlaces,
      }
   }

   async fetchGreetingSticker(): Promise<TSticker | null> {
      const { data } = await getGetGreetingSticker()
      return data
   }
}

export const expressionService = new ExpressionService()
