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
} from "@/apis/pin"
import type { TStateDirectMessage } from "@/utils/types/global"

class PinService {
  // Ghim hoặc bỏ ghim tin nhắn
  async togglePinMessage(
    messageId: number,
    directChatId: number,
    isPinned: boolean
  ): Promise<TPinMessageResponse | TUnpinMessageResponse> {
    const response = await pinMessage({ messageId, directChatId, isPinned })
    return response.data
  }

  // Lấy danh sách tin nhắn đã ghim
  async getPinnedMessages(directChatId: number): Promise<TStateDirectMessage[]> {
    const response = await getPinnedMessages(directChatId)
    return response.data.map(this.convertPinnedMessageToStateMessage)
  }

  // Lấy số lượng tin nhắn đã ghim
  async getPinnedCount(directChatId: number): Promise<number> {
    const response = await getPinnedCount(directChatId)
    return response.data
  }

  // Kiểm tra tin nhắn đã được ghim chưa
  async isMessagePinned(messageId: number, directChatId: number): Promise<boolean> {
    const response = await isMessagePinned(messageId, directChatId)
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

  // Helper function để chuyển đổi TPinnedMessage sang TStateDirectMessage
  private convertPinnedMessageToStateMessage(pinnedMessage: TPinnedMessage): TStateDirectMessage {
    const directMessage = pinnedMessage.DirectMessage
    return {
      id: directMessage.id,
      content: directMessage.content,
      authorId: directMessage.authorId,
      directChatId: directMessage.directChatId,
      status: directMessage.status as any, // Cast to EMessageStatus
      type: directMessage.type as any, // Cast to EMessageTypes
      createdAt: directMessage.createdAt,
      // Giữ nguyên các trường media nếu có trong response
      stickerUrl: directMessage.stickerUrl,
      mediaUrl: directMessage.mediaUrl,
      fileName: directMessage.fileName,
      fileType: directMessage.fileType,
      fileSize: directMessage.fileSize,
      Author: {
        ...directMessage.Author,
        password: "", // Add missing password field
      },
      ReplyTo: directMessage.ReplyTo
        ? {
            id: directMessage.ReplyTo.id,
            content: directMessage.ReplyTo.content,
            authorId: directMessage.ReplyTo.authorId,
            directChatId: directMessage.directChatId,
            status: "SEEN" as any,
            type: "TEXT" as any,
            createdAt: directMessage.createdAt,
            Author: {
              ...directMessage.ReplyTo.Author,
              password: "", // Add missing password field
            },
          }
        : null,
      isNewMsg: false,
    } as TStateDirectMessage
  }
}

export const pinService = new PinService()
