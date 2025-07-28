import type { TFetchDirectChatsData, TFetchGroupChatsData, TUserWithProfile } from "../types/be-api"
import type { TConversationCard } from "../types/global"
import { EChatType, EMessageTypes } from "../enums"

export const convertToDirectChatsUIData = (
  data: TFetchDirectChatsData[],
  user: TUserWithProfile
): TConversationCard[] => {
  return data.map((item) => {
    const creator = item.Creator
    const creatorProfile = creator.Profile
    const lastMessage = item.LastSentMessage
    const otherUser = creator.id === user.id ? item.Recipient : creator
    return {
      id: item.id,
      avatar: {
        src: creatorProfile?.avatar,
        fallback: creator.email[0],
      },
      lastMessageTime: lastMessage?.createdAt,
      pinIndex: 0,
      subtitle: {
        content: lastMessage?.content || "You created this chat",
        type: lastMessage?.type || EMessageTypes.TEXT,
      },
      title: creator.id === user.id ? item.Recipient.Profile.fullName : creatorProfile.fullName,
      type: EChatType.DIRECT,
      createdAt: item.createdAt,
      email: otherUser.email,
    }
  })
}

export const convertToGroupChatsUIData = (data: TFetchGroupChatsData[]): TConversationCard[] => {
  return data.map((item) => {
    const lastMessage = item.LastSentMessage
    return {
      id: item.id,
      avatar: {
        src: item.avatarUrl,
        fallback: item.name[0],
      },
      lastMessageTime: lastMessage?.createdAt,
      pinIndex: 0,
      subtitle: {
        content: lastMessage?.content || "You created this chat",
        type: lastMessage?.type || EMessageTypes.TEXT,
      },
      title: item.name,
      type: EChatType.GROUP,
      createdAt: item.createdAt,
    }
  })
}
