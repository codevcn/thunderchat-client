/**
 * Text-to-Speech utility using browser SpeechSynthesis API
 */
export const speakText = async (
  text: string,
  rate: number = 1.0,
  waitForConfirmation: boolean = false
): Promise<void> => {
  return new Promise((resolve) => {
    try {
      console.log("🔊 Phát TTS cho:", text)
      console.log("🔊 Đây là TEXT-TO-SPEECH synthesized, KHÔNG phải audio gốc")

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "vi-VN"
      utterance.rate = Math.max(0.5, Math.min(2, rate))
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onend = () => {
        console.log("✅ Phát TTS xong")
        resolve()
      }

      utterance.onerror = (event) => {
        console.error("❌ Lỗi TTS:", event.error)
        resolve()
      }

      window.speechSynthesis.speak(utterance)
    } catch (err) {
      console.error("❌ Lỗi TTS:", err)
      resolve()
    }
  })
}

/**
 * Check if response text is a follow-up question from backend
 */
export const isFollowUpQuestion = (text?: string | null): boolean => {
  if (!text) return false
  const t = text.toLowerCase()
  const cues = [
    "vui lòng nói tên các thành viên",
    "hãy nói tên các thành viên",
    "bạn muốn thêm ai",
    "tên các thành viên",
    "tên nhóm là gì",
    "hãy nói tên nhóm",
    "bạn muốn đặt tên nhóm là gì",
  ]
  return cues.some((cue) => t.includes(cue))
}
