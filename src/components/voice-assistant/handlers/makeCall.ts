import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"

export interface IMakeCallParams {
  contactId: number
  contactName: string
  chatType: "direct" | "group"
  directChatId?: number
  groupId?: number
  isVideoCall?: boolean
  rate: number
  speakText: (text: string, rate: number, interruptible?: boolean) => Promise<void>
  restartWakeWordDetection: () => void
}

export async function handleMakeCall(params: IMakeCallParams) {
  const {
    contactId,
    contactName,
    chatType,
    directChatId,
    groupId,
    isVideoCall = false,
    rate,
    speakText,
    restartWakeWordDetection,
  } = params

  console.log("[makeCall] ===== HANDLER CALLED =====")
  console.log("[makeCall] contactId:", contactId)
  console.log("[makeCall] contactName:", contactName)
  console.log("[makeCall] chatType:", chatType)
  console.log("[makeCall] directChatId:", directChatId)
  console.log("[makeCall] groupId:", groupId)
  console.log("[makeCall] isVideoCall:", isVideoCall)

  if (!contactName) {
    console.warn("[makeCall] ⚠️ Missing contactName")
  }

  try {
    const callType = isVideoCall ? "video" : "thoại"

    if (chatType === "group" && groupId) {
      // Group call - phát event để GlobalCallManager xử lý
      console.log("[makeCall] Emitting MAKE_GROUP_CALL event...")
      eventEmitter.emit(EInternalEvents.MAKE_GROUP_CALL, {
        groupId,
        isVideo: isVideoCall,
      })
      await speakText(`Đang gọi ${callType} tới nhóm "${contactName}"...`, rate, false)
    } else if (chatType === "direct" && directChatId && contactId) {
      // Direct call - phát event để GlobalCallManager xử lý
      console.log("[makeCall] Emitting MAKE_DIRECT_CALL event...")
      eventEmitter.emit(EInternalEvents.MAKE_DIRECT_CALL, {
        directChatId,
        isVideo: isVideoCall,
        contactName,
      })
      await speakText(`Đang gọi ${callType} tới ${contactName}...`, rate, false)
    } else {
      console.error("[makeCall] ❌ Invalid chatType or missing IDs", {
        chatType,
        directChatId,
        groupId,
        contactId,
      })
      await speakText("Không thể gọi. Vui lòng thử lại.", rate, false)
      restartWakeWordDetection()
    }
  } catch (error) {
    console.error("[makeCall] Error:", (error as Error).message)
    await speakText("Lỗi khi khởi tạo cuộc gọi. Vui lòng thử lại.", rate, false)
    restartWakeWordDetection()
  }
}
