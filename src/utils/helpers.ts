import dayjs from "dayjs"
import type { TEmoji, TFormData } from "./types/global"
import DOMPurify from "dompurify"
import type { TDeepPartial, THierarchyKeyObject } from "./types/utility-types"

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
 * Create a path with query parameters
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

export function extractEmojisFromMessage(message: string): TEmoji[] {
  // Tìm tất cả các thẻ <img> có class "STYLE-emoji-img"
  const imgTagRegex = /<img[^>]*class="STYLE-emoji-img"[^>]*>/g
  const emojiTags = message.match(imgTagRegex) || []

  // Hàm tách src và alt từ 1 thẻ img
  function parseEmojiTag(tag: string): TEmoji | null {
    const srcMatch = tag.match(/src="([^"]+)"/)
    const altMatch = tag.match(/alt="([^"]+)"/)
    if (!srcMatch || !altMatch) return null
    return {
      src: srcMatch[1],
      name: altMatch[1].replace(/\.webp$/i, ""),
    }
  }

  // Lặp qua từng thẻ img tìm được để tạo array emoji
  const emojis: TEmoji[] = []
  for (const tag of emojiTags) {
    const emoji = parseEmojiTag(tag)
    if (emoji) emojis.push(emoji)
  }

  return emojis
}

export function unescapeHtml(html: string): string {
  return html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
