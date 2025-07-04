import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { HttpStatusCode } from "axios"
import type { TGetEmojisRes, TGetEmojisErrRes } from "@/utils/types/fe-api"
import type { TEmoji } from "@/utils/types/global"

const publicDir = path.join(process.cwd(), "public")

type TEmojiDirs = "food-drink" | "activity" | "travel-places" | "smiley-people"

const getEmojiFiles = async (dirname: TEmojiDirs): Promise<TEmoji[]> => {
   const dirPath = path.join(publicDir, "emojis", dirname)
   const files = await fs.readdir(dirPath)
   return files.map((file) => ({
      name: file,
      src: `/emojis/${dirname}/${file}`,
   }))
}

export async function GET(): Promise<NextResponse<TGetEmojisRes> | NextResponse<TGetEmojisErrRes>> {
   try {
      const foodDrinkEmojis = await getEmojiFiles("food-drink")
      const activityEmojis = await getEmojiFiles("activity")
      const travelPlacesEmojis = await getEmojiFiles("travel-places")
      const smileyPeopleEmojis = await getEmojiFiles("smiley-people")

      return NextResponse.json<TGetEmojisRes>({
         foodDrink: foodDrinkEmojis,
         activity: activityEmojis,
         travelPlaces: travelPlacesEmojis,
         smileyPeople: smileyPeopleEmojis,
      })
   } catch (error) {
      return NextResponse.json<TGetEmojisErrRes>(
         { error: "Failed to load emojis" },
         { status: HttpStatusCode.InternalServerError }
      )
   }
}
