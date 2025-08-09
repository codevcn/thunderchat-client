import { pinService } from "@/services/pin.service"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { EChatType } from "@/utils/enums"
import { toaster } from "@/utils/toaster"
import type { TPinnedChat } from "@/utils/types/be-api"
import type { TUsePinChats } from "@/utils/types/global"
import { useState } from "react"

export const usePinChats = (): TUsePinChats => {
  const [pinChats, setPinChats] = useState<TPinnedChat[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const fetchPinChatsByUserId = async () => {
    setLoading(true)
    try {
      const pinChats = await pinService.getPinnedChatsByUser()
      console.log(">>> pinChats:", pinChats)
      setPinChats(pinChats)
    } catch (error) {
      toaster.error(axiosErrorHandler.handleHttpError(error).message)
    } finally {
      setLoading(false)
    }
  }

  const isChatPinned = (chatId: number, chatType: EChatType) => {
    return pinChats.some((pinChat) => {
      if (chatType === EChatType.DIRECT) {
        return pinChat.directChatId === chatId
      } else {
        return pinChat.groupChatId === chatId
      }
    })
  }

  const getPinnedChat = (chatId: number, chatType: EChatType) => {
    return (
      pinChats.find((pinChat) => {
        if (chatType === EChatType.DIRECT) {
          return pinChat.directChatId === chatId
        } else {
          return pinChat.groupChatId === chatId
        }
      }) || undefined
    )
  }

  return { pinChats, setPinChats, loading, fetchPinChatsByUserId, isChatPinned, getPinnedChat }
}
