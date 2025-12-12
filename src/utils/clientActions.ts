/**
 * Client-side action handlers for voice assistant
 * Handles clientAction payloads from backend
 */

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { groupChatService } from "@/services/group-chat.service"
import { groupMemberService } from "@/services/group-member.service"
import type { PendingAction } from "../components/voice-assistant/types"
import { getCancelMessage } from "./confirmation"

export interface ClientActionContext {
  speakText: (text: string, rate?: number, waitForConfirmation?: boolean) => Promise<void>
  restartWakeWordDetection: () => Promise<void>
  router: AppRouterInstance
  settings: { speechRate: number }
  pendingActionRef: React.MutableRefObject<PendingAction | null>
  isWaitingForConfirmationRef: React.MutableRefObject<boolean>
}

/**
 * Handle CREATE_GROUP action
 */
export async function handleCreateGroupAction(
  payload: any,
  context: ClientActionContext
): Promise<boolean> {
  try {
    const { handleCreateGroup } = await import("../components/voice-assistant/handlers/createGroup")
    const { speakText, restartWakeWordDetection, router, settings, pendingActionRef } = context

    const groupName =
      payload.groupName ||
      pendingActionRef.current?.groupName ||
      pendingActionRef.current?.content ||
      "Nhóm mới"
    const memberIds = Array.isArray(payload.memberIds)
      ? payload.memberIds
      : pendingActionRef.current?.memberIds || []
    const memberNames = pendingActionRef.current?.memberNames

    console.log("🚀 Backend clientAction detected - creating group with payload:", {
      groupName,
      memberIds,
    })

    // Clear any pending confirmation state
    pendingActionRef.current = null
    context.isWaitingForConfirmationRef.current = false

    await handleCreateGroup({
      groupName,
      memberIds,
      memberNames,
      rate: settings.speechRate,
      speakText,
      restartWakeWordDetection,
      router,
    })

    return true
  } catch (err) {
    console.error("❌ Error executing clientAction.create_group:", err)
    return false
  }
}

/**
 * Handle JOIN_GROUP action
 */
export async function handleJoinGroupAction(
  payload: any,
  context: ClientActionContext
): Promise<boolean> {
  try {
    const { speakText, settings, pendingActionRef } = context
    const groupId = payload.groupId || pendingActionRef.current?.groupId
    const groupName = payload.groupName || pendingActionRef.current?.contactName || "nhóm"

    console.log("👥 Backend clientAction detected - joining group:", { groupId, groupName })

    // Clear any pending confirmation state
    pendingActionRef.current = null
    context.isWaitingForConfirmationRef.current = false

    if (groupId) {
      const result = await groupChatService.createGroupJoinRequest(groupId)
      console.log("✅ Tham gia nhóm thành công:", groupName, result)
      await speakText(
        `Đã gửi yêu cầu tham gia nhóm ${groupName}. Chờ chủ nhóm xác nhận.`,
        settings.speechRate,
        false
      )
    } else {
      console.warn("⚠️ Không tìm thấy groupId để tham gia")
      await speakText("Không tìm thấy nhóm để tham gia.", settings.speechRate, false)
    }
    return true
  } catch (err) {
    console.error("❌ Error executing clientAction.join_group:", err)
    await context.speakText(
      "Lỗi khi tham gia nhóm. Vui lòng thử lại.",
      context.settings.speechRate,
      false
    )
    return false
  }
}

/**
 * Handle INVITE_TO_GROUP action
 */
