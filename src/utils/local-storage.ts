import { ELocalStorageKeys } from "./enums"
import { TDirectChatData } from "./types/be-api"
import type { TLastPageAccessed } from "./types/global"

class LocalStorageManager {
  setLastPageAccessed(url: string): void {
    const currentPageAccessed = this.getCurrentPageAccessed()
    if (currentPageAccessed === url) return // No need to update because accessing the same page again
    localStorage.setItem(
      ELocalStorageKeys.LAST_PAGE_ACCESSED,
      JSON.stringify({ current: url, previous: currentPageAccessed || "/" })
    )
  }

  getCurrentPageAccessed(): string | null {
    const lastPageAccessed = localStorage.getItem(ELocalStorageKeys.LAST_PAGE_ACCESSED)
    return lastPageAccessed ? (JSON.parse(lastPageAccessed) as TLastPageAccessed).current : null
  }

  getPrePageAccessed(): string | null {
    const lastPageAccessed = localStorage.getItem(ELocalStorageKeys.LAST_PAGE_ACCESSED)
    return lastPageAccessed ? (JSON.parse(lastPageAccessed) as TLastPageAccessed).previous : null
  }

  setLastDirectChatId(id: string): void {
    localStorage.setItem(ELocalStorageKeys.THE_LAST_DIRECT_CHAT_ID, id)
  }

  getLastDirectChatId(): string | null {
    return localStorage.getItem(ELocalStorageKeys.THE_LAST_DIRECT_CHAT_ID)
  }

  setLastDirectChatData(data: TDirectChatData): void {
    localStorage.setItem(ELocalStorageKeys.LAST_DIRECT_CHAT_DATA, JSON.stringify(data))
  }

  getLastDirectChatData(): TDirectChatData | null {
    const data = localStorage.getItem(ELocalStorageKeys.LAST_DIRECT_CHAT_DATA)
    return data ? (JSON.parse(data) as TDirectChatData) : null
  }
}

export const localStorageManager = new LocalStorageManager()
