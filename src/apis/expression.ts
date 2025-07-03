import { clientAxios, clientSideAxios, requestConfig } from "@/configs/axios"
import type { TSticker, TStickerCategory } from "../utils/types/be-api"
import type { TGetEmojisRes } from "@/utils/types/fe-api"

export const getFetchStickers = (categoryId: number) =>
   clientAxios.get<TSticker[]>("/sticker/get-stickers", {
      ...requestConfig,
      params: {
         categoryId,
      },
   })

export const getGetAllStickerCategories = () =>
   clientAxios.get<TStickerCategory[]>("/sticker/get-all-categories", requestConfig)

export const getFetchEmojis = () =>
   clientSideAxios.get<TGetEmojisRes>("/api/emojis", {
      ...requestConfig,
      headers: {
         "Cache-Control": "no-store",
      },
   })

export const getGetGreetingSticker = () =>
   clientAxios.get<TSticker | null>("/sticker/get-greeting-sticker", requestConfig)
