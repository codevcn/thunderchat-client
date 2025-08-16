"use client"

import { EChatType } from "@/utils/enums"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import {
  createPathWithParams,
  getPathWithQueryString,
  pureNavigator,
  randomInRange,
} from "@/utils/helpers"
import { localStorageManager } from "@/utils/local-storage"
import type { TDirectChatData, TUserWithProfile } from "@/utils/types/be-api"
import { useRouter } from "next/navigation"

export const useAuthRedirect = () => {
  return () => {
    const redirect = new URLSearchParams(window.location.search).get("redirect") || "/conversations"
    pureNavigator(redirect)
  }
}

export const useRedirectToLogin = () => {
  const router = useRouter()
  return () => {
    const redirect = `/?redirect=${getPathWithQueryString()}`
    router.push(redirect)
  }
}

export const useSamePathNavigator = () => {
  const router = useRouter()
  return (path: string) => {
    const currentFullPath = location.pathname + location.search
    if (currentFullPath === path) {
      eventEmitter.emit(EInternalEvents.SAME_PATH_NAVIGATION)
    } else {
      router.push(path)
    }
  }
}

export const useNavToConversation = () => {
  const router = useRouter()
  return (conversationId: number, type: EChatType, isTemp?: boolean, messageId?: number) => {
    router.push(
      createPathWithParams("/conversations", {
        [isTemp ? "tid" : type === EChatType.DIRECT ? "cid" : "gid"]: conversationId.toString(),
        ...(messageId ? { mid: `${messageId}` } : {}),
      })
    )
  }
}

export const useNavToTempDirectChat = () => {
  const router = useRouter()
  return (user: TUserWithProfile, otherUser: TUserWithProfile) => {
    const otherUserId = otherUser.id
    const userId = user.id
    const tempChatData: TDirectChatData = {
      id: -1,
      createdAt: new Date().toISOString(),
      creatorId: userId,
      recipientId: otherUserId,
      Creator: {
        id: userId,
        email: user.email,
        password: user.password,
        createdAt: user.createdAt,
        Profile: user.Profile,
        role: user.role,
      },
      Recipient: {
        id: otherUserId,
        email: otherUser.email,
        password: otherUser.password,
        createdAt: otherUser.createdAt,
        Profile: otherUser.Profile,
        role: otherUser.role,
      },
    }
    const tempId = randomInRange(1, 100000)
    localStorageManager.setLastDirectChatData({
      chatData: tempChatData,
      tempId,
    })
    router.push(
      createPathWithParams("/conversations", {
        tid: tempId.toString(),
      })
    )
  }
}