export async function handleInviteToGroupAction(
  payload: any,
  context: ClientActionContext
): Promise<boolean> {
  try {
    const { speakText, settings, pendingActionRef } = context
    const groupId = payload.groupId || pendingActionRef.current?.groupId
    const inviteeIds = payload.inviteeIds || pendingActionRef.current?.memberIds || []
    const groupName = payload.groupName || pendingActionRef.current?.contactName || "nhóm"
    const inviteeNames = payload.inviteeNames || pendingActionRef.current?.memberNames || []

    console.log("👥 [INVITE_TO_GROUP] Backend clientAction detected - inviting to group:", {
      groupId,
      groupName,
      inviteeIds,
      inviteeNames,
      payloadFull: payload,
      pendingActionRef: pendingActionRef.current,
    })

    // Clear any pending confirmation state
    pendingActionRef.current = null
    context.isWaitingForConfirmationRef.current = false

    if (groupId && inviteeIds && inviteeIds.length > 0) {
      try {
        console.log("🔄 [INVITE_TO_GROUP] Calling groupMemberService.addMembersToGroupChat...")
        console.log("🔄 [INVITE_TO_GROUP] Parameters: groupId=", groupId, "inviteeIds=", inviteeIds)

        const result = await groupMemberService.addMembersToGroupChat(groupId, inviteeIds)

        console.log("✅ [INVITE_TO_GROUP] API Response:", result)

        const inviteeStr =
          inviteeNames.length > 0 ? inviteeNames.join(", ") : `${inviteeIds.length} thành viên`
        console.log("✅ [INVITE_TO_GROUP] Mời vào nhóm thành công:", inviteeStr)

        const successMessage = `Đã mời ${inviteeStr} vào nhóm ${groupName} thành công.`
        console.log("🎤 [INVITE_TO_GROUP] Speaking:", successMessage)

        await speakText(successMessage, settings.speechRate, false)

        console.log("✅ [INVITE_TO_GROUP] Action completed successfully")
      } catch (apiErr) {
        console.error("❌ [INVITE_TO_GROUP] API Error when calling addMembersToGroupChat:", apiErr)
        console.error("❌ [INVITE_TO_GROUP] Error details:", {
          message: (apiErr as any)?.message,
          status: (apiErr as any)?.response?.status,
          data: (apiErr as any)?.response?.data,
        })
        throw apiErr
      }
    } else {
      console.warn("⚠️ [INVITE_TO_GROUP] Không tìm thấy groupId hoặc inviteeIds", {
        groupId,
        inviteeIdsLength: inviteeIds.length,
      })
      await speakText("Không tìm thấy thông tin để mời vào nhóm.", settings.speechRate, false)
    }
    return true
  } catch (err) {
    console.error("❌ [INVITE_TO_GROUP] Error executing clientAction.invite_to_group:", err)
    // await context.speakText(
    //   "Lỗi khi mời vào nhóm. Vui lòng thử lại.",
    //   context.settings.speechRate,
    //   false
    // )
    return false
  }
}

/**
 * Handle SEARCH_SMART action
 */
export async function handleSearchSmartAction(
  payload: any,
  context: ClientActionContext
): Promise<boolean> {
  try {
    const { speakText, router, settings, pendingActionRef } = context
    const searchQuery =
      payload.query || pendingActionRef.current?.content || pendingActionRef.current?.message || ""

    console.log("🔍 Backend clientAction detected - smart search:", { searchQuery })

    // Clear any pending confirmation state
    pendingActionRef.current = null
    context.isWaitingForConfirmationRef.current = false

    if (searchQuery) {
      const searchUrl = `/smart-search?q=${encodeURIComponent(searchQuery)}`
      console.log("✅ Điều hướng đến:", searchUrl)
      router.push(searchUrl)
      await speakText(
        `Đã mở trang tìm kiếm thông minh với từ khóa "${searchQuery}".`,
        settings.speechRate,
        false
      )
    } else {
      console.warn("⚠️ Không tìm thấy query để tìm kiếm")
      await speakText("Không tìm thấy từ khóa để tìm kiếm.", settings.speechRate, false)
    }
    return true
  } catch (err) {
    console.error("❌ Error executing clientAction.search_smart:", err)
    await context.speakText(
      "Lỗi khi tìm kiếm thông minh. Vui lòng thử lại.",
      context.settings.speechRate,
      false
    )
    return false
  }
}

/**
 * Main dispatcher for clientAction
 */
export async function handleClientAction(
  clientAction: any,
  context: ClientActionContext
): Promise<boolean> {
  const payload = clientAction.payload || {}

  // Handle CANCEL action
  if (payload.action === "cancel") {
    console.log(`Hủy lệnh ${clientAction.type}:`, payload.cancelledType)

    context.pendingActionRef.current = null
    context.isWaitingForConfirmationRef.current = false

    const cancelMsg = getCancelMessage(clientAction.type)
    await context.speakText(cancelMsg, context.settings.speechRate, false)
    return true
  }

  // Handle different action types
  switch (clientAction.type) {
    case "create_group":
      return await handleCreateGroupAction(payload, context)

    case "join_group":
      return await handleJoinGroupAction(payload, context)

    case "invite_to_group":
      return await handleInviteToGroupAction(payload, context)

    case "search_smart":
      return await handleSearchSmartAction(payload, context)

    default:
      console.warn("⚠️ Unknown clientAction type:", clientAction.type)
      return false
  }
}
