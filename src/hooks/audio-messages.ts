import { useEffect, useState } from "react"
import { useAppSelector } from "./redux"
import { useVoicePlayer } from "@/contexts/voice-player.context"
import { messageService } from "@/services/message.service"
import { EMessageTypes, ESortTypes } from "@/utils/enums"
import type { TStateDirectMessage } from "@/utils/types/global"

export const useAudioMessages = () => {
  const { setAudioMessages } = useVoicePlayer()
  const { directChat, directMessages } = useAppSelector(({ messages }) => messages)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchAllVoiceMessages = async () => {
      if (!directChat?.id) return

      setLoading(true)
      try {
        // Sử dụng API getVoiceMessages để lấy tất cả voice messages
        const voiceMessagesData = await messageService.fetchVoiceMessages(
          directChat.id,
          1000, // Lấy nhiều hơn để đảm bảo có đủ voice messages
          0,
          ESortTypes.DESC
        )

        // Lấy voice messages từ response
        const voiceMessages = voiceMessagesData.directMessages || []

        // Cập nhật danh sách audio messages trong context
        setAudioMessages(voiceMessages)
      } catch (error) {
        console.error("Error fetching voice messages:", error)
        // Fallback: sử dụng cách cũ nếu API mới fail
        if (directMessages) {
          const audioMessages = directMessages.filter(
            (message: TStateDirectMessage) => message.type === "AUDIO" && message.mediaUrl
          )
          setAudioMessages(audioMessages)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAllVoiceMessages()
  }, [directChat?.id, directMessages, setAudioMessages])

  return { loading }
}
