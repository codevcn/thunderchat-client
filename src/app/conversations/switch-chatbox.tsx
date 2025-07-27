import { useSearchParams } from "next/navigation"
import validator from "validator"
import { useState, useEffect } from "react"
import { DirectChatbox } from "./direct-chat/chatbox"
import { GroupChatbox } from "./group/group-chatbox"
import type { TChatType } from "@/utils/types/global"
import { resetAllChatData } from "@/redux/messages/messages.slice"
import { useAppDispatch } from "@/hooks/redux"

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
      setType("group")
    }
  }

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
