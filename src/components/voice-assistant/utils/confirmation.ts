/**
 * Confirmation and parsing utilities for voice commands
 */

/**
 * Extract sticker description from transcript
 * Format: "gửi sim sticker mặt cười đến nguyễn văn tiên" → "mặt cười"
 */
export function extractStickerDescriptionFromTranscript(transcript: string): string | undefined {
  if (!transcript) return undefined

  const stickerMatch = transcript.match(/sticker\s+([^\s]+(?:\s+[^\s]+)*?)(?:\s+đến|\s+cho|$)/i)
  if (stickerMatch && stickerMatch[1]) {
    return stickerMatch[1].trim()
  }

  return undefined
}

/**
 * Extract emoji from transcript
 * Pattern: "gửi emoji ... đến ..." hay "gửi ... emoji <EMOJI> ... đến ..."
 */
export function extractEmojiFromTranscript(transcript: string): string | undefined {
  if (!transcript) return undefined

  const emojiMatch = transcript.match(/emoji\s+([^\s]+(?:\s+[^\s]+)*?)(?:\s+đến|\s+cho|$)/i)
  if (emojiMatch && emojiMatch[1]) {
    return emojiMatch[1].trim()
  }

  return undefined
}

/**
 * Parse selection index from transcript
 * Examples: "ảnh số 2", "file thứ ba", "cái đầu tiên", "số 1"
 */
export function parseSelectionIndex(text: string): number | null {
  const mapOrdinals: Record<string, number> = {
    một: 1,
    "1": 1,
    "đầu tiên": 1,
    hai: 2,
    "2": 2,
    ba: 3,
    "3": 3,
    bốn: 4,
    "4": 4,
    năm: 5,
    "5": 5,
    sáu: 6,
    "6": 6,
    bảy: 7,
    "7": 7,
    tám: 8,
    "8": 8,
    chín: 9,
    "9": 9,
    mười: 10,
    "10": 10,
  }

  // Try pattern 'số (\d+)' first
  const numberMatch = text.match(/số\s*(\d+)/)
  if (numberMatch) return parseInt(numberMatch[1], 10)

  // Try ordinals
  for (const key of Object.keys(mapOrdinals)) {
    if (text.includes(key)) return mapOrdinals[key]
  }

  return null
}

/**
 * Check if transcript is a confirmation (yes/no)
 */
export function isConfirmation(transcript: string): {
  isConfirmed: boolean
  isRejected: boolean
} {
  const lowerTranscript = transcript.toLowerCase()

  const isConfirmed = ["có", "đúng", "ừ", "vâng", "ok", "gửi", "gọi", "nhận", "bắt máy"].some(
    (word) => lowerTranscript.includes(word)
  )

  const isRejected = [
    "không",
    "không có",
    "hủy",
    "không gửi",
    "không được",
    "từ chối",
    "không nhận",
  ].some((word) => lowerTranscript.includes(word))

  return { isConfirmed, isRejected }
}

/**
 * Get cancel message for action type
 */
export function getCancelMessage(actionType: string): string {
  const cancelMessages: Record<string, string> = {
    send_message: "Đã hủy gửi tin nhắn.",
    send_voice_message: "Đã hủy gửi tin nhắn voice.",
    send_image: "Đã hủy gửi ảnh.",
    send_document: "Đã hủy gửi tài liệu.",
    send_file: "Đã hủy gửi file.",
    send_sticker: "Đã hủy gửi sticker.",
    send_emoji: "Đã hủy gửi emoji.",
    make_call: "Đã hủy cuộc gọi.",
    create_group: "Đã hủy tạo nhóm.",
    join_group: "Đã hủy tham gia nhóm.",
    invite_to_group: "Đã hủy mời vào nhóm.",
    change_user_name: "Đã hủy đổi tên.",
    search_message: "Đã hủy tìm kiếm.",
    search_smart: "Đã hủy tìm kiếm thông minh.",
    incoming_call: "Đã từ chối cuộc gọi.",
  }

  return cancelMessages[actionType] || "Đã hủy thao tác."
}

/**
 * Get action name in Vietnamese
 */
export function getActionName(actionType: string): string {
  const actionNames: Record<string, string> = {
    make_call: "cuộc gọi",
    send_message: "tin nhắn",
    change_user_name: "đổi tên",
    search_message: "tìm kiếm",
    search_smart: "tìm kiếm thông minh",
    send_voice_message: "tin nhắn voice",
    send_sticker: "sticker",
    send_emoji: "emoji",
    create_group: "tạo nhóm",
  }

  return actionNames[actionType] || "hành động"
}
