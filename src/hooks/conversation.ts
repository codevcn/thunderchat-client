import { useSearchParams } from "next/navigation"

type TUseConversationParamsRes = {
  directChatId: number | null
  tempId: number | null
  groupChatId: number | null
}

export const useConversation = (): TUseConversationParamsRes => {
  const searchParams = useSearchParams()
  const directChatId = searchParams.get("cid")
  const tempId = searchParams.get("tid")
  const groupChatId = searchParams.get("gid")

  return {
    directChatId: directChatId ? parseInt(directChatId) : null,
    tempId: tempId ? parseInt(tempId) : null,
    groupChatId: groupChatId ? parseInt(groupChatId) : null,
  }
}
