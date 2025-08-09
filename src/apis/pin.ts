import { clientAxios, requestConfig } from "@/configs/axios"
import { EAppRole } from "@/utils/enums"
import { TMessageMedia, TPinnedChat, TSticker } from "@/utils/types/be-api"

// Types for pin API responses
export type TPinMessageResponse = {
  id: number
  messageId: number
  directChatId: number
  groupChatId?: number
  pinnedBy: number
  pinnedAt: string
  DirectMessage: {
    id: number
    content: string
    authorId: number
    recipientId: number
    directChatId: number
    type: string
    status: string
    createdAt: string
    Author: {
      id: number
      email: string
      createdAt: string
      Profile: {
        id: number
        fullName: string
        birthday: string
        about: string
        avatar: string
        userId: number
        createdAt: string
      }
    }
  }
}

export type TUnpinMessageResponse = {
  success: boolean
  deletedCount: number
}

export type TPinnedMessage = {
  id: number
  messageId: number
  directChatId: number
  pinnedBy: number
  pinnedAt: string
  Message: {
    id: number
    content: string
    authorId: number
    recipientId: number
    directChatId: number
    type: string
    status: string
    createdAt: string
    replyToId: number | null
    isDeleted: boolean
    isViolated: boolean
    Author: {
      id: number
      email: string
      createdAt: string
      role: EAppRole
      Profile: {
        id: number
        fullName: string
        birthday: string
        about: string
        avatar: string
        userId: number
        createdAt: string
      }
    }
    ReplyTo?: {
      id: number
      content: string
      authorId: number
      Author: {
        id: number
        email: string
        role: EAppRole
        Profile: {
          id: number
          fullName: string
          birthday: string
          about: string | null
          avatar: string | null
          userId: number
          createdAt: string
        }
      }
    }
    Sticker: TSticker | null
    Media: TMessageMedia | null
  }
}

type TPinMessageParams = {
  messageId: number
  directChatId?: number
  groupChatId?: number
  isPinned: boolean
}

export const pinMessage = (body: TPinMessageParams) =>
  clientAxios.post<TPinMessageResponse | TUnpinMessageResponse>(
    "/pin/pin-message",
    body,
    requestConfig
  )

export const getPinnedMessages = (directChatId?: number, groupChatId?: number) =>
  clientAxios.get<TPinnedMessage[]>("/pin/pinned-messages", {
    ...requestConfig,
    params: { directChatId, groupChatId },
  })

export const getPinnedCount = (directChatId?: number, groupChatId?: number) =>
  clientAxios.get<number>("/pin/pinned-count", {
    ...requestConfig,
    params: { directChatId, groupChatId },
  })

export const isMessagePinned = (messageId: number, directChatId?: number, groupChatId?: number) =>
  clientAxios.get<boolean>("/pin/is-pinned", {
    ...requestConfig,
    params: { messageId, directChatId, groupChatId },
  })

// Direct Chat Pin APIs
export type TPinDirectChatResponse = {
  id: number
  directChatId: number
  pinnedBy: number
  pinnedAt: string
  DirectChat: {
    id: number
    creatorId: number
    recipientId: number
    createdAt: string
    Creator: {
      id: number
      email: string
      createdAt: string
      Profile: {
        id: number
        fullName: string
        birthday: string
        about: string
        avatar: string
        userId: number
        createdAt: string
      }
    }
    Recipient: {
      id: number
      email: string
      createdAt: string
      Profile: {
        id: number
        fullName: string
        birthday: string
        about: string
        avatar: string
        userId: number
        createdAt: string
      }
    }
  }
}

export type TUnpinDirectChatResponse = {
  success: boolean
  deletedCount: number
}

export type TPinnedDirectChat = {
  id: number
  directChatId: number
  pinnedBy: number
  pinnedAt: string
  DirectChat: {
    id: number
    creatorId: number
    recipientId: number
    createdAt: string
    Creator: {
      id: number
      email: string
      createdAt: string
      Profile: {
        id: number
        fullName: string
        birthday: string
        about: string
        avatar: string
        userId: number
        createdAt: string
      }
    }
    Recipient: {
      id: number
      email: string
      createdAt: string
      Profile: {
        id: number
        fullName: string
        birthday: string
        about: string
        avatar: string
        userId: number
        createdAt: string
      }
    }
  }
}

export const pinDirectChat = (body: { directChatId: number; isPinned: boolean }) =>
  clientAxios.post<TPinDirectChatResponse | TUnpinDirectChatResponse>(
    "/pin-direct-chat/pin",
    body,
    requestConfig
  )

export const getPinnedDirectChats = () =>
  clientAxios.get<TPinnedDirectChat[]>("/pin-direct-chat/pinned-chats", requestConfig)

export const getPinnedDirectChatsCount = () =>
  clientAxios.get<number>("/pin-direct-chat/pinned-count", requestConfig)

export const isDirectChatPinned = (directChatId: number) =>
  clientAxios.get<boolean>("/pin-direct-chat/is-pinned", {
    ...requestConfig,
    params: { directChatId },
  })

export const getPinnedDirectChatDetail = (directChatId: number) =>
  clientAxios.get<TPinnedDirectChat>("/pin-direct-chat/pinned-detail", {
    ...requestConfig,
    params: { directChatId },
  })

export const getPinnedChatsByUser = () =>
  clientAxios.get<TPinnedChat[]>("/pin-conversation/get-pinned-chats-by-user", {
    ...requestConfig,
  })

export const postTogglePinConversation = (directChatId?: number, groupChatId?: number) =>
  clientAxios.post<TPinnedChat>(
    "/pin-conversation/toggle-pin-conversation",
    { directChatId, groupChatId },
    { ...requestConfig }
  )
