import dayjs from "dayjs"
import type { TEmoji, TFormData, THighlightOffsets } from "./types/global"
import DOMPurify from "dompurify"
import type { TDeepPartial, THierarchyKeyObject } from "./types/utility-types"
import {
  EGroupChatPermissions,
  EGroupChatRole,
  EMessageMediaTypes,
  EMessageTypeAllTypes,
  EMessageTypes,
} from "./enums"
import type { TGroupChat, TGroupChatMember, TGroupChatPermissionState, TUser } from "./types/be-api"
import type { TMemberPermissionRenderingResult } from "./types/global"

export const setLastSeen = (date: string) => {
  return dayjs(date).format("MM/DD/YYYY, h:mm A")
}

export function isValueInEnum<T extends object>(value: string, enumObject: T): boolean {
  return Object.values(enumObject).includes(value)
}

export const getPathWithQueryString = (): string => {
  return window.location.pathname + window.location.search
}

export function extractFormData<T extends TFormData>(formEle: HTMLFormElement): T {
  const formData = new FormData(formEle)
  const data: any = {}

  for (const [key, value] of formData.entries()) {
    const currentValue = data[key]
    if (currentValue) {
      if (Array.isArray(currentValue)) {
        currentValue.push(value)
      } else {
        data[key] = [currentValue, value]
      }
    } else {
      data[key] = value
    }
  }

  return data
}

export const pureNavigator = (url: string) => {
  window.location.href = url
}

export const getCurrentLocationPath = (): string => {
  return window.location.pathname
}

export const santizeMsgContent = (htmlStr: string): string => {
  return DOMPurify.sanitize(htmlStr)
}

/**
 * Handle event delegation for dataset
 * @param e - React.MouseEvent<HTMLDivElement>
 * @param target - { datasetName: camelCase string, className?: string }
 * @returns dataset value or null if dataset not found
 */
export const handleEventDelegation = <R extends Record<string, any>>(
  e: React.MouseEvent<HTMLDivElement>,
  target: {
    datasetName: string
    className?: string
  }
): R | null => {
  const { datasetName, className } = target
  const element = e.target as HTMLElement
  let dataset = element.getAttribute(datasetName)
  if (dataset) {
    return JSON.parse(dataset)
  }
  const closest = element.closest<HTMLElement>(
    `${className ? `.${className}` : ""}[${datasetName}]`
  )
  if (closest) {
    const dataset = closest.getAttribute(datasetName)
    if (dataset) {
      return JSON.parse(dataset)
    }
  }
  return null
}

/**
 * Create a path with query parameters, e.g. "/conversations?tab=1"
 * @param path - The path to create the path with
 * @param params - The parameters to create the path with
 * @returns The path with the query parameters
 */
export const createPathWithParams = (path: string, params: Record<string, string>): string => {
  const queryParams = new URLSearchParams(params)
  return `${path}?${queryParams.toString()}`
}

export function updateObjectByPath<T extends Record<string, any>>(
  target: T,
  updates: TDeepPartial<THierarchyKeyObject<T>>
): void {
  for (const path in updates) {
    const value = updates[path as keyof THierarchyKeyObject<T>]
    if (value === undefined) continue
    if (path.includes(".")) {
      const keys = path.split(".")
      const keysLength = keys.length

      let current: any = target

      for (let i = 0; i < keysLength; i++) {
        const key = keys[i]
        // Nếu là key cuối cùng => cập nhật
        if (i === keysLength - 1) {
          current[key] = value
        } else {
          current = current[key]
        }
      }
    } else {
      let current: any = target
      current[path] = value
    }
  }
}

/**
 * Extract the offsets of the highlighted text
 * @param originalText - The original text
 * @param highlightedText - The highlighted text
 * @returns The offsets of the highlighted text
 */
export function extractHighlightOffsets(
  original: string,
  highlights: string[]
): THighlightOffsets[] {
  const offsets: THighlightOffsets[] = []
  const matched = new Set<number>() // để tránh duplicate nếu từ xuất hiện nhiều lần

  for (const highlighted of highlights) {
    const regex = /<em>(.*?)<\/em>/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(highlighted)) !== null) {
      const word = match[1]
      if (!word) continue

      // Tìm tất cả vị trí xuất hiện của từ trong original
      let searchStart = 0
      while (searchStart < original.length) {
        const index = original.indexOf(word, searchStart)
        if (index === -1) break

        if (!matched.has(index)) {
          offsets.push({
            start: index,
            end: index + word.length,
          })
          matched.add(index)
          break // nếu chỉ muốn lấy vị trí đầu tiên trong mỗi chuỗi highlight
        }

        searchStart = index + word.length
      }
    }
  }

  return offsets
}

export function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function unescapeHtml(html: string): string {
  return html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

export function extractEmojisFromMessage(message: string): TEmoji[] {
  // Decode HTML entities trước khi xử lý
  const decodedMessage = unescapeHtml(message)

  const imgTagRegex = /<img[^>]*class="STYLE-emoji-img"[^>]*>/g
  const emojiTags = decodedMessage.match(imgTagRegex) || []

  function parseEmojiTag(tag: string): TEmoji | null {
    const srcMatch = tag.match(/src="([^"]+)"/)
    const altMatch = tag.match(/alt="([^"]+)"/)

    if (!srcMatch || !altMatch) {
      return null
    }

    const emoji = {
      src: srcMatch[1],
      name: altMatch[1].replace(/\.webp$/i, ""),
    }

    return emoji
  }

  const emojis: TEmoji[] = []
  for (const tag of emojiTags) {
    const emoji = parseEmojiTag(tag)
    if (emoji) emojis.push(emoji)
  }

  return emojis
}

