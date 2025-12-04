import { pushNotificationService } from "@/services/push-notification.service"
import { RETRY_CONFIG } from "../constants"

interface VoiceCommandResponse {
  transcript: string
  response: string
  audioBase64: string | null
  needsConfirmation: boolean
  pending: any | null
}

/**
 * Send audio data to backend for STT processing with automatic retry
 */
export const sendVoiceCommand = async (
  audioData: string,
  retryCount = 0,
  maxRetries = RETRY_CONFIG.MAX_RETRIES
): Promise<VoiceCommandResponse> => {
  try {
    console.log("📤 Gửi audio lên backend để STT (Deepgram)...")
    console.log("📤 Audio size:", audioData.length, "chars")
    if (retryCount > 0) {
      console.log(`🔄 Retry attempt ${retryCount}/${maxRetries}`)
    }

    const response = await pushNotificationService.handleVoiceCommand(audioData)
    console.log("📥 Response từ backend:", response)

    return {
      transcript: response.transcript || "Không hiểu",
      response: response.response || "Có lỗi xảy ra",
      audioBase64: response.audioBase64 || null,
      needsConfirmation: response.needsConfirmation || false,
      pending: response.pending || null,
    }
  } catch (err: unknown) {
    const error = err as Error
    console.error("❌ Lỗi gửi API:", error)

    // Check if it's a network error and we haven't exceeded retry limit
    const isNetworkError =
      error.message.includes("Network Error") || error.message.includes("ERR_NETWORK")

    if (isNetworkError && retryCount < maxRetries) {
      const delay = Math.min(
        RETRY_CONFIG.BASE_DELAY * Math.pow(2, retryCount),
        RETRY_CONFIG.MAX_DELAY
      )
      console.warn(`⚠️ Network error - Đợi ${delay}ms rồi thử lại...`)

      await new Promise((resolve) => setTimeout(resolve, delay))
      return sendVoiceCommand(audioData, retryCount + 1, maxRetries)
    }

    if (isNetworkError) {
      console.error("❌ BACKEND KHÔNG CHẠY hoặc CORS error sau", maxRetries, "lần thử!")
      console.error("❌ Kiểm tra:")
      console.error("   1. Backend đã chạy chưa? (npm run start:dev)")
      console.error("   2. Backend URL đúng chưa? (check axios config)")
      console.error("   3. CORS đã config chưa? (backend main.ts)")
      return {
        transcript: "",
        response: "Không kết nối được backend sau nhiều lần thử. Vui lòng kiểm tra backend.",
        audioBase64: null,
        needsConfirmation: false,
        pending: null,
      }
    }

    return {
      transcript: "Không thể xử lý",
      response: `Lỗi: ${error.message}`,
      audioBase64: null,
      needsConfirmation: false,
      pending: null,
    }
  }
}
