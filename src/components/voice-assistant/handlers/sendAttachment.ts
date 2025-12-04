import { chattingService } from "@/services/chatting.service"
import { FileService } from "@/services/file.service"
import { EMessageTypeAllTypes } from "@/utils/enums"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import type { SpeakFn } from "../types/speakFn"

export type TAttachmentKind = "IMAGE" | "DOCUMENT" | "VIDEO"

export interface SendAttachmentArgs {
  contactId?: number
  contactName: string
  chatType?: "direct" | "group"
  directChatId?: number | null
  groupId?: number | null
  rate: number
  speakText: SpeakFn
  restartWakeWordDetection: () => Promise<void> | void
  kind: TAttachmentKind
  directFile?: File // Nếu đã có file (được chọn từ liệt kê candidates) thì truyền vào để bỏ qua picker
}

function getAccept(kind: TAttachmentKind) {
  switch (kind) {
    case "IMAGE":
      return "image/*"
    case "VIDEO":
      return "video/*"
    case "DOCUMENT":
      return [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ].join(",")
    default:
      return "*/*"
  }
}

function pickSingleFile(accept: string): Promise<File | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = accept
    input.style.display = "none"
    input.onchange = () => {
      const file = input.files?.[0]
      input.remove()
      resolve(file)
    }
    input.oncancel = () => {
      input.remove()
      resolve(undefined)
    }
    document.body.appendChild(input)
    input.click()
  })
}

export const handleSendAttachment = async (args: SendAttachmentArgs) => {
  const {
    contactId,
    contactName,
    chatType,
    directChatId,
    groupId,
    rate,
    speakText,
    restartWakeWordDetection,
    kind,
    directFile,
  } = args

  const accept = getAccept(kind)
  const typeLabel = kind === "IMAGE" ? "ảnh" : kind === "VIDEO" ? "video" : "tài liệu"

  // Nếu có sẵn file (được người dùng chọn bằng giọng nói từ danh sách) thì bỏ qua bước mở picker
  if (!directFile) {
    await speakText(`Mở chọn ${typeLabel} để gửi cho ${contactName}...`, rate, false)
  }

  try {
    const file = directFile || (await pickSingleFile(accept))
    if (!file) {
      await speakText(`Bạn chưa chọn ${typeLabel}. Hãy thử lại.`, rate, false)
      setTimeout(() => restartWakeWordDetection(), 1500)
      return
    }

    // Upload
    const uploadRes = await FileService.uploadFile(file)
    if (!uploadRes?.id) {
      await speakText(`Có lỗi khi tải ${typeLabel} lên.`, rate, false)
      setTimeout(() => restartWakeWordDetection(), 1500)
      return
    }

    const messageToken = chattingService.getMessageToken()

    // Map kind -> message type
    const messageType: EMessageTypeAllTypes =
      kind === "IMAGE"
        ? EMessageTypeAllTypes.IMAGE
        : kind === "VIDEO"
          ? EMessageTypeAllTypes.VIDEO
          : EMessageTypeAllTypes.DOCUMENT

    // Build payload (align with direct handler approach)
    const receiver = contactId || groupId || 0
    chattingService.sendMessage(
      messageType,
      {
        receiverId: receiver,
        content: `${uploadRes.id}`,
        token: messageToken,
        timestamp: new Date(),
      },
      (ack) => {
        if ("success" in ack && ack.success) {
          // ✅ Không speak ở đây - main flow sẽ handle response text
          if (chatType === "direct" && directChatId) {
            eventEmitter.emit(EInternalEvents.FETCH_DIRECT_CHAT, directChatId)
          } else if (chatType === "group" && groupId) {
            eventEmitter.emit(EInternalEvents.FETCH_GROUP_CHAT, groupId)
          }
        } else {
          // ✅ Chỉ restart khi có lỗi
          speakText(`Gửi ${typeLabel} thất bại.`, rate, false)
          setTimeout(() => restartWakeWordDetection(), 1500)
        }
      }
    )
  } catch (err) {
    console.error("❌ Lỗi khi gửi file:", err)
    await speakText(`Có lỗi xảy ra khi gửi ${typeLabel}.`, rate, false)
    setTimeout(() => restartWakeWordDetection(), 1500)
  }
}
