import { chattingService } from "@/services/chatting.service"
import { EMessageTypeAllTypes } from "@/utils/enums"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"

import type { SpeakFn } from "../types/speakFn"

export interface SendEmojiArgs {
  contactId: number
  contactName: string
  chatType?: "direct" | "group"
  directChatId?: number | null
  groupId?: number | null
  emoji: string
  emojiDescription?: string
  rate: number
  speakText: SpeakFn
  restartWakeWordDetection: () => Promise<void> | void
}

export const handleSendEmoji = async (args: SendEmojiArgs) => {
  const {
    contactId,
    contactName,
    chatType,
    directChatId,
    groupId,
    emoji,
    emojiDescription,
    rate,
    speakText,
    restartWakeWordDetection,
  } = args

  await speakText(`Đang gửi emoji ${emojiDescription || ""} cho ${contactName}...`, rate, false)

  const messageToken = chattingService.getMessageToken()

  if (chatType === "group" && groupId) {
    chattingService.sendGroupMessage(
      EMessageTypeAllTypes.TEXT,
      {
        groupChatId: groupId,
        content: emoji,
        token: messageToken,
        timestamp: new Date(),
      },
      (ack) => {
        console.log("[sendEmoji] Acknowledgment received:", ack)
        if ("success" in ack && ack.success) {
          console.log("[sendEmoji] Emoji sent successfully to group:", contactName)
          // ✅ Không speak ở đây - main flow sẽ handle response text
          console.log("[sendEmoji] Emitting FETCH_GROUP_CHAT for groupId:", groupId)
          eventEmitter.emit(EInternalEvents.FETCH_GROUP_CHAT, groupId)
        } else {
          console.log("[sendEmoji] Emoji send failed:", ack)
          speakText(`Có lỗi xảy ra khi gửi emoji.`, rate, false)
          // ✅ Chỉ restart khi có lỗi
          setTimeout(() => restartWakeWordDetection(), 1500)
        }
      }
    )
  } else {
    chattingService.sendMessage(
      EMessageTypeAllTypes.TEXT,
      {
        receiverId: contactId,
        content: emoji,
        token: messageToken,
        timestamp: new Date(),
      },
      (ack) => {
        console.log("[sendEmoji] Acknowledgment received:", ack)
        if ("success" in ack && ack.success) {
          console.log("[sendEmoji] Emoji sent successfully for contact:", contactName)
          // ✅ Không speak ở đây - main flow sẽ handle response text
          if (directChatId) {
            console.log("[sendEmoji] Emitting FETCH_DIRECT_CHAT for directChatId:", directChatId)
            eventEmitter.emit(EInternalEvents.FETCH_DIRECT_CHAT, directChatId)
          }
        } else {
          console.log("[sendEmoji] Emoji send failed:", ack)
          speakText(`Có lỗi xảy ra khi gửi emoji.`, rate, false)
          // ✅ Chỉ restart khi có lỗi
          setTimeout(() => restartWakeWordDetection(), 1500)
        }
      }
    )
  }
}
