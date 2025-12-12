import { PendingAction } from "../types"
import { chattingService } from "@/services/chatting.service"
import { FileService } from "@/services/file.service"
import { EMessageTypeAllTypes } from "@/utils/enums"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"

import { MutableRefObject } from "react"

interface HandleVoiceMessageParams {
  pendingAction: PendingAction
  pendingActionRef: MutableRefObject<PendingAction | null>
  isWaitingForConfirmationRef: MutableRefObject<boolean>
  rate?: number
  speakText: (text: string, rate?: number, waitForConfirmation?: boolean) => Promise<void>
  restartWakeWordDetection: () => Promise<void>
}

/**
 * Handle sending voice message to direct chat or group
 */
export const handleVoiceMessage = async ({
  pendingAction,
  pendingActionRef,
  isWaitingForConfirmationRef,
  rate = 1.0,
  speakText,
  restartWakeWordDetection,
}: HandleVoiceMessageParams): Promise<void> => {
  const { contactName, groupId, directChatId, chatType, audioBase64 } = pendingAction

  // ⚠️ IMPORTANT: Backend sends:
  // - targetId = directChatId (for direct) or groupId (for group)
  // - recipientUserId = the other user's ID (for direct chat payload)
  const recipientUserId = (pendingAction as any).recipientUserId
  const targetDirectChatId = (pendingAction as any).targetId || directChatId
  const targetGroupId = (pendingAction as any).targetId || groupId

  if (!audioBase64) {
    console.error("❌ No audio data in pending action!")
    await speakText("Không có dữ liệu âm thanh để gửi.", rate, false)
    setTimeout(() => restartWakeWordDetection(), 1500)
    return
  }

  console.log("🎤 Voice message - xử lý upload và gửi")
  console.log("🔍 Audio source: from lastAudioDataRef")

  try {
    console.log("📤 Converting audio base64 to Blob...")

    // Convert base64 to Blob
    const base64Data = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const audioBlob = new Blob([bytes], { type: "audio/webm" })

    // Create File object
    const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, {
      type: "audio/webm",
    })

    // Upload to S3
    console.log("☁️ Uploading voice message to S3...")
    const uploadResult = await FileService.uploadFile(audioFile)

    if (!uploadResult?.id) {
      throw new Error("Upload failed - no media ID returned")
    }

    console.log("Upload thành công, mediaId:", uploadResult.id)

    // Send message with audio media type
    const messageToken = chattingService.getMessageToken()

    if (chatType === "group") {
      // GROUP: Use sendGroupMessage with groupChatId
      const groupPayload = {
        groupChatId: Number(targetGroupId!), // Use targetGroupId from backend
        content: `${uploadResult.id}`, //  String type
        token: messageToken,
        timestamp: new Date(),
      }
      console.log("📤 SENDING GROUP voice message - Full details:")
      console.log("   - Type:", EMessageTypeAllTypes.AUDIO)
      console.log("   - Payload:", JSON.stringify(groupPayload, null, 2))
      console.log("   - groupChatId type:", typeof groupPayload.groupChatId)
      console.log("   - content type:", typeof groupPayload.content)
      console.log("   - token type:", typeof groupPayload.token)

      await new Promise<void>((resolve) => {
        chattingService.sendGroupMessage(EMessageTypeAllTypes.AUDIO, groupPayload, (ack) => {
          console.log("📤 Group voice message send callback:", ack)
          if ("success" in ack && ack.success) {
            console.log(" Group voice message sent successfully!")
            eventEmitter.emit(EInternalEvents.FETCH_GROUP_CHAT, targetGroupId!)
            speakText(`Đã gửi voice message cho ${contactName} thành công.`, rate, false)
          } else {
            console.error(" Group voice message send failed", ack)
            speakText(`Có lỗi xảy ra khi gửi voice message.`, rate, false).then(() => {
              restartWakeWordDetection()
            })
          }
          pendingActionRef.current = null
          isWaitingForConfirmationRef.current = false
          resolve()
        })
      })
    } else {
      const directPayload = {
        content: `${uploadResult.id}`,
        receiverId: Number(recipientUserId!),
        token: messageToken,
        timestamp: new Date(),
      }

      console.log("📤 SENDING DIRECT voice message:")
      console.log("   Type:", EMessageTypeAllTypes.AUDIO)
      console.log("   Payload stringified:", JSON.stringify(directPayload))
      console.log(
        "   - receiverId:",
        directPayload.receiverId,
        "type:",
        typeof directPayload.receiverId
      )
      console.log("   - content:", directPayload.content, "type:", typeof directPayload.content)
      console.log("   - token:", directPayload.token, "type:", typeof directPayload.token)
      console.log(
        "   - timestamp:",
        directPayload.timestamp,
        "type:",
        typeof directPayload.timestamp
      )
      console.log("   Validation:")
      console.log("   - receiverId is number?", typeof directPayload.receiverId === "number")
      console.log("   - content is string?", typeof directPayload.content === "string")
      console.log("   - token is string?", typeof directPayload.token === "string")
      console.log("   - timestamp is Date?", directPayload.timestamp instanceof Date)
      console.log("   - directpayload:", directPayload)
      // ✅ Wrap callback trong Promise để wait
      await new Promise<void>((resolve) => {
        chattingService.sendMessage(EMessageTypeAllTypes.AUDIO, directPayload, (ack) => {
          console.log("📤 Direct voice message send callback:", ack)
          console.log("📤 Callback details:", JSON.stringify(ack, null, 2))
          if ("success" in ack && ack.success) {
            console.log(" Direct voice message sent successfully!")
            eventEmitter.emit(EInternalEvents.FETCH_DIRECT_CHAT, targetDirectChatId!)
            speakText(`Đã gửi voice message cho ${contactName} thành công.`, rate, false)
          } else {
            console.error("Direct voice message send failed", ack)
            speakText(`Có lỗi xảy ra khi gửi voice message.`, rate, false).then(() => {
              restartWakeWordDetection()
            })
          }
          pendingActionRef.current = null
          isWaitingForConfirmationRef.current = false
          resolve()
        })
      })
    }
  } catch (err) {
    console.error("❌ Error processing voice message:", err)
    pendingActionRef.current = null
    isWaitingForConfirmationRef.current = false
  }
}
