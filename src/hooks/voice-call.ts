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
  TActiveVoiceCallSession2,
  TUnknownFunction,
} from "@/utils/types/global"
import type { TCallRequestEmitRes } from "@/utils/types/socket"
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng"
// THAY ĐỔI IMPORT: Import 'RTM' từ default export thay vì 'RTMClient'
import AgoraRTM from "agora-rtm-sdk"
import { chattingService } from "@/services/chatting.service"

const APP_ID = "bf206a5c93854a8591320eb085bfd71f"

type RtmCallMessage =
  | {
      type: "CALL_REQUEST"
      roomId: string // Channel RTC để tham gia
      isVideoCall: boolean
      chatId: number
      isGroupCall: boolean
    }
  | { type: "CALL_REJECTED" }
  | { type: "CALL_HUNGUP" }

// Biến client toàn cục để giữ instance
// THAY ĐỔI TYPE: RTMClient -> RTM
let rtmClient: InstanceType<typeof AgoraRTM.RTM> | null = null
let rtcClient: IAgoraRTCClient | null = null

// Đặt tên kênh mời gọi (invite channel) theo quy ước
const getInviteChannelName = (userId: string | number) => `invite_${userId}`

export function useAgoraCall() {
  const dispatch = useAppDispatch()
  const { callSession, incomingCallSession } = useAppSelector((state) => state["voice-call"])
  const currentUser = useAppSelector((state) => state.user.user) // Tracks

  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null)
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null) // State

  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const isJoiningRef = useRef(false) // --- 1. XỬ LÝ RTM (Signaling 1-1) ---
  // Xử lý tin nhắn RTM đến (chỉ cho 1-1)
  // THAY ĐỔI CHỮ KÝ HÀM: message.text -> messagePayload (vì v2 trả về string)

  const handleRtmMessage = (messagePayload: string, peerId: string) => {
    // THAY ĐỔI PARSING: v2 message là string payload, không phải object { text: '...' }
    const data: RtmCallMessage = JSON.parse(messagePayload)
    console.log("RTM Message received from:", peerId, data)

    switch (data.type) {
      case "CALL_REQUEST":
        // 1. CHỈ từ chối cuộc gọi 1-1 NẾU đang bận
        if (!data.isGroupCall && (callSession || incomingCallSession)) {
          console.log("User is busy with a 1-1 call, rejecting new call.")
          publishRtmMessage(peerId, { type: "CALL_REJECTED" })
          return
        } // 2. CHỈ bỏ qua cuộc gọi NHÓM NẾU đã ở trong phòng đó
        // (callSession?.id vẫn hợp lệ ở đây vì logic (1) không loại trừ nó)

        if (data.isGroupCall && callSession?.id === data.roomId) {
          console.log("Already in this group call, ignoring invite.")
          return
        }
        const session: TActiveVoiceCallSession2 = {
          id: data.roomId,
          callerUserId: Number(peerId),
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
        toaster.info("Call rejected by user")
        eventEmitter.emit(EInternalEvents.CALL_REJECTED_BY_PEER, {})
        cleanup()
        break
      case "CALL_HUNGUP":
        toaster.info("Call ended by peer")
        eventEmitter.emit(EInternalEvents.CALL_CANCELLED_BY_PEER, {})
        cleanup()
        break
    }
  } // Khởi tạo RTM Client (chỉ 1 lần)

  useEffect(() => {
    if (!currentUser?.id || rtmClient) return // THAY ĐỔI KHỞI TẠO (THEO DOCS V2)
    console.log("current user", currentUser)
    const { RTM } = AgoraRTM
    const uid = String(currentUser.id)
    const token = null as any
    const rtmConfig = { logLevel: "debug" as const } // Thêm config log từ docs
    // Dùng 'new RTM()' thay vì 'AgoraRTM.createInstance()'

    const client = new RTM(APP_ID, uid, rtmConfig)
    rtmClient = client
    console.log(">>check token", token)

    // THAY ĐỔI EVENT LISTENER (THEO DOCS V2)
    // Thêm listener cho 'status' (khuyến nghị trong docs)
    client.addEventListener("status", (event) => {
      console.log("RTM Connection Status:", event.state, event.reason)
    })

    // Dùng 'addEventListener("message", ...)'
    client.addEventListener("message", (event) => {
      // event.publisher là người gửi, event.message là payload (string)
      handleRtmMessage(event.message as string, event.publisher)
    })

    client
      // Dùng 'client.login({ token })'
      .login({ token })
      .then(() => {
        console.log("RTM client logged in")

        // *** BƯỚC QUAN TRỌNG CỦA V2 ***
        // Phải subscribe vào kênh "invite" của chính mình để nhận cuộc gọi
        const myInviteChannel = getInviteChannelName(uid)
        return client.subscribe(myInviteChannel)
      })
      .then((res) => {
        console.log(`RTM subscribed to my invite channel: ${getInviteChannelName(uid)}`, res)
      })
      .catch((err) => console.error("RTM login or subscribe failed:", err))

    // Thêm hàm cleanup khi component unmount
    return () => {
      if (rtmClient) {
        rtmClient
          .logout()
          .then(() => console.log("RTM client logged out on unmount"))
          .catch((err: any) => console.error("RTM logout on unmount failed:", err))
        rtmClient = null
      }
    }
  }, [currentUser?.id])

  // Dán hàm này vào bên trong hook 'useAgoraCall'
  function sendPhoneIconMessage(directChatId: number, receiverId: number, action: TActionSendIcon) {
    const content =
      action === "start"
        ? '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white" style="display: inline-block; vertical-align: middle; margin-right: 4px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span style="vertical-align: middle;">Call started</span>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white" style="display: inline-block; vertical-align: middle; margin-right: 4px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span style="vertical-align: middle;">Call ended</span>'

    const msgPayload = {
      content,
      receiverId,
      token: chattingService.getMessageToken(),
      timestamp: new Date(),
    }

    chattingService.sendMessage(EMessageTypeAllTypes.TEXT, msgPayload, (data) => {
      if ("success" in data && data.success) {
        console.log(`>>> [useAgoraCall] Sent phone icon message (${action})`)
        chattingService.recursiveSendingQueueMessages()
      } else if ("isError" in data && data.isError) {
        console.error(
          `>>> [useAgoraCall] Failed to send phone icon message (${action}):`,
          data.message
        )
      }
    })
  }
  const publishRtmMessage = async (targetUserId: string, message: RtmCallMessage) => {
    if (!rtmClient) return

    // Logic v2: publish tới kênh invite của người nhận
    const channelName = getInviteChannelName(targetUserId)
    const payload = JSON.stringify(message)
    // Thêm options như trong docs
    const publishOptions = { channelType: "MESSAGE" as const }

    try {
      // Dùng 'rtmClient.publish(channelName, payload, options)'
      await rtmClient.publish(channelName, payload, publishOptions)
    } catch (error) {
      console.error("Failed to publish RTM message:", error)
    }
  } // --- 2. XỬ LÝ RTC (Media) ---
  // Hàm chung để tham gia kênh RTC (Phần này không thay đổi vì là RTC, không phải RTM)
  const joinRtcChannel = async (roomId: string, isVideo: boolean): Promise<boolean> => {
    if (isJoiningRef.current || rtcClient) return false
    isJoiningRef.current = true

    try {
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
      rtcClient = client

      // ✅ SETUP TẤT CẢ EVENT LISTENERS TRƯỚC KHI JOIN
      client.on("user-joined", (user) => {
        console.log(">>> User joined:", user.uid)
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid))
        dispatch(updateCallSession({ status: EVoiceCallStatus.CONNECTED }))
      })

      client.on("user-left", (user) => {
        console.log(">>> User left:", user.uid)
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid))
      })

      client.on("user-published", async (user, mediaType) => {
        console.log(">>> User published:", user.uid, mediaType)

        try {
          // Subscribe to the track
          await client.subscribe(user, mediaType)
          console.log(">>> Subscribed to", user.uid, mediaType)

          // Play audio immediately
          if (mediaType === "audio") {
            user.audioTrack?.play()
          }

          // Update remote users list
          setRemoteUsers((prevUsers) => {
            const existingUserIndex = prevUsers.findIndex((u) => u.uid === user.uid)

            if (existingUserIndex > -1) {
              const updatedUsers = [...prevUsers]
              updatedUsers[existingUserIndex] = user
              console.log(">>> Updated existing remote user:", user.uid)
              return updatedUsers
            } else {
              console.log(">>> Added new remote user:", user.uid)
              return [...prevUsers, user]
            }
          })
        } catch (error) {
          console.error(">>> Failed to subscribe:", error)
        }
      })

      client.on("user-unpublished", (user, mediaType) => {
        console.log(">>> User unpublished:", user.uid, mediaType)

        setRemoteUsers((prevUsers) => {
          const existingUserIndex = prevUsers.findIndex((u) => u.uid === user.uid)

          if (existingUserIndex > -1) {
            const updatedUsers = [...prevUsers]
            updatedUsers[existingUserIndex] = user
            return updatedUsers
          }
          return prevUsers
        })
      })

      // ✅ JOIN CHANNEL SAU KHI SETUP EVENTS
      console.log(">>> Joining RTC channel:", roomId)
      await client.join(APP_ID, roomId, null, String(currentUser!.id))
      console.log(">>> Successfully joined RTC channel")

      // ✅ CREATE AND PUBLISH LOCAL TRACKS
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
      localAudioTrackRef.current = audioTrack
      setIsMicEnabled(true)

      let tracksToPublish: (IMicrophoneAudioTrack | ICameraVideoTrack)[] = [audioTrack]

      if (isVideo) {
        const videoTrack = await AgoraRTC.createCameraVideoTrack()
        localVideoTrackRef.current = videoTrack
        tracksToPublish.push(videoTrack)
        setIsVideoEnabled(true)
        console.log(">>> Created local video track")
      }

      console.log(">>> Publishing local tracks:", tracksToPublish.length)
      await client.publish(tracksToPublish)
      console.log(">>> Successfully published local tracks")

      // ✅ CHỜ 1 CHÚT ĐỂ ĐẢM BẢO NETWORK SYNC
      await new Promise((resolve) => setTimeout(resolve, 500))

      dispatch(updateCallSession({ status: EVoiceCallStatus.CONNECTED }))
      return true
    } catch (error) {
      console.error(">>> Failed to join RTC channel:", error)
      toaster.error("Failed to connect to call.")
      await cleanup()
      return false
    } finally {
      isJoiningRef.current = false
    }
  }
  /** Bắt đầu cuộc gọi 1-1 */
  async function startPeerCall(
    calleeUserId: number,
    directChatId: number,
    callback: TUnknownFunction<TCallRequestEmitRes, void>,
    isVideoCall: boolean = false
  ) {
    if (!rtmClient || !currentUser?.id) return toaster.error("Signaling not ready.")

    const roomId = `call_1on1_${currentUser.id}_${calleeUserId}_${Date.now()}`
    const success = await joinRtcChannel(roomId, isVideoCall)
    if (!success) return

    // THAY ĐỔI: Dùng hàm publish mới
    await publishRtmMessage(String(calleeUserId), {
      type: "CALL_REQUEST",
      roomId,
      isVideoCall,
      chatId: directChatId,
      isGroupCall: false,
    })

    const session: TActiveVoiceCallSession2 = {
      id: roomId,
      callerUserId: currentUser.id,
      calleeUserId,
      directChatId,
      isVideoCall,
      status: EVoiceCallStatus.RINGING,
      isGroupCall: false,
    }
    dispatch(setCallSession(session)) // callback({ success: true, session })
    sendPhoneIconMessage(directChatId, calleeUserId, "start")
  } /** Bắt đầu/Tham gia cuộc gọi nhóm */

  async function startGroupCall(
    groupChatId: number,
    memberIds: number[],
    callback: TUnknownFunction<TCallRequestEmitRes, void>,
    isVideoCall: boolean = false
  ) {
    // Logic này vẫn giữ nguyên vì nó không dùng RTM 1-1
    if (!currentUser?.id) return toaster.error("User not found.")

    const roomId = `group_call_${groupChatId}`
    const success = await joinRtcChannel(roomId, isVideoCall)
    if (!success) return
    const rtmMessage: RtmCallMessage = {
      type: "CALL_REQUEST",
      roomId,
      isVideoCall,
      chatId: groupChatId, // ID của Group Chat
      isGroupCall: true, // <-- BẮT BUỘC
    }
    const session: TActiveVoiceCallSession2 = {
      id: roomId,
      callerUserId: currentUser.id,
      calleeUserId: -1,
      directChatId: groupChatId,
      isVideoCall,
      status: EVoiceCallStatus.CONNECTED,
      isGroupCall: true,
    }
    for (const memberId of memberIds) {
      // Gửi đến kênh invite *cá nhân* của từng người
      await publishRtmMessage(String(memberId), rtmMessage)
    }
    dispatch(setCallSession(session)) //  callback({ success: true, session })
  }

  async function acceptCall() {
    if (!incomingCallSession) return toaster.error("No incoming call.")

    const { id: roomId, isVideoCall } = incomingCallSession
    // Không cần gửi RTM message, chỉ cần join kênh RTC
    const success = await joinRtcChannel(roomId, isVideoCall) // Sửa lại

    // **THÊM KHỐI NÀY VÀO:**
    if (success) {
      dispatch(updateCallSession({ status: EVoiceCallStatus.CONNECTED }))
    }
  }

  async function rejectCall() {
    if (!incomingCallSession) return
    // THAY ĐỔI: Dùng hàm publish mới
    await publishRtmMessage(String(incomingCallSession.callerUserId), {
      type: "CALL_REJECTED",
    })
    dispatch(resetIncomingCallSession())
  }

  async function hangupCall(reason: EHangupReason = EHangupReason.NORMAL) {
    // Gửi tin nhắn gác máy (chỉ cho cuộc gọi 1-1)
    if (callSession && !callSession.isGroupCall && currentUser) {
      const otherUserId =
        callSession.callerUserId === currentUser.id
          ? callSession.calleeUserId
          : callSession.callerUserId
      // THAY ĐỔI: Dùng hàm publish mới
      await publishRtmMessage(String(otherUserId), { type: "CALL_HUNGUP" })
      sendPhoneIconMessage(callSession.directChatId, otherUserId, "end")
    }

    await cleanup()
  }

  async function cleanup() {
    // Không logout RTM ở đây, vì client cần giữ kết nối để nhận cuộc gọi mới
    // RTM client sẽ tự logout khi component unmount (xem trong useEffect)

    localAudioTrackRef.current?.stop()
    localAudioTrackRef.current?.close()
    localVideoTrackRef.current?.stop()
    localVideoTrackRef.current?.close()
    localAudioTrackRef.current = null
    localVideoTrackRef.current = null

    if (rtcClient) {
      await rtcClient.leave()
      rtcClient = null
    }

    setRemoteUsers([])
    setIsVideoEnabled(false)
    setIsMicEnabled(true)
    isJoiningRef.current = false
    dispatch(resetCallSession())
    dispatch(resetIncomingCallSession())
  }

  function toggleMic(): boolean {
    if (!localAudioTrackRef.current) return false
    const isMuted = localAudioTrackRef.current.muted
    localAudioTrackRef.current.setMuted(!isMuted)
    setIsMicEnabled(isMuted)
    return isMuted
  }

  async function toggleVideo(): Promise<boolean> {
    const videoTrack = localVideoTrackRef.current
    if (videoTrack) {
      await rtcClient?.unpublish(videoTrack)
      videoTrack.stop()
      videoTrack.close()
      localVideoTrackRef.current = null
      setIsVideoEnabled(false)
      return false
    } else {
      try {
        const newVideoTrack = await AgoraRTC.createCameraVideoTrack()
        localVideoTrackRef.current = newVideoTrack
        await rtcClient?.publish(newVideoTrack)
        setIsVideoEnabled(true)
        return true
      } catch (error) {
        toaster.error("Không thể bật camera")
        return false
      }
    }
  }
  // ✅ HÀM MỚI ĐỂ SWITCH CAMERA
  async function switchCamera() {
    const currentTrack = localVideoTrackRef.current

    if (!currentTrack) {
      toaster.error("Video đang tắt.")
      return
    }

    try {
      // 1. Lấy tất cả camera
      const allCameras = await AgoraRTC.getCameras()
      if (!allCameras || allCameras.length < 2) {
        toaster.info("Không tìm thấy camera khác để chuyển.")
        return
      }

      // 2. Lấy ID của camera hiện tại
      const currentCameraId = currentTrack.getMediaStreamTrack().getSettings().deviceId

      // 3. Tìm index của camera hiện tại
      const currentIndex = allCameras.findIndex((camera) => camera.deviceId === currentCameraId)
      if (currentIndex === -1) {
        console.error("Không tìm thấy camera hiện tại trong danh sách.")
        return
      }

      // 4. Xác định camera tiếp theo (quay vòng)
      const nextIndex = (currentIndex + 1) % allCameras.length
      const nextCamera = allCameras[nextIndex]

      // 5. Chuyển thiết bị
      await currentTrack.setDevice(nextCamera.deviceId)

      console.log("Đã chuyển camera sang:", nextCamera.label || nextCamera.deviceId)
    } catch (error) {
      console.error("Lỗi khi chuyển camera:", error)
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
