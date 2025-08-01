import { useSearchParams } from "next/navigation"
import validator from "validator"
import { useState, useEffect } from "react"
import { DirectChatbox } from "./direct-chat/chatbox"
import { GroupChatbox } from "./group/group-chatbox"
import type { TChatType } from "@/utils/types/global"
import { resetAllChatData, setDirectChat } from "@/redux/messages/messages.slice"
import { useAppDispatch } from "@/hooks/redux"
import { localStorageManager } from "@/utils/local-storage"

export const SwitchChatbox = () => {
  const [chatId, setChatId] = useState<number>()
  const [type, setType] = useState<TChatType>()
  const [isTemp, setIsTemp] = useState<boolean>(false)
  const searchParams = useSearchParams()
  const directChatId = searchParams.get("cid")
  const tempId = searchParams.get("tid")
  const groupChatId = searchParams.get("gid")
  const dispatch = useAppDispatch()

  const checkChatId = () => {
    if (directChatId && validator.isNumeric(directChatId)) {
      setChatId(parseInt(directChatId))
      setIsTemp(false)
      setType("direct")
      return
    }
    if (tempId && validator.isNumeric(tempId)) {
      setChatId(parseInt(tempId))
      setType("direct")
      setIsTemp(true)
      return
    }
    if (groupChatId && validator.isNumeric(groupChatId)) {
      setChatId(parseInt(groupChatId))
      setIsTemp(false)
      setType("group")
      return
    }
  }

  const handleTempChatData = () => {
    if (!tempId) return
    const lastDirectChatData = localStorageManager.getLastDirectChatData()
    if (lastDirectChatData) {
      setChatId(lastDirectChatData.id)
      setType("direct")
      setIsTemp(false)
      dispatch(setDirectChat(lastDirectChatData))
    }
  }

  useEffect(() => {
    handleTempChatData()
  }, [tempId])

  useEffect(() => {
    checkChatId()
    dispatch(resetAllChatData())
  }, [directChatId, tempId, groupChatId])

  return (
    chatId &&
    type &&
    (type === "direct" ? (
      <DirectChatbox key={chatId} directChatId={chatId} isTemp={isTemp} />
    ) : (
      <GroupChatbox key={chatId} groupChatId={chatId} />
    ))
  )
}
