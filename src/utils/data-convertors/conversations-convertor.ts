import type {
  TFetchDirectChatsData,
  TFetchGroupChatsData,
  TUser,
  TUserWithProfile,
} from "../types/be-api"
import type { TConversationCard } from "../types/global"
import { EChatType, EMessageTypes } from "../enums"

export const convertToDirectChatsUIData = (
  data: TFetchDirectChatsData[],
  user: TUserWithProfile
): TConversationCard[] => {
  return data.map((item) => {
    const creator = item.Creator
    const recipient = item.Recipient
    const recipientProfile = recipient.Profile
    const creatorProfile = creator.Profile
    const lastMessage = item.LastSentMessage
    const otherUser = creator.id === user.id ? item.Recipient : creator
    return {
      id: item.id,
      avatar: {
        src: user.id === creator.id ? recipientProfile?.avatar : creatorProfile?.avatar,
        fallback:
          user.id === creator.id ? recipientProfile.fullName[0] : creatorProfile.fullName[0],
      },
      lastMessageTime: lastMessage?.createdAt,
      pinIndex: 0,
      subtitle: {
        content:
          lastMessage?.content ||
          (creator.id === user.id
            ? "You created this chat"
            : `This chat created by ${creatorProfile.fullName}`),
        type: lastMessage?.type || EMessageTypes.TEXT,
      },
      title: creator.id === user.id ? recipientProfile.fullName : creatorProfile.fullName,
      type: EChatType.DIRECT,
      createdAt: item.createdAt,
      unreadMessageCount: item.unreadMessageCount || 0,
      email: otherUser.email,
    }
  })
}

export const convertToGroupChatsUIData = (
  data: TFetchGroupChatsData[],
  user: TUser
): TConversationCard[] => {
  return data.map((item) => {
    const lastMessage = item.LastSentMessage
    const creator = item.Creator
    return {
      id: item.id,
      avatar: {
        src: item.avatarUrl,
        fallback: item.name[0],
      },
      lastMessageTime: lastMessage?.createdAt,
      pinIndex: 0,
      subtitle: {
        content:
          lastMessage?.content ||
          (creator.id === user.id
            ? "You created this chat"
            : `This chat created by ${creator.Profile.fullName}`),
        type: lastMessage?.type || EMessageTypes.TEXT,
      },
      title: item.name,
      type: EChatType.GROUP,
      createdAt: item.createdAt,
      unreadMessageCount: item.unreadMessageCount || 0,
    }
  })
}
