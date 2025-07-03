import { ELocalStorageKeys } from "./enums"
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
}

export const localStorageManager = new LocalStorageManager()
