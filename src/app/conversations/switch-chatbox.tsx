import { useSearchParams } from "next/navigation"
import validator from "validator"
import { useState, useEffect } from "react"
import { DirectChatbox } from "./direct-chat/chatbox"
import { GroupChatbox } from "./group/group-chatbox"
import type { TChatType } from "@/utils/types/global"

export const SwitchChatbox = () => {
  const [chatId, setChatId] = useState<number>()
  const [type, setType] = useState<TChatType>()
  const searchParams = useSearchParams()

  const checkChatId = () => {
    const directChatId = searchParams.get("cid")
    if (directChatId && validator.isNumeric(directChatId)) {
      const convId = parseInt(directChatId)
      setChatId(convId)
      setType("direct")
    } else {
      const groupChatId = searchParams.get("gid")
      if (groupChatId && validator.isNumeric(groupChatId)) {
        const convId = parseInt(groupChatId)
        setChatId(convId)
        setType("group")
      }
    }
  }

  useEffect(() => {
    checkChatId()
  }, [searchParams])

  return (
    chatId &&
    type &&
    (type === "direct" ? (
      <DirectChatbox directChatId={chatId} />
    ) : (
      <GroupChatbox groupChatId={chatId} />
    ))
  )
}
