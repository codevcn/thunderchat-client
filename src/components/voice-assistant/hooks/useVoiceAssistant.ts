import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { PorcupineWorker } from "@picovoice/porcupine-web"
import type { PorcupineWorker as PorcupineWorkerType } from "@picovoice/porcupine-web"

import { VoiceSettings, PendingAction, PorcupineDetection } from "../types"
import { blobToBase64, playBeep } from "../utils/audio"
import { sendVoiceCommand } from "../services/voiceCommandService"
import { pushNotificationService } from "@/services/push-notification.service"
import { groupMemberService } from "@/services/group-member.service"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import {
  calculateSpeechProbability,
  createVADState,
  getVADThresholds,
  shouldStopRecording,
  updateVADState,
} from "../utils/vad"
import { handleClientAction } from "../utils/clientActions"
import { isConfirmation, parseSelectionIndex } from "../utils/confirmation"
import {
  handleCreateGroup,
  handleSendEmoji,
  handleSendMessage,
  handleSendSticker,
  handleMakeCall,
  handleVoiceMessage,
} from "../handlers"

export function useVoiceAssistant() {
  const router = useRouter()
  const [status, setStatus] = useState<string>("Đang tải cài đặt...")
  const [isListening, setIsListening] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [settings, setSettings] = useState<VoiceSettings | null>(null)

  const pendingActionRef = useRef<PendingAction | null>(null)
  const lastAudioDataRef = useRef<string | null>(null)
  const isWaitingForConfirmationRef = useRef(false)
  const isWakeWordProcessingRef = useRef(false) // 🔒 Lock: chỉ nhận 1 lệnh sau mỗi wake word detect
  const lastWakeWordDetectionTimeRef = useRef<number>(Date.now())
  const detectionHeartbeatRef = useRef<NodeJS.Timeout | null>(null)

  // Porcupine & Audio refs
  const workerRef = useRef<PorcupineWorkerType | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const maxRecordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Load settings on mount
  useEffect(() => {
    let mounted = true

    const loadSettings = async () => {
      try {
        const userSettings = {
          accessibility: {
            sttEnabled: true,
            voiceActivationMode: "WAKE_WORD",
            wakeWordPhrase: "Hey Chat",
            ttsEnabled: true,
            speechRate: 1.0,
          },
        }

        if (mounted) {
          setSettings({
            sttEnabled: userSettings.accessibility?.sttEnabled ?? true,
            voiceActivationMode:
              (userSettings.accessibility?.voiceActivationMode as "WAKE_WORD" | "LONG_PRESS") ??
              "WAKE_WORD",
            wakeWordPhrase: userSettings.accessibility?.wakeWordPhrase ?? "Hey Chat",
            ttsEnabled: userSettings.accessibility?.ttsEnabled ?? true,
            speechRate: userSettings.accessibility?.speechRate ?? 1.0,
          })

          console.log("✅ Settings loaded")
          setStatus("✅ Đã tải cài đặt")
        }
      } catch (err) {
        console.error("❌ Không tải được settings:", err)
        if (mounted) {
          setSettings({
            sttEnabled: true,
            voiceActivationMode: "WAKE_WORD",
            wakeWordPhrase: "Hey Chat",
            ttsEnabled: true,
            speechRate: 1.0,
          })
          setStatus("⚠️ Dùng cài đặt mặc định")
        }
      }
    }

    loadSettings()

    // Track directChatId from events
    const handleFetchDirectChat = (chatId: number) => {
      console.log(`🔔 Event listener tracking directChatId: ${chatId}`)
    }

    eventEmitter.on(EInternalEvents.FETCH_DIRECT_CHAT, handleFetchDirectChat)

    return () => {
      mounted = false
      eventEmitter.off(EInternalEvents.FETCH_DIRECT_CHAT, handleFetchDirectChat)
    }
  }, [])

  // Listen for incoming calls
  useEffect(() => {
    const handleIncomingCall = () => {
      console.log('📞 Nhận cuộc gọi đến - Chờ "Hey Chat" để phản hồi')
      pendingActionRef.current = {
        type: "incoming_call" as const,
        contactName: "Người gọi",
        message: "",
      }
    }

    eventEmitter.on(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED, handleIncomingCall)

    return () => {
      eventEmitter.off(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED, handleIncomingCall)
    }
  }, [])

  // TTS function
  const speakText = async (
    text: string,
    rate?: number,
    waitForConfirmation?: boolean
  ): Promise<void> => {
    return new Promise((resolve) => {
      try {
        console.log("🔊 Phát TTS cho:", text)
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = "vi-VN"
        utterance.rate = Math.max(0.5, Math.min(2, rate ?? 1.0))
        utterance.pitch = 1.0
        utterance.volume = 1.0

        utterance.onend = () => {
          console.log("✅ Phát TTS xong hoàn toàn")
          if (waitForConfirmation) {
            console.log("⏳ Chờ xác nhận từ user...")
            setStatus('⏳ Chờ xác nhận... Nói "có" hoặc "không"')
            isWaitingForConfirmationRef.current = true

            setTimeout(() => {
              console.log("🎤 Bắt đầu ghi âm xác nhận")
              startRecordingAndSend()
            }, 500)
          } else {
            console.log("✅ Phát TTS xong - Tiếp tục wake word detection")
            setStatus(`🎧 Đang nghe "${settings?.wakeWordPhrase}"...`)
            isWaitingForConfirmationRef.current = false
            console.log("🎤 Gọi resumeWakeWordDetection() từ TTS onend")
            resumeWakeWordDetection().catch((err) => {
              console.error("❌ Lỗi tiếp tục detection từ TTS:", err)
            })
          }
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

  // Cleanup function
  const cleanup = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop())
      micStreamRef.current = null
    }
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (maxRecordingTimerRef.current) {
      clearTimeout(maxRecordingTimerRef.current)
      maxRecordingTimerRef.current = null
    }
    setIsListening(false)
  }

  // Start microphone for wake word detection
  const startMicrophoneForWakeWord = async (worker: PorcupineWorkerType) => {
    try {
      console.log("🎙️ Đang yêu cầu quyền microphone...")

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })

      micStreamRef.current = stream
      console.log("✅ Microphone stream đã được cấp")

      const audioContext = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = audioContext
      console.log("✅ AudioContext đã được khởi tạo")

      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(512, 1, 1)

      let processCount = 0
      processor.onaudioprocess = (event) => {
        lastWakeWordDetectionTimeRef.current = Date.now()

        const inputData = event.inputBuffer.getChannelData(0)

        let sum = 0
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i]
        }
        const rms = Math.sqrt(sum / inputData.length)

        if (processCount++ % 100 === 0) {
          console.log(`🎵 Audio processing... RMS: ${rms.toFixed(4)}, samples: ${inputData.length}`)
        }

        const pcm16 = new Int16Array(inputData.length)
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]))
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
        }

        try {
          worker.process(pcm16)
        } catch (err) {
          console.error("❌ Lỗi khi process audio:", err)
        }
      }

      source.connect(processor)
      processor.connect(audioContext.destination)

      setIsListening(true)
      setStatus(`🎧 Đang nghe "${settings?.wakeWordPhrase}"...`)
      console.log("✅ 🎧 Wake word detection đang hoạt động")
    } catch (err) {
      console.error("❌ Không thể truy cập microphone:", err)
      setStatus("❌ Không truy cập được mic")
      throw err
    }
  }

  // Restart wake word detection
  const restartWakeWordDetection = async () => {
    try {
      console.log("🔄 Khởi động lại detection...")
      if (workerRef.current) {
        if (audioContextRef.current && audioContextRef.current.state === "running") {
          console.log("🔄 Đóng audioContext cũ")
          await audioContextRef.current.close()
          audioContextRef.current = null
        }
        if (micStreamRef.current) {
          console.log("🔄 Dừng stream cũ")
          micStreamRef.current.getTracks().forEach((t) => t.stop())
          micStreamRef.current = null
        }

        console.log("🔄 Khởi động stream microphone mới")
        await startMicrophoneForWakeWord(workerRef.current)
        console.log("🔄 ✅ Khởi động detection thành công")
        setStatus(`🎧 Đang nghe "${settings?.wakeWordPhrase}"...`)
      } else {
        console.log("🔄 ❌ workerRef.current không tồn tại!")
      }
    } catch (err) {
      console.error("❌ Lỗi khởi động lại:", err)
    }
  }

  // Resume wake word detection (tiếp tục lắng nghe mà không khởi động lại, dùng khi stream vẫn còn chạy)
  const resumeWakeWordDetection = async () => {
    try {
      console.log("▶️ Tiếp tục lắng nghe wake word...")
      if (workerRef.current && audioContextRef.current && micStreamRef.current) {
        console.log("▶️ ✅ Stream vẫn còn hoạt động, tiếp tục lắng nghe")
        setStatus(`🎧 Đang nghe "${settings?.wakeWordPhrase}"...`)
      } else {
        console.log("▶️ ⚠️ Stream không hoạt động, khởi động lại...")
        await restartWakeWordDetection()
      }
    } catch (err) {
      console.error("❌ Lỗi tiếp tục:", err)
    }
  }

  // Handle pending action confirmation
  const handlePendingActionConfirmation = async (transcript: string): Promise<boolean> => {
    if (!pendingActionRef.current) {
      console.log("⚠️ handlePendingActionConfirmation: Không có pending action")
      return false
    }

    const { isConfirmed, isRejected } = isConfirmation(transcript)
    const selectionIndex = parseSelectionIndex(transcript.toLowerCase())

    const pendingAction = pendingActionRef.current
    const { contactName, message, content, contactId, directChatId, groupId, chatType } =
      pendingAction
    const rate = settings?.speechRate ?? 1.0
    // Backend sends recipientUserId (the actual userId of recipient)
    const recipientUserId =
      (pendingAction as any).recipientUserId || (pendingAction as any).contactUserId
    // Backend sends 'content' field, frontend may have 'message' field
    const messageContent = content || message || ""
    // Backend sends 'targetName', frontend may have 'contactName'
    const finalContactName = contactName || (pendingAction as any).targetName || ""

    console.log("🔍 handlePendingActionConfirmation START:", {
      transcript,
      isConfirmed,
      isRejected,
      pendingActionType: pendingAction.type,
      contactId,
      recipientUserId,
      contactName,
      targetName: (pendingAction as any).targetName,
      finalContactName,
      message,
      content,
      messageContent,
      stickerId: (pendingAction as any).stickerId,
      stickerDescription: (pendingAction as any).stickerDescription,
      chatType,
      directChatId,
      groupId,
      fullPendingAction: pendingAction,
    })

    // Handle incoming call
    if (pendingAction.type === "incoming_call") {
      console.log("📞 Cuộc gọi đến được xử lý bởi backend")
      return true
    }

    // Handle attachment selection
    if (pendingActionRef.current?.type === "choose_attachment" && selectionIndex) {
      const pendingChoose = pendingActionRef.current
      const candidates = pendingChoose.attachmentCandidates || []
      if (selectionIndex >= 1 && selectionIndex <= candidates.length) {
        const chosen = candidates.find((c) => c.index === selectionIndex)
        if (chosen) {
          pendingActionRef.current = {
            type: pendingChoose.originalActionType as PendingAction["type"],
            contactName: pendingChoose.contactName,
            message: "",
            contactId: pendingChoose.contactId,
            directChatId: pendingChoose.directChatId,
            groupId: pendingChoose.groupId,
            chatType: pendingChoose.chatType,
            lastBotMessage: `Bạn muốn gửi ${chosen.type.startsWith("image") ? "ảnh" : "file"} "${chosen.name}" cho ${pendingChoose.contactName}, đúng không?`,
            selectedAttachmentIndex: selectionIndex,
            attachmentKind: pendingChoose.attachmentKind,
            attachmentCandidates: candidates,
            originalActionType: pendingChoose.originalActionType as any,
          }
          isWaitingForConfirmationRef.current = true
          await speakText(
            `Bạn muốn gửi ${chosen.type.startsWith("image") ? "ảnh" : "file"} "${chosen.name}" cho ${pendingChoose.contactName}, đúng không?`,
            settings?.speechRate ?? 1.0,
            true
          )
          return true
        }
      }
      await speakText(
        "Số bạn chọn không hợp lệ. Vui lòng nói lại.",
        settings?.speechRate ?? 1.0,
        true
      )
      return true
    }

    // Handle unclear response
    if (!isConfirmed && !isRejected) {
      console.log("⚠️ Người dùng nói cái khác - backend sẽ hỏi lại, giữ lại pending state")
      console.log("⚠️ isConfirmed:", isConfirmed, "isRejected:", isRejected)
      return true
    }

    const pendingActionForHandlers = pendingActionRef.current

    console.log(
      "📍 Preparing to handle action, isConfirmed:",
      isConfirmed,
      "isRejected:",
      isRejected
    )

    // Handle confirmations for different action types
    if (isConfirmed) {
      // Send message
      if (pendingActionForHandlers?.type === "send_message") {
        // Backend sends recipientUserId (the actual recipient's userId for direct chat)
        const finalRecipientId = recipientUserId || contactId

        console.log("🔍 send_message validation:", {
          recipientUserId,
          contactId,
          finalRecipientId,
          chatType,
          messageContent,
          hasContent: !!messageContent,
        })

        if (!finalRecipientId && chatType !== "group") {
          console.error("❌ Không tìm thấy recipientUserId để gửi message")
          await speakText("Không tìm thấy thông tin người nhận", rate, false)
          return false
        }

        if (!messageContent || messageContent.trim() === "") {
          console.error("❌ Nội dung tin nhắn trống")
          await speakText("Không có nội dung tin nhắn để gửi", rate, false)
          return false
        }

        await handleSendMessage({
          contactId: finalRecipientId,
          contactName: finalContactName,
          chatType: chatType as any,
          directChatId,
          groupId,
          message: messageContent,
          rate,
          speakText,
          restartWakeWordDetection,
        })
        return false
      }

      // Send sticker
      console.log("🔍 Checking send_sticker conditions:", {
        type: pendingAction.type,
        typeMatch: pendingAction.type === "send_sticker",
        isConfirmed,
        stickerId: pendingAction.stickerId,
        hasStickerIdFromPending: !!pendingAction.stickerId,
        allConditions:
          pendingAction.type === "send_sticker" && isConfirmed && pendingAction.stickerId,
      })

      if (pendingAction.type === "send_sticker" && isConfirmed && pendingAction.stickerId) {
        // Backend sends recipientUserId (the actual recipient's userId for direct chat)
        const finalRecipientId = recipientUserId || contactId

        console.log("✅ Điều kiện send_sticker thỏa mãn - Gọi handleSendSticker", {
          contactId,
          recipientUserId,
          finalRecipientId,
          contactUserId: (pendingAction as any).contactUserId,
          targetId: (pendingAction as any).targetId,
          chatType,
          directChatId,
          groupId,
          stickerId: pendingAction.stickerId,
          fullPending: pendingAction,
        })

        if (!finalRecipientId && chatType !== "group") {
          console.error("❌ Không tìm thấy recipientUserId để gửi sticker")
          await speakText("Không tìm thấy thông tin người nhận", rate, false)
          return false
        }

        await handleSendSticker({
          contactId: finalRecipientId,
          contactName: finalContactName,
          chatType: chatType as any,
          directChatId,
          groupId,
          stickerId: pendingAction.stickerId,
          stickerDescription: pendingAction.stickerDescription,
          rate,
          speakText,
          restartWakeWordDetection,
        })
        return true
      }

      // Send emoji
      if (pendingAction.type === "send_emoji" && isConfirmed && pendingAction.emoji) {
        // Backend sends recipientUserId (the actual recipient's userId for direct chat)
        const finalRecipientId = recipientUserId || contactId

        console.log("🔍 send_emoji validation:", {
          recipientUserId,
          contactId,
          finalRecipientId,
          chatType,
          emoji: pendingAction.emoji,
        })

        if (!finalRecipientId && chatType !== "group") {
          console.error("❌ Không tìm thấy recipientUserId để gửi emoji")
          await speakText("Không tìm thấy thông tin người nhận", rate, false)
          return false
        }

        await handleSendEmoji({
          contactId: finalRecipientId,
          contactName: finalContactName,
          chatType: chatType as any,
          directChatId,
          groupId,
          emoji: pendingAction.emoji,
          emojiDescription: pendingAction.emojiDescription,
          rate,
          speakText,
          restartWakeWordDetection,
        })
        return false
      }

      // Create group
      if (
        pendingAction.type === "create_group" &&
        isConfirmed &&
        pendingAction.groupName &&
        pendingAction.memberIds
      ) {
        await handleCreateGroup({
          groupName: pendingAction.groupName,
          memberIds: pendingAction.memberIds,
          memberNames: pendingAction.memberNames,
          rate,
          speakText,
          restartWakeWordDetection,
          router,
        })
        return false
      }

      // Make call
      if (pendingAction.type === "make_call" && isConfirmed) {
        const finalRecipientId = recipientUserId || contactId

        console.log("🔍 make_call validation:", {
          recipientUserId,
          contactId,
          finalRecipientId,
          chatType,
          directChatId,
          groupId,
          isVideoCall: (pendingAction as any).isVideo,
        })

        // Kiểm tra: nếu là direct call cần recipientId, nếu là group call cần groupId
        if (chatType === "direct" && !finalRecipientId) {
          console.error("❌ Không tìm thấy recipientUserId để gọi trực tiếp")
          await speakText("Không tìm thấy thông tin người nhận", rate, false)
          return false
        }

        if (chatType === "group" && !groupId) {
          console.error("❌ Không tìm thấy groupId để gọi nhóm")
          await speakText("Không tìm thấy thông tin nhóm", rate, false)
          return false
        }

        await handleMakeCall({
          contactId: finalRecipientId,
          contactName: finalContactName,
          chatType: chatType as any,
          directChatId,
          groupId,
          isVideoCall: (pendingAction as any).isVideo,
          rate,
          speakText,
          restartWakeWordDetection,
        })
        return false
      }

      // Send voice message
      if (pendingAction.type === "send_voice_message" && isConfirmed) {
        console.log("🎤 send_voice_message validation:", {
          chatType,
          directChatId,
          groupId,
          audioBase64: !!pendingAction.audioBase64,
          hasAudioData: !!pendingAction.audioBase64,
        })

        if (!pendingAction.audioBase64) {
          console.error("❌ Không có dữ liệu âm thanh để gửi")
          await speakText("Không có dữ liệu âm thanh để gửi", rate, false)
          return false
        }

        if (chatType === "direct" && !directChatId) {
          console.error("❌ Không tìm thấy directChatId để gửi voice message")
          await speakText("Không tìm thấy thông tin cuộc trò chuyện", rate, false)
          return false
        }

        if (chatType === "group" && !groupId) {
          console.error("❌ Không tìm thấy groupId để gửi voice message")
          await speakText("Không tìm thấy thông tin nhóm", rate, false)
          return false
        }

        await handleVoiceMessage({
          pendingAction: pendingActionForHandlers as any,
          pendingActionRef,
          isWaitingForConfirmationRef,
          rate,
          speakText,
          restartWakeWordDetection,
        })
        return false
      }

      // Invite to group
      if (pendingAction.type === "invite_to_group" && isConfirmed) {
        console.log("👥 [CONFIRMATION] Handling invite_to_group confirmation:", {
          groupId: pendingAction.groupId || (pendingAction as any).targetId,
          memberIds: pendingAction.memberIds || (pendingAction as any).memberIds,
          memberNames: pendingAction.memberNames,
          groupName: pendingAction.groupName || (pendingAction as any).targetName,
        })

        // Extract data từ pending action
        const groupId = pendingAction.groupId || (pendingAction as any).targetId
        const memberIds = pendingAction.memberIds || []
        const memberNames = pendingAction.memberNames || []
        const groupName = pendingAction.groupName || (pendingAction as any).targetName || "nhóm"

        if (!groupId || !memberIds.length) {
          console.error("❌ Không đủ thông tin để mời vào nhóm", { groupId, memberIds })
          await speakText("Không tìm thấy thông tin để mời vào nhóm.", rate, false)
          return false
        }

        try {
          console.log("🔄 [CONFIRMATION] Calling groupMemberService.addMembersToGroupChat...")
          const result = await groupMemberService.addMembersToGroupChat(groupId, memberIds)
          console.log("✅ [CONFIRMATION] API Response:", result)

          const memberNamesStr =
            memberNames.length > 0 ? memberNames.join(", ") : `${memberIds.length} thành viên`
          const successMsg = `Đã mời ${memberNamesStr} vào nhóm ${groupName} thành công.`
          console.log("🎤 [CONFIRMATION] Speaking:", successMsg)

          await speakText(successMsg, rate, false)
          console.log("✅ [CONFIRMATION] Invite to group completed")
        } catch (err) {
          console.error("❌ [CONFIRMATION] Error inviting to group:", err)
          await speakText("Lỗi khi mời vào nhóm. Vui lòng thử lại.", rate, false)
        }
        return true
      }

      // TODO: Add more action handlers (send_image, send_document, etc.)
      // These would follow similar patterns
    }

    // Handle rejection
    if (isRejected) {
      const { getActionName } = await import("../utils/confirmation")
      const actionType = getActionName(pendingAction.type)
      console.log(`❌ User từ chối - hủy ${actionType}`)
      await speakText(`Đã hủy ${actionType}.`, rate, false)
      setTimeout(() => restartWakeWordDetection(), 500)
      return false
    }

    return true
  }

  // Main recording function
  const startRecordingAndSend = async () => {
    console.log(
      "📍 startRecordingAndSend called, isWaitingForConfirmation:",
      isWaitingForConfirmationRef.current
    )

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log("⚠️ Đang recording - Dừng recording cũ để bắt đầu mới")
      mediaRecorderRef.current.stop()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
      if (maxRecordingTimerRef.current) {
        clearTimeout(maxRecordingTimerRef.current)
        maxRecordingTimerRef.current = null
      }
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    if (!settings) {
      console.log("⚠️ Skip: chưa có settings")
      return
    }

    try {
      console.log("🔴 Bắt đầu ghi âm...")
      setIsRecording(true)

      if (audioContextRef.current && !isWaitingForConfirmationRef.current) {
        await audioContextRef.current.suspend()
        console.log("⏸️ Đã tạm dừng Porcupine")
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })

      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })
      mediaRecorderRef.current = mediaRecorder
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" })
        console.log("📦 mediaRecorder.onstop called, blob size:", blob.size)

        if (blob.size === 0) {
          console.warn("⚠️ Audio blob rỗng!")
        }

        const base64 = await blobToBase64(blob)
        setStatus("⏳ Đang xử lý lệnh...")

        try {
          const audioData = base64.split(",")[1]
          console.log("📤 Gửi audio data, length:", audioData.length)

          if (!isWaitingForConfirmationRef.current) {
            console.log("💾 Lưu audio vào lastAudioDataRef")
            lastAudioDataRef.current = audioData
          }

          const response = await sendVoiceCommand(audioData)
          console.log("📥 Response từ backend:", response)
          console.log("📥 Response.pending:", (response as any).pending)
          console.log("📥 Response.needsConfirmation:", response.needsConfirmation)
          console.log("📥 Response.transcript:", response.transcript)

          // Store pending action before backend might clear it
          const hadPendingAction = pendingActionRef.current
          const wasWaitingForConfirmation = isWaitingForConfirmationRef.current
          console.log("📥 Current state:", {
            hadPendingAction: !!hadPendingAction,
            pendingActionType: hadPendingAction?.type,
            wasWaitingForConfirmation,
            isWaitingForConfirmationRefCurrent: isWaitingForConfirmationRef.current,
          })

          console.log("🔍 Kiểm tra confirmation:", {
            hadPendingAction: !!hadPendingAction,
            wasWaitingForConfirmation,
            needsConfirmation: response.needsConfirmation,
            transcript: response.transcript,
          })

          // Handle pending action confirmation FIRST (before updating pending state)
          // If we were waiting for confirmation, always handle it regardless of backend response
          if (hadPendingAction && wasWaitingForConfirmation) {
            console.log("📋 Đang chờ xác nhận, xử lý xác nhận từ user...")
            const confirmationHandled = await handlePendingActionConfirmation(
              response.transcript || ""
            )

            if (confirmationHandled) {
              console.log("✅ Confirmation handled successfully")
              // Clear pending after successful handling
              pendingActionRef.current = null
              isWaitingForConfirmationRef.current = false
              isWakeWordProcessingRef.current = false // 🔓 Unlock - có thể nhận wake word tiếp

              // ⚠️ DON'T return yet! Backend may send clientAction after confirmation
              // Continue to check for clientAction below
            } else {
              console.log("⚠️ Confirmation not handled - continuing with normal flow")
            }
          }

          // Update pending state from backend response AFTER handling
          if ((response as any).pending !== undefined) {
            if ((response as any).pending === null) {
              console.log("✅ Backend cleared pending")
              pendingActionRef.current = null
              isWaitingForConfirmationRef.current = false
            } else {
              console.log("📝 Backend updated pending:", (response as any).pending)
              // ✅ Thêm audioBase64 từ lastAudioDataRef vào pending action nếu là send_voice_message
              const pendingFromBackend = (response as any).pending
              if (pendingFromBackend?.type === "send_voice_message" && lastAudioDataRef.current) {
                console.log("🎤 Thêm audioBase64 vào send_voice_message pending action")
                pendingFromBackend.audioBase64 = lastAudioDataRef.current
              }
              pendingActionRef.current = pendingFromBackend
            }
          } // Handle clientAction from backend
          if ((response as any).clientAction) {
            console.log("📋 [MAIN] clientAction detected, calling handleClientAction...")
            const handled = await handleClientAction((response as any).clientAction, {
              speakText,
              restartWakeWordDetection,
              router,
              settings: { speechRate: settings.speechRate },
              pendingActionRef,
              isWaitingForConfirmationRef,
            })
            if (handled) {
              console.log("✅ [MAIN] clientAction handled successfully, unlocking wake word...")
              isWakeWordProcessingRef.current = false // 🔓 Unlock after clientAction
              return
            }
          }

          // Handle response text
          if (response.response) {
            console.log("🤖 Trợ lý:", response.response)
            setStatus(`💬 ${response.response.substring(0, 50)}...`)

            const isUserTranscript =
              response.response === response.transcript ||
              response.response.includes(response.transcript || "")

            if (!isUserTranscript) {
              if (response.needsConfirmation) {
                isWaitingForConfirmationRef.current = true
                await speakText(response.response, settings.speechRate, true)
              } else {
                await speakText(response.response, settings.speechRate, false)
                setTimeout(() => restartWakeWordDetection(), 500)
              }
            } else {
              setTimeout(() => restartWakeWordDetection(), 500)
            }
          } else {
            setTimeout(() => {
              if (settings.voiceActivationMode === "WAKE_WORD") {
                restartWakeWordDetection()
              }
            }, 2000)
          }
        } catch (err: unknown) {
          const error = err as Error
          console.error("❌ Lỗi gọi API:", error)
          setStatus(`❌ ${error.message}`)
          await speakText(`Có lỗi xảy ra: ${error.message}`, settings.speechRate)
          isWakeWordProcessingRef.current = false // 🔓 Unlock on error
          setTimeout(() => {
            if (settings.voiceActivationMode === "WAKE_WORD") {
              restartWakeWordDetection()
            }
          }, 3000)
        }

        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        setIsRecording(false)

        if (!isWaitingForConfirmationRef.current) {
          isWakeWordProcessingRef.current = false // 🔓 Unlock nếu ko waiting confirmation
          await restartWakeWordDetection()
        }
      }

      // Setup VAD
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.3
      source.connect(analyser)

      const isConfirmationMode = isWaitingForConfirmationRef.current
      const vadState = createVADState()
      const thresholds = getVADThresholds(isConfirmationMode)

      const checkAudioLevel = () => {
        if (mediaRecorder.state !== "recording") {
          console.log("⚠️ mediaRecorder không còn recording state")
          audioContext.close()
          return
        }

        const vadResult = calculateSpeechProbability(
          { isConfirmationMode, audioContext, analyser },
          vadState,
          thresholds
        )

        const now = Date.now()

        // Grace period
        if (now - vadState.recordingStartTime < thresholds.STARTUP_GRACE_PERIOD) {
          if (
            Math.floor((now - vadState.recordingStartTime) / 500) !==
            Math.floor((now - vadState.recordingStartTime - 50) / 500)
          ) {
            console.log(`⏳ Grace period: ${now - vadState.recordingStartTime}ms`)
          }
          silenceTimerRef.current = setTimeout(checkAudioLevel, 50)
          return
        }

        // Update VAD state
        updateVADState(vadState, vadResult.isSpeech, thresholds)

        // Log speech detection
        if (vadResult.isSpeech && !vadState.hasSpoken) {
          console.log(`🗣️ Phát hiện giọng nói (năng lượng: ${vadResult.energy.toFixed(1)})`)
          setStatus("🎤 Đang nghe...")
        }

        // Check if should stop
        const stopResult = shouldStopRecording(vadState, thresholds)
        if (stopResult.shouldStop) {
          console.log(`✅ Dừng ghi âm: ${stopResult.reason}`)
          mediaRecorder.stop()
          audioContext.close()
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }
          if (maxRecordingTimerRef.current) {
            clearTimeout(maxRecordingTimerRef.current)
            maxRecordingTimerRef.current = null
          }
          return
        }

        silenceTimerRef.current = setTimeout(checkAudioLevel, 50)
      }

      mediaRecorder.start()
      setStatus("🔴 Đang chờ bạn nói...")
      console.log("🎙️ Bắt đầu ghi âm với VAD")
      checkAudioLevel()

      maxRecordingTimerRef.current = setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          console.log(`⏱️ ĐẠT TIMEOUT - Dừng ghi âm`)
          mediaRecorder.stop()
          audioContext.close()
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }
        }
      }, thresholds.MAX_RECORDING_TIME)
    } catch (err: unknown) {
      const error = err as Error
      console.error("❌ Lỗi mic:", error)
      setStatus("❌ Không truy cập được mic")
      setIsRecording(false)

      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume()
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }

      setTimeout(() => {
        restartWakeWordDetection()
      }, 1000)
    }
  }

  // Initialize Porcupine wake word detection
  useEffect(() => {
    if (!settings) return

    if (settings.voiceActivationMode !== "WAKE_WORD" || !settings.sttEnabled) {
      cleanup()
      setStatus("💤 Trợ lý tắt (chế độ giữ nút)")
      return
    }

    const initPorcupine = async () => {
      try {
        setStatus("⏳ Đang tải wake word model...")

        const accessKey = process.env.NEXT_PUBLIC_PICOVOICE_ACCESS_KEY || "YOUR_ACCESS_KEY"
        if (!accessKey || accessKey === "YOUR_ACCESS_KEY") {
          throw new Error("Thiếu NEXT_PUBLIC_PICOVOICE_ACCESS_KEY")
        }

        const keywords = [
          {
            publicPath: "/models/hey-chat_en_wasm_v3_0_0.ppn",
            label: "hey-chat",
            sensitivity: 0.9,
          },
        ]

        console.log("⏳ Tạo Porcupine worker...")

        const worker = await PorcupineWorker.create(
          accessKey,
          keywords,
          async (detection: PorcupineDetection) => {
            lastWakeWordDetectionTimeRef.current = Date.now()

            console.log("🎤🎤🎤 WAKE WORD DETECTED! 🎤🎤🎤", detection)

            // 🔒 Nếu đang xử lý lệnh từ wake word trước, bỏ qua
            if (isWakeWordProcessingRef.current) {
              console.log("🔒 Đang xử lý lệnh, bỏ qua detection")
              return
            }

            // Handle incoming call
            if (
              pendingActionRef.current?.type === "incoming_call" &&
              !isWaitingForConfirmationRef.current
            ) {
              console.log("📞 Có incoming call - ghi âm phản hồi")
              setStatus(`✨ Nghe thấy "${settings.wakeWordPhrase}"!`)
              await speakText("Bạn cần tôi làm gì?", settings.speechRate, false)
              isWaitingForConfirmationRef.current = true
              isWakeWordProcessingRef.current = true // 🔒 Lock
              setTimeout(() => {
                console.log("📞 Bắt đầu ghi âm sau 500ms delay")
                startRecordingAndSend()
              }, 500)
              return
            }

            // Handle confirmation mode
            if (isWaitingForConfirmationRef.current) {
              console.log("📝 Khi chờ xác nhận - ghi âm câu trả lời")
              startRecordingAndSend()
              return
            }

            // Normal flow
            isWakeWordProcessingRef.current = true // 🔒 Lock khi detect
            setStatus(`✨ Nghe thấy "${settings.wakeWordPhrase}"!`)
            await speakText("Bạn cần tôi làm gì?", settings.speechRate, false)
            setTimeout(() => {
              console.log("🎙️ Bắt đầu ghi âm sau 800ms delay")
              startRecordingAndSend()
            }, 800)
          },
          { publicPath: "/models/porcupine_params.pv" }
        )

        console.log("✅ Porcupine worker tạo thành công")
        workerRef.current = worker

        await startMicrophoneForWakeWord(worker)
      } catch (err: unknown) {
        const error = err as Error
        console.error("❌ Khởi động Porcupine thất bại:", error)
        setStatus(`❌ Lỗi: ${error.message}`)
      }
    }

    initPorcupine()

    return () => {
      cleanup()
    }
  }, [settings?.voiceActivationMode, settings?.sttEnabled, settings?.wakeWordPhrase])

  // Monitor wake word detection heartbeat
  useEffect(() => {
    if (detectionHeartbeatRef.current) {
      clearInterval(detectionHeartbeatRef.current)
    }

    detectionHeartbeatRef.current = setInterval(() => {
      const now = Date.now()
      const timeSinceLastDetection = now - lastWakeWordDetectionTimeRef.current

      const DETECTION_TIMEOUT = 30000
      if (timeSinceLastDetection > DETECTION_TIMEOUT && isListening) {
        console.warn(`⚠️ Wake word detection stuck - Restarting...`)
        setStatus("🔄 Restarting wake word detection...")
        restartWakeWordDetection().catch((err) => {
          console.error("❌ Failed to restart detection:", err)
          setStatus("❌ Failed to restart detection")
        })
        lastWakeWordDetectionTimeRef.current = now
      }
    }, 10000)

    return () => {
      if (detectionHeartbeatRef.current) {
        clearInterval(detectionHeartbeatRef.current)
      }
    }
  }, [isListening])

  // Keyboard shortcut: Ctrl+V to reset
  useEffect(() => {
    const resetMic = async () => {
      console.log("⌨️ Ctrl+V pressed - Reset mic")

      pendingActionRef.current = null
      isWaitingForConfirmationRef.current = false
      lastAudioDataRef.current = null

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
      if (maxRecordingTimerRef.current) {
        clearTimeout(maxRecordingTimerRef.current)
        maxRecordingTimerRef.current = null
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }

      setIsRecording(false)
      setStatus("🔄 Đang reset mic...")

      try {
        // Reset Redis pending on backend
        console.log(" Gọi API reset-pending trên backend...")
        await pushNotificationService.resetVoiceAssistantPending()
        console.log(" Redis pending đã được reset trên backend")
      } catch (err) {
        console.error(" Lỗi gọi API reset-pending:", err)
      }

      try {
        if (workerRef.current) {
          if (audioContextRef.current && audioContextRef.current.state === "running") {
            await audioContextRef.current.close()
            audioContextRef.current = null
          }
          if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach((t) => t.stop())
            micStreamRef.current = null
          }

          await startMicrophoneForWakeWord(workerRef.current)
        }
      } catch (err) {
        console.error("❌ Lỗi khi reset detection:", err)
        setStatus("❌ Lỗi khi reset mic")
      }
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        e.preventDefault()
        resetMic().catch((err) => console.error("❌ Lỗi reset mic:", err))
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => {
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [settings?.wakeWordPhrase])

  // Stop recording function
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setIsRecording(false)
  }

  return {
    status,
    isListening,
    isRecording,
    settings,
    startRecordingAndSend,
    stopRecording,
  }
}
