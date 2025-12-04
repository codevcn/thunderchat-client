import { chattingService } from "@/services/chatting.service"
import { EMessageTypeAllTypes } from "@/utils/enums"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"

import type { SpeakFn } from "../types/speakFn"

export interface SendStickerArgs {
  contactId: number
  contactName: string
  chatType?: "direct" | "group"
  directChatId?: number | null
  groupId?: number | null
  stickerId: number
  stickerDescription?: string
  rate: number
  speakText: SpeakFn
  restartWakeWordDetection: () => Promise<void> | void
}

export const handleSendSticker = async (args: SendStickerArgs) => {
  const {
    contactId,
    contactName,
    chatType,
    directChatId,
    groupId,
    stickerId,
    stickerDescription,
    rate,
    speakText,
    restartWakeWordDetection,
  } = args

  console.log("[sendSticker] ===== HANDLER CALLED =====")
  console.log("[sendSticker] contactId:", contactId)
  console.log("[sendSticker] contactName:", contactName)
  console.log("[sendSticker] chatType:", chatType)
  console.log("[sendSticker] directChatId:", directChatId)
  console.log("[sendSticker] groupId:", groupId)
  console.log("[sendSticker] stickerId:", stickerId)
  console.log("[sendSticker] stickerDescription:", stickerDescription)
  console.log("[sendSticker] Full args:", args)
  console.log("[sendSticker] ============================")

  await speakText(`Đang gửi sticker ${stickerDescription || ""} cho ${contactName}...`, rate, false)

  const messageToken = chattingService.getMessageToken()

  if (chatType === "group" && groupId) {
    chattingService.sendGroupMessage(
      EMessageTypeAllTypes.STICKER,
      {
        groupChatId: groupId,
        content: `${stickerId}`,
        token: messageToken,
        timestamp: new Date(),
      },
      (ack) => {
        console.log("[sendSticker] Acknowledgment received:", ack)
        if ("success" in ack && ack.success) {
          console.log("[sendSticker] Sticker sent successfully to group:", contactName)
          // ✅ Không speak ở đây - main flow sẽ handle response text
          console.log("[sendSticker] Emitting FETCH_GROUP_CHAT for groupId:", groupId)
          eventEmitter.emit(EInternalEvents.FETCH_GROUP_CHAT, groupId)
        } else {
          console.error("[sendSticker] Sticker send failed")
          console.error("[sendSticker] Error details:", ack)
          speakText(
            `Có lỗi xảy ra khi gửi sticker. ${(ack as any)?.message || "Server error"}`,
            rate,
            false
          )
          // ✅ Chỉ restart khi có lỗi
          setTimeout(() => restartWakeWordDetection(), 1500)
        }
      }
    )
  } else {
    chattingService.sendMessage(
      EMessageTypeAllTypes.STICKER,
      {
        receiverId: contactId,
        content: `${stickerId}`,
        token: messageToken,
        timestamp: new Date(),
      },
      (ack) => {
        console.log("[sendSticker] Acknowledgment received:", ack)
        if ("success" in ack && ack.success) {
          console.log("[sendSticker] Sticker sent successfully for contact:", contactName)
          // ✅ Không speak ở đây - main flow sẽ handle response text
          if (directChatId) {
            console.log("[sendSticker] Emitting FETCH_DIRECT_CHAT for directChatId:", directChatId)
            eventEmitter.emit(EInternalEvents.FETCH_DIRECT_CHAT, directChatId)
          }
        } else {
          console.error("[sendSticker] Sticker send failed")
          console.error("[sendSticker] Error details:", ack)
          speakText(
            `Có lỗi xảy ra khi gửi sticker. ${(ack as any)?.message || "Server error"}`,
            rate,
            false
          )
          // ✅ Chỉ restart khi có lỗi
          setTimeout(() => restartWakeWordDetection(), 1500)
        }
      }
    )
  }
}
