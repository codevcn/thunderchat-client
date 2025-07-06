import { useSearchParams } from "next/navigation"
import validator from "validator"
import { useState, useEffect } from "react"
import { DirectChatbox } from "./direct-chat/chatbox"
import { GroupChatbox } from "./group/group-chatbox"

export const SwitchChatbox = () => {
  const [directChatId, setDirectChatId] = useState<number>()
  const [groupChatId, setGroupChatId] = useState<number>()
  const searchParams = useSearchParams()

  const checkChatId = () => {
    const directChatId = searchParams.get("cid")
    if (directChatId && validator.isNumeric(directChatId)) {
      const convId = parseInt(directChatId)
      setDirectChatId(convId)
    } else {
      const groupChatId = searchParams.get("gid")
      if (groupChatId && validator.isNumeric(groupChatId)) {
        const convId = parseInt(groupChatId)
        setGroupChatId(convId)
      }
    }
  }

  useEffect(() => {
    checkChatId()
  }, [searchParams])

  return directChatId ? (
    <DirectChatbox directChatId={directChatId} />
  ) : (
    groupChatId && <GroupChatbox groupChatId={groupChatId} />
  )
}
