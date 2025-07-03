import { ChatBackgroundContext } from "@/contexts/chat-background.context"
import { RootLayoutContext } from "@/contexts/root-layout.context"
import { useContext } from "react"

export const useChatBackground = () => useContext(ChatBackgroundContext)

export const useRootLayoutContext = () => useContext(RootLayoutContext)
