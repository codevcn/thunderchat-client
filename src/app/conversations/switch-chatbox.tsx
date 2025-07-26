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
  const dispatch = useAppDispatch()

  const checkChatId = () => {
    const directChatId = searchParams.get("cid")
    if (directChatId && validator.isNumeric(directChatId)) {
      const convId = parseInt(directChatId)
      if (convId === -1) {
        setIsTemp(true)
      } else {
        setIsTemp(false)
      }
      setChatId(convId)
      setType("direct")
      return
    }
    const groupChatId = searchParams.get("gid")
    if (groupChatId && validator.isNumeric(groupChatId)) {
      const convId = parseInt(groupChatId)
      setChatId(convId)
      setType("group")
    }
  }

  useEffect(() => {
    checkChatId()
    dispatch(resetAllChatData())
  }, [searchParams])

  return (
    chatId &&
    type &&
    (type === "direct" ? (
      <DirectChatbox directChatId={chatId} isTemp={isTemp} />
    ) : (
      <GroupChatbox groupChatId={chatId} />
    ))
  )
}
