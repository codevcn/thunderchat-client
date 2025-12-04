import { chattingService } from "@/services/chatting.service"
import { EMessageTypeAllTypes } from "@/utils/enums"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import type { SpeakFn } from "../types/speakFn"

export interface SendMessageArgs {
  contactId: number
  contactName: string
  chatType?: "direct" | "group"
  directChatId?: number | null
  groupId?: number | null
  message: string
  rate: number
  speakText: SpeakFn
  restartWakeWordDetection: () => Promise<void> | void
}

export const handleSendMessage = async (args: SendMessageArgs) => {
  const {
    contactId,
    contactName,
    chatType,
    directChatId,
    groupId,
    message,
    rate,
    speakText,
    restartWakeWordDetection,
  } = args

  console.log("[sendMessage] ===== HANDLER CALLED =====")
  console.log("[sendMessage] contactId:", contactId)
  console.log("[sendMessage] contactName:", contactName)
  console.log("[sendMessage] chatType:", chatType)
  console.log("[sendMessage] directChatId:", directChatId)
  console.log("[sendMessage] groupId:", groupId)
  console.log("[sendMessage] message:", message)
  console.log("[sendMessage] Full args:", args)
  console.log("[sendMessage] ============================")

  await speakText(`Đang gửi tin nhắn cho ${contactName}...`, rate, false)

  const messageToken = chattingService.getMessageToken()

  if (chatType === "group" && groupId) {
    chattingService.sendGroupMessage(
      EMessageTypeAllTypes.TEXT,
      {
        groupChatId: groupId,
        content: message,
        token: messageToken,
        timestamp: new Date(),
      },
      (ack) => {
        console.log("[sendMessage] Acknowledgment received:", ack)
        if ("success" in ack && ack.success) {
          console.log("[sendMessage] Message sent successfully to group:", contactName)
          // ✅ Không speak ở đây - main flow sẽ handle response text
          console.log("[sendMessage] Emitting FETCH_GROUP_CHAT for groupId:", groupId)
          eventEmitter.emit(EInternalEvents.FETCH_GROUP_CHAT, groupId)
        } else {
          console.log("[sendMessage] Message send failed:", ack)
          speakText(`Có lỗi xảy ra khi gửi tin nhắn.`, rate, false)
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
        content: message,
        token: messageToken,
        timestamp: new Date(),
      },
      (ack) => {
        console.log("[sendMessage] Acknowledgment received:", ack)
        if ("success" in ack && ack.success) {
          console.log("[sendMessage] Message sent successfully for contact:", contactName)
          // ✅ Không speak ở đây - main flow sẽ handle response text

          if (directChatId) {
            console.log("[sendMessage] Emitting FETCH_DIRECT_CHAT for directChatId:", directChatId)
            eventEmitter.emit(EInternalEvents.FETCH_DIRECT_CHAT, directChatId)
          }
        } else {
          console.log("[sendMessage] Message send failed:", ack)
          speakText(`Có lỗi xảy ra khi gửi tin nhắn.`, rate, false)
          // ✅ Chỉ restart khi có lỗi
          setTimeout(() => restartWakeWordDetection(), 1500)
        }
      }
    )
  }
}
