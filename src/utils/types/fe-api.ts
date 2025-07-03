/**
 * This file contains the types for the FE API server (frontend api server)
 */
import type { TEmoji } from "@/utils/types/global"

export type TGetEmojisRes = {
   foodDrink: TEmoji[]
   activity: TEmoji[]
   travelPlaces: TEmoji[]
   smileyPeople: TEmoji[]
}

export type TGetEmojisErrRes = {
   error: string
}