/**
 * Get the current path of the browser
 * @returns The current path of the browser, e.g. "/conversations"
 */
export const getCurrentPathOnBrowserURL = (): string => {
  return window.location.pathname
}

/**
 * Check if the current chat is a new conversation
 * @param currentChatId - The id of the current chat, maybe -1 if it is temp chat
 * @param myUserId - The id of the current user
 * @param memberIdsOfNewConversation - The ids of the members of the new conversation
 * @param newConversationId - The id of the new conversation
 * @returns True if the current chat is a new conversation, false otherwise
 */
export const checkNewConversationIsCurrentChat = (
  currentChatId: number,
  myUserId: number,
  memberIdsOfNewConversation: number[],
  newConversationId: number
) => {
  return (
    newConversationId === currentChatId ||
    (currentChatId === -1 && memberIdsOfNewConversation.includes(myUserId))
  )
}

export const converToMessageTypeAllTypes = (
  type: EMessageTypes,
  mediaType?: EMessageMediaTypes
): EMessageTypeAllTypes => {
  if (type === EMessageTypes.STICKER) {
    return EMessageTypeAllTypes.STICKER
  } else if (type === EMessageTypes.MEDIA) {
    if (mediaType === EMessageMediaTypes.IMAGE) {
      return EMessageTypeAllTypes.IMAGE
    } else if (mediaType === EMessageMediaTypes.VIDEO) {
      return EMessageTypeAllTypes.VIDEO
    } else if (mediaType === EMessageMediaTypes.AUDIO) {
      return EMessageTypeAllTypes.AUDIO
    }
    return EMessageTypeAllTypes.DOCUMENT
  } else if (type === EMessageTypes.PIN_NOTICE) {
    return EMessageTypeAllTypes.PIN_NOTICE
  } else {
    return EMessageTypeAllTypes.TEXT
  }
}

export const generateInviteUrl = (inviteCode: string) => {
  return `${process.env.NEXT_PUBLIC_SERVER_HOST_DEV}/conversations/group/invite/${inviteCode}`
}

export const checkIfGroupChatCreator = (userId: number, groupChat?: TGroupChat): boolean => {
  return groupChat?.creatorId === userId
}

export const checkGroupChatPermission = (
  groupChatPermissions: TGroupChatPermissionState | null,
  user: TUser,
  groupChatMembers: TGroupChatMember[],
  permissionToCheck: EGroupChatPermissions
): TMemberPermissionRenderingResult => {
  let result: TMemberPermissionRenderingResult = {
    hasPermission: false,
    message: "",
  }
  if (groupChatMembers.find(({ userId }) => userId === user.id)?.role === EGroupChatRole.ADMIN) {
    result.hasPermission = true
  }
  switch (permissionToCheck) {
    case EGroupChatPermissions.SHARE_INVITE_CODE:
      if (groupChatPermissions && groupChatPermissions.shareInviteCode) {
        result.hasPermission = true
      }
      break
    case EGroupChatPermissions.SEND_MESSAGE:
      if (groupChatPermissions && groupChatPermissions.sendMessage) {
        result.hasPermission = true
      }
      break
    case EGroupChatPermissions.PIN_MESSAGE:
      if (groupChatPermissions && groupChatPermissions.pinMessage) {
        result.hasPermission = true
      }
      break
    case EGroupChatPermissions.UPDATE_INFO:
      if (groupChatPermissions && groupChatPermissions.updateInfo) {
        result.hasPermission = true
      }
      break
  }
  return result
}

export const highlightUrlsInText = (text: string): string => {
  // Regex để phát hiện URL (http, https, www, hoặc domain đơn giản)
  const urlRegex = /(https?:\/\/[^\s<>]+|www\.[^\s<>]+|[^\s<>]+\.[^\s<>]+)/gi

  // Kiểm tra xem text có chứa emoji HTML không
  const hasEmojiHtml = /<link[^>]*rel="preload"[^>]*>|<img[^>]*>/i.test(text)

  if (hasEmojiHtml) {
    // Nếu có emoji HTML, chỉ highlight URL ở những phần text thuần túy
    // Tách text thành các phần HTML và text thuần túy
    const parts = text.split(/(<[^>]+>)/)

    return parts
      .map((part) => {
        if (part.startsWith("<") && part.endsWith(">")) {
          // Đây là HTML tag, giữ nguyên
          return part
        } else {
          // Đây là text thuần túy, highlight URL
          return part.replace(urlRegex, (url) => {
            // Thêm protocol nếu cần
            const fullUrl = url.startsWith("http") ? url : `https://${url}`
            return `<span class="text-white cursor-pointer underline hover:no-underline" onclick="window.open('${fullUrl}', '_blank')">${url}</span>`
          })
        }
      })
      .join("")
  } else {
    // Không có emoji HTML, highlight tất cả URL
    return text.replace(urlRegex, (url) => {
      const fullUrl = url.startsWith("http") ? url : `https://${url}`
      return `<span class="text-white cursor-pointer underline hover:no-underline" onclick="window.open('${fullUrl}', '_blank')">${url}</span>`
    })
  }
}

export const processPinNoticeContent = (text: string): string => {
  // Chỉ sanitize HTML, không highlight URL
  return santizeMsgContent(text)
}
