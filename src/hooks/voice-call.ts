import { useEffect, useRef, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import {
  resetCallSession,
  setCallSession,
  updateCallSession,
  resetIncomingCallSession,
  setIncomingCallSession,
} from "@/redux/call/layout.slice"
import { toaster } from "@/utils/toaster"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { EHangupReason, EMessageTypeAllTypes, EVoiceCallStatus } from "@/utils/enums"
import type {
  TActionSendIcon,
  TActiveVoiceCallSession,
  TUnknownFunction,
} from "@/utils/types/global"
import type { TCallRequestEmitRes } from "@/utils/types/socket"
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng"
import AgoraRTM from "agora-rtm-sdk" // v1.5.1
import { chattingService } from "@/services/chatting.service"

const APP_ID = "bf206a5c93854a8591320eb085bfd71f"

type RtmCallMessage =
  | {
      type: "CALL_REQUEST"
      roomId: string
      isVideoCall: boolean
      chatId: number
      isGroupCall: boolean
      callerUserId: number
    }
  | { type: "CALL_REJECTED" }
  | { type: "CALL_HUNGUP" }

let rtmClient: any = null
let rtcClient: IAgoraRTCClient | null = null
const channelCache = new Map<string, any>()

const getInviteChannelName = (userId: string | number) => `invite_${userId}`

export function useAgoraCall() {
  const dispatch = useAppDispatch()
  const { callSession, incomingCallSession } = useAppSelector((state) => state["voice-call"])
  const currentUser = useAppSelector((state) => state.user.user)

  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null)
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null)

  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const isJoiningRef = useRef(false)
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null) // ✅ Timeout timer ref
  const callSessionRef = useRef<TActiveVoiceCallSession | null>(null) // ✅ Track current callSession to avoid closure stale values

  // XỬ LÝ CẢ TEXT (Web) & RAW (Mobile)
  const handleRtmMessage = (message: any, peerId: string) => {
    console.log("check message >>>>", message)

    let text: string

    try {
      // Mobile → Web: RAW
      if (message.messageType === "RAW" && message.rawMessage) {
        const byteArray = Object.values(message.rawMessage) as number[]
        text = new TextDecoder().decode(new Uint8Array(byteArray))
        console.log("Decoded RAW from Mobile:", text)
      }
      // Web → Web: TEXT
      else if (message.text) {
        text = message.text
        console.log("Received TEXT from Web:", text)
      }
      // Unknown
      else {
        console.warn("Unknown RTM format:", message)
        return
      }

      const trimmed = text.trim()
      if (!trimmed || ["undefined", "null", ""].includes(trimmed)) {
        console.warn("Ignored invalid RTM from", peerId, ":", trimmed)
        return
      }

      const data: RtmCallMessage = JSON.parse(trimmed)
      console.log("RTM parsed from", peerId, ":", data)

      switch (data.type) {
        case "CALL_REQUEST":
          if (!data.isGroupCall && (callSession || incomingCallSession)) {
            console.log("User busy, rejecting call.")
            publishRtmMessage(peerId, { type: "CALL_REJECTED" })
            return
          }

          if (data.isGroupCall && callSession?.id === data.roomId) {
            console.log("Already in group call.")
            return
          }

          const session: TActiveVoiceCallSession = {
            id: data.roomId,
            callerUserId: data.callerUserId || Number(peerId),
            calleeUserId: currentUser!.id,
            directChatId: data.chatId,
            isVideoCall: data.isVideoCall,
            status: EVoiceCallStatus.RINGING,
            isGroupCall: data.isGroupCall,
          }
          dispatch(setIncomingCallSession(session))
          eventEmitter.emit(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED)
          break

        case "CALL_REJECTED":
          toaster.info("Cuộc gọi bị từ chối")
          eventEmitter.emit(EInternalEvents.CALL_REJECTED_BY_PEER, {
            directChatId: callSession?.directChatId,
          })
          cleanup()
          break

        case "CALL_HUNGUP":
          toaster.info("Cuộc gọi đã kết thúc")
          eventEmitter.emit(EInternalEvents.CALL_CANCELLED_BY_PEER, {
            directChatId: callSession?.directChatId,
          })
          cleanup()
          break
      }
    } catch (error) {
      console.error("RTM decode/parse error:", error, "Raw:", message)
    }
  }

  // ✅ SYNC callSessionRef với Redux state để avoid closure stale values
  useEffect(() => {
    callSessionRef.current = callSession
    console.log("📞 🔄 SYNC callSessionRef:", callSession)
  }, [callSession])

  // KHỞI TẠO RTM (Web v1) – DÙNG UID DUY NHẤT
  useEffect(() => {
    if (!currentUser?.id || rtmClient) return

    const uid = `web_${currentUser.id}_${Date.now()}` // Tránh trùng với Mobile

    const initRtm = async () => {
      try {
        const client = AgoraRTM.createInstance(APP_ID)
        rtmClient = client

        await client.login({ uid, token: undefined })

        const myChannelName = getInviteChannelName(currentUser.id)
        let channel = channelCache.get(myChannelName)
        if (!channel) {
          channel = client.createChannel(myChannelName)
          channelCache.set(myChannelName, channel)
        }
        await channel.join()

        channel.on("ChannelMessage", (message: any, memberId: string) => {
          handleRtmMessage(message, memberId)
        })
      } catch (error) {
        console.error("RTM v1 init failed:", error)
      }
    }

    initRtm()

    return () => {
      channelCache.forEach((ch) => ch.leave().catch(() => {}))
      channelCache.clear()
      rtmClient?.logout().catch(() => {})
      rtmClient = null
    }
  }, [currentUser?.id])

  // GỬI RTM (Web v1) – DÙNG { text: ... }
  const publishRtmMessage = async (targetUserId: string, message: RtmCallMessage) => {
    if (!rtmClient) return

    const channelName = getInviteChannelName(targetUserId)
    let channel = channelCache.get(channelName)

    if (!channel) {
      channel = rtmClient.createChannel(channelName)
      channelCache.set(channelName, channel)
      try {
        await channel.join()
        console.log(`Joined channel: ${channelName}`)
      } catch (error) {
        console.error("Join failed:", error)
        return
      }
    }

    try {
      const payload = JSON.stringify(message)
      if (!payload || payload === "undefined") {
        console.error("BLOCKED invalid payload:", message)
        return
      }

      await channel.sendMessage({ text: payload })
      console.log("RTM v1 sent to", channelName, ":", payload)
    } catch (error) {
      console.error("Send failed:", error)
    }
  }

  // GỬI ICON ĐIỆN THOẠI
  function sendPhoneIconMessage(directChatId: number, receiverId: number, action: TActionSendIcon) {
    const content = action === "start" ? "Call started" : "Call ended"

    const msgPayload = {
      content,
      receiverId,
      token: chattingService.getMessageToken(),
      timestamp: new Date(),
    }

    chattingService.sendMessage(EMessageTypeAllTypes.TEXT, msgPayload, (data) => {
      if ("success" in data && data.success) {
        console.log(`Sent phone icon (${action})`)
        chattingService.recursiveSendingQueueMessages()
      } else if ("isError" in data && data.isError) {
        console.error(`Failed to send icon (${action}):`, data.message)
      }
    })
  }

  // JOIN RTC
  const joinRtcChannel = async (roomId: string, isVideo: boolean): Promise<boolean> => {
    console.log("🔍 joinRtcChannel called")
    console.log("  - currentUser:", currentUser)
    console.log("  - currentUser?.id:", currentUser?.id)
    console.log("  - typeof currentUser?.id:", typeof currentUser?.id)

    const uid = currentUser?.id
    console.log("  - uid after assignment:", uid)

    if (!uid) {
      console.error("❌ UID is falsy:", uid)
      // KHÔNG return, để xem Agora SDK nhận được gì
    }
    if (isJoiningRef.current || rtcClient) return false
    isJoiningRef.current = true

    try {
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
      rtcClient = client

      client.on("user-joined", (user) => {
        console.log("✅ Web detected user:", user.uid)
        dispatch(updateCallSession({ status: EVoiceCallStatus.CONNECTED }))
      })

      client.on("user-left", () => {
        setRemoteUsers((prev) => prev.filter((u) => !u.hasAudio && !u.hasVideo))
      })

      client.on("user-published", async (user, mediaType) => {
        console.log("user sub", user)
        console.log("📡 User published:", user.uid, mediaType)
        await client.subscribe(user, mediaType)
        if (mediaType === "audio") user.audioTrack?.play()

        setRemoteUsers((prev) => {
          const index = prev.findIndex((u) => u.uid === user.uid)
          return index > -1
            ? [...prev.slice(0, index), user, ...prev.slice(index + 1)]
            : [...prev, user]
        })
      })
      console.log("check id>>>", currentUser)
      await client.join(APP_ID, roomId, null, currentUser!.id)

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
      localAudioTrackRef.current = audioTrack
      setIsMicEnabled(true)

      const tracks: (IMicrophoneAudioTrack | ICameraVideoTrack)[] = [audioTrack]

      if (isVideo) {
        const videoTrack = await AgoraRTC.createCameraVideoTrack()
        localVideoTrackRef.current = videoTrack
        tracks.push(videoTrack)
        setIsVideoEnabled(true)
      }

      await client.publish(tracks)
      dispatch(updateCallSession({ status: EVoiceCallStatus.CONNECTED }))
      return true
    } catch (error) {
      console.error("RTC join failed:", error)
      toaster.error("Không thể kết nối cuộc gọi.")
      await cleanup()
      return false
    } finally {
      isJoiningRef.current = false
    }
  }

  // ✅ TỰ ĐỘNG HỦY CUỘC GỌI SAU TIMEOUT
  const startCallTimeout = (timeoutMs: number = 30000) => {
    // 30 giây mặc định
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current)
    }

    console.log(
      `📞 🕐 BẮT ĐẦU TIMEOUT: ${timeoutMs}ms (${Math.round(timeoutMs / 1000)}s), callSessionRef:`,
      callSessionRef.current
    )

    // ✅ Log kiểm tra trạng thái mỗi 10 giây
    const checkIntervalId = setInterval(() => {
      const elapsed = Math.floor(Date.now() / 1000) % 60
      console.log(
        `📞 ✅ KIỂM TRA TIMEOUT (elapsed ~${elapsed}s): callSessionRef?.status = ${callSessionRef.current?.status}`,
        { callSession: callSessionRef.current }
      )
    }, 10000)

    callTimeoutRef.current = setTimeout(() => {
      clearInterval(checkIntervalId)
      console.log(
        `📞 ⏰ TIMEOUT FIRED SAU ${timeoutMs}ms, callSessionRef status: ${callSessionRef.current?.status}`
      )
      console.log(
        `📞 Check: callSessionRef exists? ${!!callSessionRef.current}`,
        callSessionRef.current
      )
      console.log(
        `📞 Check: status === REQUESTING? ${callSessionRef.current?.status === EVoiceCallStatus.REQUESTING}`
      )

      if (callSessionRef.current && callSessionRef.current.status === EVoiceCallStatus.REQUESTING) {
        console.log("📞 ✅ CONDITION TRUE - gọi hangupCall(EHangupReason.NORMAL)")
        toaster.info("Cuộc gọi hết thời gian chờ. Tự động hủy bỏ.")
        hangupCall(EHangupReason.NORMAL) // ✅ Sử dụng NORMAL reason cho timeout
      } else {
        console.log("📞 ❌ CONDITION FALSE - không tắt cuộc gọi")
        console.log(`📞   - callSessionRef exists: ${!!callSessionRef.current}`)
        console.log(`📞   - status value: '${callSessionRef.current?.status}'`)
        console.log(`📞   - REQUESTING value: '${EVoiceCallStatus.REQUESTING}'`)
      }
    }, timeoutMs)
  }

  // ✅ HỦY TIMEOUT TIMER
  const clearCallTimeout = () => {
    console.log("📞 🛑 CLEAR TIMEOUT - hủy timer")
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current)
      callTimeoutRef.current = null
      console.log("📞 ✅ Timeout timer đã hủy thành công")
    } else {
      console.log("📞 ℹ️ Timeout timer không tồn tại hoặc đã clear rồi")
    }
  }

  // GỌI 1-1
  async function startPeerCall(
    calleeUserId: number,
    directChatId: number,
    callback: TUnknownFunction<TCallRequestEmitRes, void>,
    isVideoCall: boolean = false
  ) {
    if (!rtmClient || !currentUser?.id) return toaster.error("Hệ thống chưa sẵn sàng.")

    const roomId = `call_1on1_${currentUser.id}_${calleeUserId}_${Date.now()}`
    const success = await joinRtcChannel(roomId, isVideoCall)
    if (!success) return

    // ✅ Gửi CALL_REQUEST với status REQUESTING
    await publishRtmMessage(String(calleeUserId), {
      type: "CALL_REQUEST",
      roomId,
      isVideoCall,
      chatId: directChatId,
      isGroupCall: false,
      callerUserId: currentUser.id,
    })

    const session: TActiveVoiceCallSession = {
      id: roomId,
      callerUserId: currentUser.id,
      calleeUserId,
      directChatId,
      isVideoCall,
      status: EVoiceCallStatus.REQUESTING, // ✅ Frontend state
      isGroupCall: false,
    }
    dispatch(setCallSession(session))
    sendPhoneIconMessage(directChatId, calleeUserId, "start")

    // ✅ BẮT ĐẦU TIMEOUT - nếu 30 giây không bắt máy tự động hủy
    console.log("📞 🎬 PEER CALL STARTED - start timeout in 30s")
    startCallTimeout(30000) // 30 seconds
  }

  // GỌI NHÓM
  async function startGroupCall(
    groupChatId: number,
    memberIds: number[],
    callback: TUnknownFunction<TCallRequestEmitRes, void>,
    isVideoCall: boolean = false
  ) {
    if (!currentUser?.id) return

    const roomId = `group_call_${groupChatId}`
    const success = await joinRtcChannel(roomId, isVideoCall)
    if (!success) return

    const rtmMessage: RtmCallMessage = {
      type: "CALL_REQUEST",
      roomId,
      isVideoCall,
      chatId: groupChatId,
      isGroupCall: true,
      callerUserId: currentUser.id,
    }

    for (const memberId of memberIds) {
      await publishRtmMessage(String(memberId), rtmMessage)
    }

    // ✅ Group call là CONNECTED ngay khi tạo (vì caller đã join RTC)
    dispatch(
      setCallSession({
        id: roomId,
        callerUserId: currentUser.id,
        calleeUserId: -1,
        directChatId: groupChatId,
        isVideoCall,
        status: EVoiceCallStatus.CONNECTED, // ✅ Group call connected immediately
        isGroupCall: true,
      })
    )
  }

  // CHẤP NHẬN / TỪ CHỐI / KẾT THÚC
  async function acceptCall() {
    console.log("📞 📥 ACCEPT CALL - clearing timeout")
    if (!incomingCallSession) return toaster.error("Không có cuộc gọi đến.")
    const { id: roomId, isVideoCall, callerUserId, directChatId, isGroupCall } = incomingCallSession

    const success = await joinRtcChannel(roomId, isVideoCall)

    if (success) {
      // ✅ Khi accept, cập nhật status từ RINGING → ACCEPTED → CONNECTED
      const session: TActiveVoiceCallSession = {
        id: roomId,
        callerUserId: callerUserId,
        calleeUserId: currentUser!.id,
        directChatId: directChatId,
        isVideoCall: isVideoCall,
        status: EVoiceCallStatus.ACCEPTED, // ✅ Set to ACCEPTED when accepting
        isGroupCall: isGroupCall || false,
      }
      dispatch(setCallSession(session))

      // Clear incoming call session to close the modal
      dispatch(resetIncomingCallSession())

      // ✅ HỦY TIMEOUT khi accept - cuộc gọi đã được bắt máy
      console.log("📞 ✅ ACCEPT SUCCESS - clearing timeout")
      clearCallTimeout()
    }
  }

  async function rejectCall() {
    if (!incomingCallSession) return
    // ✅ Gửi CALL_REJECTED - backend sẽ lưu status = REJECTED
    await publishRtmMessage(String(incomingCallSession.callerUserId), { type: "CALL_REJECTED" })
    dispatch(resetIncomingCallSession())
  }

  async function hangupCall(_reason: EHangupReason = EHangupReason.NORMAL) {
    // ✅ HỦY TIMEOUT khi hangup
    console.log("📞 ☎️ HANGUP CALL - clearing timeout")
    clearCallTimeout()

    if (callSession && !callSession.isGroupCall && currentUser) {
      const otherId =
        callSession.callerUserId === currentUser.id
          ? callSession.calleeUserId
          : callSession.callerUserId
      // ✅ Gửi CALL_HUNGUP với hangup reason
      await publishRtmMessage(String(otherId), { type: "CALL_HUNGUP" })
      sendPhoneIconMessage(callSession.directChatId, otherId, "end")

      // ✅ Emit event để notify cuộc gọi đã kết thúc
      console.log("📞 📢 EMIT CALL_CANCELLED_BY_PEER event")
      eventEmitter.emit(EInternalEvents.CALL_CANCELLED_BY_PEER, {
        directChatId: callSession.directChatId,
      })
    }
    await cleanup()
  }

  async function cleanup() {
    console.log("📞 🧹 CLEANUP - clearing timeout and resources")
    // ✅ HỦY TIMEOUT trong cleanup
    clearCallTimeout()

    localAudioTrackRef.current?.close()
    localVideoTrackRef.current?.close()
    localAudioTrackRef.current = null
    localVideoTrackRef.current = null

    if (rtcClient) await rtcClient.leave()
    rtcClient = null

    setRemoteUsers([])
    setIsVideoEnabled(false)
    setIsMicEnabled(true)
    isJoiningRef.current = false
    dispatch(resetCallSession())
    dispatch(resetIncomingCallSession())
    console.log("📞 ✅ CLEANUP COMPLETE")
  }

  // ĐIỀU KHIỂN MIC / VIDEO / CAMERA
  function toggleMic(): boolean {
    if (!localAudioTrackRef.current) return false
    const muted = localAudioTrackRef.current.muted
    localAudioTrackRef.current.setMuted(!muted)
    setIsMicEnabled(muted)
    return muted
  }

  async function toggleVideo(): Promise<boolean> {
    if (localVideoTrackRef.current) {
      await rtcClient?.unpublish(localVideoTrackRef.current)
      localVideoTrackRef.current.close()
      localVideoTrackRef.current = null
      setIsVideoEnabled(false)
      return false
    } else {
      try {
        const track = await AgoraRTC.createCameraVideoTrack()
        localVideoTrackRef.current = track
        await rtcClient?.publish(track)
        setIsVideoEnabled(true)
        return true
      } catch {
        toaster.error("Không thể bật camera")
        return false
      }
    }
  }

  async function switchCamera() {
    const track = localVideoTrackRef.current
    if (!track) return toaster.error("Video đang tắt.")

    try {
      const cameras = await AgoraRTC.getCameras()
      if (cameras.length < 2) return toaster.info("Chỉ có 1 camera.")

      const currentId = track.getMediaStreamTrack().getSettings().deviceId
      const next = cameras.find((c) => c.deviceId !== currentId) || cameras[0]
      await track.setDevice(next.deviceId)
      console.log("Switched to:", next.label)
    } catch (error) {
      console.error("Switch camera failed:", error)
      toaster.error("Không thể chuyển camera.")
    }
  }

  return {
    startPeerCall,
    startGroupCall,
    acceptCall,
    rejectCall,
    hangupCall,
    cleanup,
    toggleMic,
    toggleVideo,
    switchCamera,
    isVideoEnabled,
    isMicEnabled,
    remoteUsers,
    localVideoTrack: localVideoTrackRef.current,
  }
}
