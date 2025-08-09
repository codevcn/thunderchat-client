import {
  pinMessage,
  getPinnedMessages,
  getPinnedCount,
  isMessagePinned,
  type TPinnedMessage,
  type TPinMessageResponse,
  type TUnpinMessageResponse,
  // Direct chat pin APIs
  pinDirectChat,
  getPinnedDirectChats,
  getPinnedDirectChatsCount,
  isDirectChatPinned,
  getPinnedDirectChatDetail,
  type TPinDirectChatResponse,
  type TUnpinDirectChatResponse,
  type TPinnedDirectChat,
  getPinnedChatsByUser,
  postTogglePinConversation,
} from "@/apis/pin"
import { EAppRole, EMessageTypes } from "@/utils/enums"
import { EMessageStatus } from "@/utils/socket/enums"
import type { TPinnedChat } from "@/utils/types/be-api"
import type { TStateMessage } from "@/utils/types/global"

class PinService {
  // Ghim hoặc bỏ ghim tin nhắn
  async togglePinMessage(
    messageId: number,
    directChatId: number | undefined,
    isPinned: boolean,
    groupChatId?: number
  ): Promise<TPinMessageResponse | TUnpinMessageResponse> {
    const response = await pinMessage({ messageId, directChatId, isPinned, groupChatId })
    return response.data
  }

  // Lấy danh sách tin nhắn đã ghim
  async getPinnedMessages(directChatId?: number, groupChatId?: number): Promise<TStateMessage[]> {
    const response = await getPinnedMessages(directChatId, groupChatId)
    return response.data.map(this.convertPinnedMessageToStateMessage)
  }

  // Lấy số lượng tin nhắn đã ghim
  async getPinnedCount(directChatId?: number, groupChatId?: number): Promise<number> {
    const response = await getPinnedCount(directChatId, groupChatId)
    return response.data
  }

  // Kiểm tra tin nhắn đã được ghim chưa
  async isMessagePinned(
    messageId: number,
    directChatId?: number,
    groupChatId?: number
  ): Promise<boolean> {
    const response = await isMessagePinned(messageId, directChatId, groupChatId)
    return response.data
  }

  // Direct Chat Pin Methods
  async togglePinDirectChat(
    directChatId: number,
    isPinned: boolean
  ): Promise<TPinDirectChatResponse | TUnpinDirectChatResponse> {
    const response = await pinDirectChat({ directChatId, isPinned })
    return response.data
  }

  async getPinnedDirectChats(): Promise<TPinnedDirectChat[]> {
    const response = await getPinnedDirectChats()
    return response.data
  }

  async getPinnedDirectChatsCount(): Promise<number> {
    const response = await getPinnedDirectChatsCount()
    return response.data
  }

  async isDirectChatPinned(directChatId: number): Promise<boolean> {
    const response = await isDirectChatPinned(directChatId)
    return response.data
  }

  async getPinnedDirectChatDetail(directChatId: number): Promise<TPinnedDirectChat> {
    const response = await getPinnedDirectChatDetail(directChatId)
    return response.data
  }

  // Helper function để chuyển đổi TPinnedMessage sang TStateMessage
  private convertPinnedMessageToStateMessage(pinnedMessage: TPinnedMessage): TStateMessage {
    const message = pinnedMessage.Message
    const { Media, Sticker, ReplyTo } = message
    return {
      id: message.id,
      content: message.content,
      authorId: message.authorId,
      directChatId: message.directChatId,
      status: message.status as EMessageStatus,
      type: message.type as EMessageTypes,
      createdAt: message.createdAt,
      Author: {
        ...message.Author,
        password: "", // Add missing password field
        role: message.Author.role as EAppRole, // Cast to EAppRole
      },
      ReplyTo: ReplyTo
        ? {
            id: ReplyTo.id,
            content: ReplyTo.content,
            authorId: ReplyTo.authorId,
            directChatId: message.directChatId,
            status: EMessageStatus.SEEN,
            type: EMessageTypes.TEXT,
            createdAt: message.createdAt,
            Author: {
              ...ReplyTo.Author,
              password: "", // Add missing password field
              role: ReplyTo.Author.role as EAppRole, // Cast to EAppRole
              createdAt: new Date().toISOString(),
              Profile: {
                ...ReplyTo.Author.Profile,
                about: ReplyTo.Author.Profile.about || undefined,
                avatar: ReplyTo.Author.Profile.avatar || undefined,
              },
            },
            isDeleted: false,
            isViolated: false,
          }
        : null,
      isNewMsg: false,
      isDeleted: message.isDeleted,
      Media,
      Sticker,
      isViolated: message.isViolated,
    }
  }

  async getPinnedChatsByUser(): Promise<TPinnedChat[]> {
    const { data } = await getPinnedChatsByUser()
    return data
  }

  async togglePinConversation(directChatId?: number, groupChatId?: number): Promise<TPinnedChat> {
    const { data } = await postTogglePinConversation(directChatId, groupChatId)
    return data
  }
}

export const pinService = new PinService()
