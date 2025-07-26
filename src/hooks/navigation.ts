"use client"

import { EChatType } from "@/utils/enums"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { createPathWithParams, getPathWithQueryString, pureNavigator } from "@/utils/helpers"
import { useRouter } from "next/navigation"

export const useAuthRedirect = () => {
  return () => {
    const redirect = new URLSearchParams(window.location.search).get("redirect") || "/account"
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
  return (id: number, type: EChatType, isTemp?: boolean) => {
    router.push(
      createPathWithParams("/conversations", {
        [isTemp ? "tid" : type === EChatType.DIRECT ? "cid" : "gid"]: id.toString(),
      })
    )
  }
}
