import { useEffect } from "react"
import { useAppSelector } from "./redux"
import { useVoicePlayer } from "@/contexts/voice-player.context"
import type { TStateDirectMessage } from "@/utils/types/global"

export const useAudioMessages = () => {
  const { setAudioMessages } = useVoicePlayer()
  const { directMessages } = useAppSelector(({ messages }) => messages)

  useEffect(() => {
    if (directMessages) {
      // Lọc ra các messages có type AUDIO
      const audioMessages = directMessages.filter(
        (message: TStateDirectMessage) => message.type === "AUDIO" && message.mediaUrl
      )

      // Cập nhật danh sách audio messages trong context
      setAudioMessages(audioMessages)
    }
  }, [directMessages, setAudioMessages])

  return null
}
