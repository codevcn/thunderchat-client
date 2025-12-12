import { chattingService } from "@/services/chatting.service"
import { EMessageTypeAllTypes } from "@/utils/enums"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { SpeakFn } from "@/utils/types/global"

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
  console.log("[sendSticker] contactId:", contactId, typeof contactId)
  console.log("[sendSticker] contactName:", contactName)
  console.log("[sendSticker] chatType:", chatType)
  console.log("[sendSticker] directChatId:", directChatId, typeof directChatId)
  console.log("[sendSticker] groupId:", groupId, typeof groupId)
  console.log("[sendSticker] stickerId:", stickerId, typeof stickerId)
  console.log("[sendSticker] stickerDescription:", stickerDescription)
  console.log("[sendSticker] Condition: chatType === 'group'?", chatType === "group")
  console.log("[sendSticker] Condition: groupId truthy?", !!groupId)
  console.log("[sendSticker] Will use group path?", chatType === "group" && groupId)
  console.log("[sendSticker] ============================")

  await speakText(`Đang gửi sticker ${stickerDescription || ""} cho ${contactName}...`, rate, false)

  const messageToken = chattingService.getMessageToken()

  if (chatType === "group" && groupId) {
    console.log("[sendSticker] GROUP PATH - Preparing payload")
    const groupPayload = {
      groupChatId: groupId,
      content: `${stickerId}`,
      token: messageToken,
      timestamp: new Date(),
    }
    console.log("[sendSticker] Payload:", groupPayload)
    console.log("[sendSticker] 🚀 Calling sendGroupMessage...")

    // ✅ Wrap callback trong Promise để wait
    await new Promise<void>((resolve) => {
      chattingService.sendGroupMessage(EMessageTypeAllTypes.STICKER, groupPayload, (ack) => {
        console.log("[sendSticker] GROUP - Ack received:", JSON.stringify(ack, null, 2))
        if ("success" in ack && ack.success) {
          console.log(
            "[sendSticker] GROUP - Success! Emitting FETCH_GROUP_CHAT with groupId:",
            groupId
          )
          eventEmitter.emit(EInternalEvents.FETCH_GROUP_CHAT, groupId)
          console.log("[sendSticker] GROUP - Event emitted successfully")
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
        resolve()
      })
    })
  } else {
    console.log("[sendSticker] DIRECT PATH - Preparing payload")
    const directPayload = {
      receiverId: contactId,
      content: `${stickerId}`,
      token: messageToken,
      timestamp: new Date(),
    }
    console.log("[sendSticker] Payload:", directPayload)
    console.log("[sendSticker] 🚀 Calling sendMessage...")

    // ✅ Wrap callback trong Promise để wait
    await new Promise<void>((resolve) => {
      chattingService.sendMessage(EMessageTypeAllTypes.STICKER, directPayload, (ack) => {
        console.log("[sendSticker] DIRECT - Ack received:", JSON.stringify(ack, null, 2))
        if ("success" in ack && ack.success) {
          console.log("[sendSticker] DIRECT - Success! Emitting FETCH_DIRECT_CHAT")
          if (directChatId) {
            console.log(
              "[sendSticker] DIRECT - Emitting FETCH_DIRECT_CHAT for directChatId:",
              directChatId
            )
            eventEmitter.emit(EInternalEvents.FETCH_DIRECT_CHAT, directChatId)
            console.log("[sendSticker] DIRECT - Event emitted successfully")
          }
        } else {
          speakText(
            `Có lỗi xảy ra khi gửi sticker. ${(ack as any)?.message || "Server error"}`,
            rate,
            false
          )
          // ✅ Chỉ restart khi có lỗi
          setTimeout(() => restartWakeWordDetection(), 1500)
        }
        resolve()
      })
    })
  }
}
