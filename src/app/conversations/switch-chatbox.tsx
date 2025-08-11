import { useSearchParams } from "next/navigation"
import validator from "validator"
import { useState, useEffect, useRef } from "react"
import { DirectChatbox } from "./direct-chat/chatbox"
import { GroupChatbox } from "./group/group-chatbox"
import { localStorageManager } from "@/utils/local-storage"
import { EChatType } from "@/utils/enums"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { useAppDispatch } from "@/hooks/redux"
import { setDirectChat } from "@/redux/messages/messages.slice"

type TChatInfo = {
  type: EChatType
  chatId: number
}

export const SwitchChatbox = () => {
  const [chatInfo, setChatInfo] = useState<TChatInfo>()
  const searchParams = useSearchParams()
  const directChatId = searchParams.get("cid")
  const tempId = searchParams.get("tid")
  const groupChatId = searchParams.get("gid")
  const prevChatInfoRef = useRef<TChatInfo | null>(null)
  const dispatch = useAppDispatch()

  const checkChatInfo = () => {
    if (directChatId && validator.isNumeric(directChatId)) {
      handleSetChatInfo({
        type: EChatType.DIRECT,
        chatId: parseInt(directChatId),
      })
    } else if (tempId && validator.isNumeric(tempId)) {
      handleLastDirectChatData(parseInt(tempId))
    } else if (groupChatId && validator.isNumeric(groupChatId)) {
      handleSetChatInfo({
        type: EChatType.GROUP,
        chatId: parseInt(groupChatId),
      })
    }
  }

  const handleSetChatInfo = ({ type, chatId }: TChatInfo) => {
    setChatInfo((pre) => {
      if (pre) {
        if (pre.chatId !== chatId || type !== pre.type) {
          return {
            type,
            chatId,
          }
        }
        return pre
      }
      return {
        type,
        chatId,
      }
    })
  }

  const handleLastDirectChatData = (tempId: number) => {
    const lastDirectChatData = localStorageManager.getLastDirectChatData()
    if (lastDirectChatData && tempId === lastDirectChatData.tempId) {
      const { chatData } = lastDirectChatData
      const chatId = chatData.id
      if (chatId === -1) {
        dispatch(setDirectChat(chatData))
      }
      handleSetChatInfo({
        type: EChatType.DIRECT,
        chatId,
      })
    }
  }

  const handleFetchChatData = () => {
    if (!chatInfo) return
    const { chatId, type } = chatInfo
    if (
      chatId !== -1 &&
      (prevChatInfoRef.current?.chatId !== chatId || prevChatInfoRef.current?.type !== type)
    ) {
      if (type === EChatType.DIRECT) {
        eventEmitter.emit(EInternalEvents.FETCH_DIRECT_CHAT, chatId)
      } else if (type === EChatType.GROUP) {
        eventEmitter.emit(EInternalEvents.FETCH_GROUP_CHAT, chatId)
      }
      prevChatInfoRef.current = chatInfo
    }
  }

  useEffect(() => {
    handleFetchChatData()
  }, [chatInfo])

  useEffect(() => {
    checkChatInfo()
  }, [directChatId, tempId, groupChatId])

  return chatInfo && (chatInfo.type === EChatType.DIRECT ? <DirectChatbox /> : <GroupChatbox />)
}
