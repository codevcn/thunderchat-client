export interface VoiceSettings {
  sttEnabled: boolean
  voiceActivationMode: "WAKE_WORD" | "LONG_PRESS"
  wakeWordPhrase: string
  ttsEnabled: boolean
  speechRate: number
}

export interface PorcupineDetection {
  label: string
  index: number
}

export type PendingAction = {
  type:
    | "send_message"
    | "make_call"
    | "incoming_call"
    | "change_user_name"
    | "search_message"
    | "search_smart"
    | "send_voice_message"
    | "send_sticker"
    | "send_emoji"
    | "create_group"
    | "join_group"
    | "invite_to_group"
    | "send_image"
    | "send_document"
    | "send_file"
    | "choose_attachment"

  contactName: string
  message: string
  contactId?: number
  contactUserId?: number // Backend sends recipient's userId
  recipientUserId?: number // Alternative field from backend
  targetId?: number // Backend uses this for directChatId or groupId
  directChatId?: number
  groupId?: number
  chatType?: "direct" | "group"
  isVideo?: boolean
  content?: string
  audioBase64?: string
  lastBotMessage?: string

  // For send_sticker
  stickerId?: number
  stickerDescription?: string

  // For send_emoji
  emoji?: string
  emojiDescription?: string

  // For create_group
  groupName?: string
  memberIds?: number[]
  memberNames?: string[]

  // Attachment selection flow
  attachmentKind?: "IMAGE" | "DOCUMENT" | "VIDEO"
  attachmentCandidates?: {
    index: number
    name: string
    type: string
    lastModified?: number
    fileHandle?: any
  }[]
  selectedAttachmentIndex?: number
  originalActionType?: "send_image" | "send_document" | "send_file" | "send_video"

  // Direct file for auto-send (no selection needed)
  directFile?: File
  fileName?: string
}
