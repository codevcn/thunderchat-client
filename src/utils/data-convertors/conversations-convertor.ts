import type { TFetchDirectChatsData } from "../types/be-api"
import type { TConversationCard } from "../types/global"

export const convertToDirectChatsUIData = (data: TFetchDirectChatsData[]): TConversationCard[] => {
   return data.map((item) => {
      const creator = item.Creator
      const creatorProfile = creator.Profile
      return {
         id: item.id,
         avatar: {
            src: creatorProfile?.avatar,
            fallback: creator.email[0],
         },
         lastMessageTime: item.LastSentMessage?.createdAt,
         pinIndex: 0,
         subtitle: item.LastSentMessage.content,
         title: creatorProfile?.fullName || creator.email,
         type: item.LastSentMessage.type,
      }
   })
}
