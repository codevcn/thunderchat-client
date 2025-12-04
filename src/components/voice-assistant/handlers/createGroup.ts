import { groupChatService } from "@/services/group-chat.service"
import type { SpeakFn } from "../types/speakFn"

export interface CreateGroupArgs {
  groupName: string
  memberIds: number[]
  memberNames?: string[]
  rate?: number
  speakText: SpeakFn
  restartWakeWordDetection: () => Promise<void> | void
  router: { push: (url: string) => void }
}

export const handleCreateGroup = async (args: CreateGroupArgs) => {
  const {
    groupName,
    memberIds,
    memberNames,
    rate = 1.0,
    speakText,
    restartWakeWordDetection,
    router,
  } = args

  // Basic validation to avoid silent failures
  if (!groupName?.trim()) {
    await speakText("Tên nhóm chưa rõ. Vui lòng nói lại tên nhóm.", rate, false)
    setTimeout(() => restartWakeWordDetection(), 1200)
    return
  }

  // Sanitize member IDs: numeric, positive, distinct
  const cleanMemberIds = Array.from(
    new Set(
      (memberIds || []).filter((id) => typeof id === "number" && Number.isFinite(id) && id > 0)
    )
  )

  if (!Array.isArray(cleanMemberIds) || cleanMemberIds.length === 0) {
    await speakText(
      "Chưa có thành viên nào được chọn. Vui lòng nói tên các thành viên.",
      rate,
      false
    )
    setTimeout(() => restartWakeWordDetection(), 1200)
    return
  }

  await speakText(`Đang tạo nhóm "${groupName}"...`, rate, false)

  try {
    console.log("📤 Tạo nhóm: payload gửi đi", { groupName, memberIds: cleanMemberIds })
    const newGroup = await groupChatService.createGroupChat(groupName, cleanMemberIds, undefined)

    const membersText =
      memberNames && memberNames.length > 0 ? ` với các thành viên: ${memberNames.join(", ")}` : ""
    await speakText(
      `Đã tạo nhóm "${groupName}" thành công với ${cleanMemberIds.length} thành viên${membersText}.`,
      rate,
      false
    )

    // Navigate to the new group's conversation
    if (newGroup?.id) {
      router.push(`/conversations?groupId=${newGroup.id}`)
    }
    // ✅ Không gọi restartWakeWordDetection vì stream vẫn đang chạy
  } catch (error) {
    console.error("❌ Lỗi khi tạo nhóm:", error)
    await speakText("Có lỗi xảy ra khi tạo nhóm. Vui lòng thử lại.", rate, false)
    // ✅ Chỉ restart khi có lỗi
    setTimeout(() => restartWakeWordDetection(), 1400)
  }
}
