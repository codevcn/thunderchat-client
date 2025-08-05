import { useEffect, useMemo } from "react"
import { useAppSelector } from "./redux"
import { useVoicePlayer } from "@/contexts/voice-player.context"
import type { TStateDirectMessage } from "@/utils/types/global"
import { EMessageMediaTypes, EMessageTypes } from "@/utils/enums"

export const useAudioMessages = () => {
  const { setAudioMessages } = useVoicePlayer()
  const { directMessages } = useAppSelector(({ messages }) => messages)

  // Lấy tất cả voice messages từ directMessages và sắp xếp theo thời gian
  const voiceMessages = useMemo(() => {
    if (!directMessages) return []

    return directMessages
      .filter(
        (message: TStateDirectMessage) =>
          message.type === EMessageTypes.MEDIA && message.Media?.type === EMessageMediaTypes.AUDIO
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // ASC: cũ nhất trước
  }, [directMessages])

  // Update context với tất cả voice messages
  useEffect(() => {
    setAudioMessages(voiceMessages)
  }, [voiceMessages, setAudioMessages])

  return {
    voices: voiceMessages,
  }
}
