import { useEffect, useRef } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { clientSocket } from "@/utils/socket/client-socket"
import { EVoiceCallEvents } from "@/utils/socket/events"
import type {
  TActionSendIcon,
  TActiveVoiceCallSession,
  TUnknownFunction,
} from "@/utils/types/global"
import type { TCallRequestEmitRes } from "@/utils/types/socket"
import { EHangupReason, EMessageTypeAllTypes, ESDPType, EVoiceCallStatus } from "@/utils/enums"
import {
  resetCallSession,
  setCallSession,
  updateCallSession,
  resetIncomingCallSession,
  updateIncomingCallSession,
} from "@/redux/voice-call/layout.slice"
import { toaster } from "@/utils/toaster"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import store from "@/redux/store"
import { emitLog } from "@/utils/helpers"
import { chattingService } from "@/services/chatting.service"
import { PhoneIncoming } from "lucide-react"
const DEFAULT_STUN_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turns:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
]
const AUTO_CLEANUP_TIMEOUT: number = 10000000
const RETRY_DELAY = 5000 // Delay retry nếu fail

export function useVoiceCall() {
  const { callSession, incomingCallSession } = useAppSelector(
    ({ "voice-call": voiceCall }) => voiceCall
  )
  const p2pConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const receivedOfferRef = useRef<boolean>(false)
  const tempActiveCallSessionRef = useRef<TActiveVoiceCallSession | null>(null)
  const dispatch = useAppDispatch()
  // NEW: Queue cho pending ICE candidates
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([])

  // NEW: Hàm flush queue sau khi set remote description
  function flushIceCandidates() {
    const p2pConnection = p2pConnectionRef.current
    if (!p2pConnection || pendingIceCandidatesRef.current.length === 0) {
      return
    }
    pendingIceCandidatesRef.current.forEach(async (candidate) => {
      try {
        await p2pConnection.addIceCandidate(candidate)
        emitLog(`Flushed ICE candidate: ${candidate.candidate}`)
      } catch (error) {
        emitLog(`Failed to flush ICE candidate: ${error}`)
      }
    })
    // Clear queue sau khi flush
    pendingIceCandidatesRef.current = []
  }
  function createPeerConnection(
    iceServers: RTCIceServer[] = DEFAULT_STUN_SERVERS
  ): RTCPeerConnection {
    const p2pConnection = new RTCPeerConnection({ iceServers })
    p2pConnection.onconnectionstatechange = () => {
      const state = p2pConnection.connectionState
      emitLog(`[P2P Connection] state: ${state}`)
      console.log(">>> [P2P Connection] state:", state)
      if (state === "failed") {
        console.log(">>> P2P failed - retry")
        toaster.error("Connection failed, retrying...")
        cleanup()
        setTimeout(
          () => ensurePeer().catch((err) => console.error("Retry failed:", err)),
          RETRY_DELAY
        )
      } else if (state === "connected") {
        console.log(">>> P2P connected - success!")
      } else if (state === "disconnected") {
        console.log(">>> P2P disconnected - monitoring...")
      }
    }
    // Thêm oniceconnectionstatechange để log ICE
    p2pConnection.oniceconnectionstatechange = () => {
      const iceState = p2pConnection.iceConnectionState
      console.log(">>> [ICE] state:", iceState)
      emitLog(`[ICE] state: ${iceState}`)
      if (iceState === "failed" || iceState === "disconnected") {
        console.log(">>> ICE failed/disconnected - retry ICE")
        p2pConnection.restartIce() // Restart ICE candidates
      }
    }
    return p2pConnection
  }
  async function getMicStream(): Promise<MediaStream> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Media devices not supported in this environment")
    }
    return navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  }
  function toggleMic(): boolean {
    if (!localStreamRef.current) {
      console.log(">>> [useVoiceCall] No local stream to toggle mic")
      emitLog("No local stream to toggle mic")
      return false
    }
    const audioTracks = localStreamRef.current.getAudioTracks()
    if (audioTracks.length === 0) {
      console.log(">>> [useVoiceCall] No audio tracks found")
      emitLog("No audio tracks found")
      return false
    }
    const isEnabled = audioTracks[0].enabled
    audioTracks.forEach((track) => {
      track.enabled = !isEnabled
    })
    console.log(`>>> [useVoiceCall] Mic ${isEnabled ? "disabled" : "enabled"}`)
    emitLog(`Mic ${isEnabled ? "muted" : "unmuted"}`)
    return !isEnabled // Trả về trạng thái mới của mic
  }

  function initRemoteStream() {
    remoteStreamRef.current = new MediaStream()
    eventEmitter.emit(EInternalEvents.INIT_REMOTE_STREAM)
  }

  // Khởi tạo PC + stream
  async function ensurePeer() {
    if (p2pConnectionRef.current) {
      emitLog("Peer connection already established")
      return
    }
    p2pConnectionRef.current = createPeerConnection()
    initRemoteStream()

    // Khi nhận được audio track từ peer khác, thêm vào remoteStreamRef, cho phép nghe được audio từ peer khác
    p2pConnectionRef.current.ontrack = (e) => {
      const stream = e.streams[0]
      if (stream) {
        stream.getAudioTracks().forEach((track) => {
          remoteStreamRef.current?.addTrack(track)
        })
      } else {
        remoteStreamRef.current?.addTrack(e.track)
      }
    }

    // Khi nhận được candidate từ STUN server, gửi lại cho peer
    p2pConnectionRef.current.onicecandidate = (event) => {
      const callSession = store.getState()["voice-call"].callSession
      emitLog(`[P2P Connection] on ice candidate: ${{ event, callSession }}`)
      if (!event.candidate || !callSession) return
      clientSocket.voiceCallSocket.emit(EVoiceCallEvents.call_ice, {
        sessionId: callSession.id,
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid || undefined,
        sdpMLineIndex: event.candidate.sdpMLineIndex || undefined,
      })
    }

    // Xử lý khi cần thiết lập lại negotiation (thay đổi description)
    p2pConnectionRef.current.onnegotiationneeded = async () => {
      emitLog("[P2P Connection] negotiation needed, creating new offer")
      try {
        const callSession = store.getState()["voice-call"].callSession
        if (!callSession) return

        const offer = await p2pConnectionRef.current!.createOffer()
        await p2pConnectionRef.current!.setLocalDescription(offer)

        clientSocket.voiceCallSocket.emit(EVoiceCallEvents.call_offer_answer, {
          sessionId: callSession.id,
          SDP: offer.sdp!,
          type: ESDPType.OFFER,
        })
      } catch (error) {
        emitLog(`Failed to handle negotiation needed: ${error}`)
        toaster.error("Failed to update call connection, please try again later!")
      }
    }
  }

  async function attachMic() {
    if (localStreamRef.current) return
    const localStream = await getMicStream()
    localStream
      .getTracks()
      .forEach((track) => p2pConnectionRef.current!.addTrack(track, localStream))
    localStreamRef.current = localStream
  }

  function getLocalStream() {
    return localStreamRef.current
  }

  function getRemoteStream() {
    return remoteStreamRef.current
  }

  // Gọi đi
  async function startCall(
    calleeUserId: number,
    directChatId: number,
    callback: TUnknownFunction<TCallRequestEmitRes, void>
  ) {
    await ensurePeer()
    await attachMic()
    emitLog("sent a call request")
    clientSocket.voiceCallSocket.emit(
      EVoiceCallEvents.call_request,
      { calleeUserId, directChatId },
      (res) => {
        callback(res)
        ensurePeer()
          .then(() => attachMic())
          .then(() => {
            sendPhoneIconMessage(directChatId, calleeUserId, "start")
          })
          .catch((error) => {
            console.log(error)
          })
      }
    )
  }

  async function sendOffer() {
    try {
      const p2pConnection = p2pConnectionRef.current
      if (!p2pConnection) {
        throw new Error("Cannot establish peer connection")
      }
      emitLog("creating an offer")
      const offer = await p2pConnection.createOffer()
      emitLog("setting local description")
      await p2pConnection.setLocalDescription(offer)
      emitLog("getting offer sdp")
      const offerSdp = offer.sdp
      const callSession = store.getState()["voice-call"].callSession
      emitLog(`offer sdp: ${offerSdp}, callSession: ${callSession?.id}`)
      if (callSession && offerSdp) {
        emitLog("sending an offer to peer")
        clientSocket.voiceCallSocket.emit(EVoiceCallEvents.call_offer_answer, {
          sessionId: callSession.id,
          SDP: offerSdp,
          type: ESDPType.OFFER,
        })
      }

      console.log(">>> Sending offer - SDP:", offer.sdp)
    } catch (error) {
      if (error instanceof Error) {
        toaster.error(error.message)
      } else {
        toaster.error("Failed to send offer")
      }
    }
  }

  async function acceptCall() {
    try {
      const activeCallSession = incomingCallSession || tempActiveCallSessionRef.current // Fix: Fallback từ Redux
      console.log("activeCallSession in accept:", activeCallSession) // Log debug

      if (!activeCallSession) {
        console.log("No session for accept - return early")
        return
      }
      dispatch(setCallSession(activeCallSession))
      dispatch(resetIncomingCallSession()) // Fix: Reset incoming sau accept

      await ensurePeer()
      console.log("Peer connection:", p2pConnectionRef.current)
      emitLog(`[acceptCall] ensurePeer done: ${p2pConnectionRef.current}`)
      await attachMic()
      clientSocket.voiceCallSocket.emit(EVoiceCallEvents.call_accept, {
        sessionId: activeCallSession.id,
      })
      console.log("Emitted call_accept", activeCallSession.id)
      eventEmitter.emit(EInternalEvents.CALL_STARTED, {
        directChatId: activeCallSession.directChatId,
        initiatorId: store.getState().user.user?.id || 0,
        type: "VOICE_CALL",
        timestamp: new Date(),
      })
      autoCleanup()
    } catch (error) {
      if (error instanceof Error) {
        toaster.error(error.message)
      } else {
        toaster.error("Failed to accept call")
      }
    }
  }

  function rejectCall() {
    const sessionToUse = incomingCallSession || callSession || tempActiveCallSessionRef.current // Fix: Fallback
    console.log("reacjtcalll  >>", sessionToUse)
    if (!sessionToUse) {
      console.log("No session for reject - return early")
      return
    }
    dispatch(updateCallSession({ status: EVoiceCallStatus.REJECTED }))
    clientSocket.voiceCallSocket.emit(EVoiceCallEvents.call_reject, { sessionId: sessionToUse.id })

    cleanup()
  }

  function hangupCall(reason: EHangupReason = EHangupReason.NORMAL) {
    const session = callSession || incomingCallSession
    if (!session) {
      emitLog(">>> [useVoiceCall] No session found for hangup", "error")
      return
    }

    // Xác định directChatId và receiverId
    const directChatId = session.directChatId
    const currentUserId = store.getState().user.user?.id
    if (!currentUserId) {
      emitLog(">>> [useVoiceCall] No current user ID found for hangup", "error")
      toaster.error("Cannot end call: User not authenticated")
      return
    }
    const receiverId =
      session.callerUserId === currentUserId ? session.calleeUserId : session.callerUserId

    sendPhoneIconMessage(directChatId, receiverId, "end")
    if (!session) {
      emitLog(">>> [useVoiceCall] No session found for hangup", "error")
      return
    }
    emitLog(
      `>>> [useVoiceCall] User ended call for session ${session.id}, chat ${session.directChatId}, reason: ${reason}`,
      "info"
    )
    dispatch(updateCallSession({ status: EVoiceCallStatus.ENDED }))
    dispatch(updateIncomingCallSession({ status: EVoiceCallStatus.ENDED }))
    clientSocket.voiceCallSocket.emit(EVoiceCallEvents.call_hangup, {
      sessionId: session.id,
      reason,
    })
    eventEmitter.emit(EInternalEvents.CALL_CANCELLED_BY_PEER, {
      directChatId: session.directChatId,
    })
    cleanup()
  }

  function cleanup() {
    try {
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
    } catch {
      toaster.error("Failed to stop local stream, please try again later!")
    }
    localStreamRef.current = null
    try {
      remoteStreamRef.current?.getTracks().forEach((t) => t.stop())
    } catch {
      toaster.error("Failed to stop remote stream, please try again later!")
    }
    remoteStreamRef.current = null
    try {
      p2pConnectionRef.current
        ?.getSenders()
        .forEach((s) => p2pConnectionRef.current?.removeTrack(s))
    } catch {
      toaster.error("Failed to remove tracks, please try again later!")
    }
    p2pConnectionRef.current?.close()
    p2pConnectionRef.current = null
    dispatch(resetCallSession())
    dispatch(resetIncomingCallSession()) // Fix: Reset incoming trong cleanup
  }

  function autoCleanup() {
    setTimeout(() => {
      if (!receivedOfferRef.current) {
        cleanup()
      }
    }, AUTO_CLEANUP_TIMEOUT)
  }

  function registerSocketListeners() {
    clientSocket.voiceCallSocket.on(EVoiceCallEvents.call_request, (activeCallSession) => {
      emitLog("Call request received 187")
      tempActiveCallSessionRef.current = activeCallSession
      eventEmitter.emit(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED)
    })

    clientSocket.voiceCallSocket.on(EVoiceCallEvents.call_hangup, (reason: EHangupReason) => {
      console.log(">>> Received call_hangup from server:", reason)
      toaster.info("Call ended by peer>>>.")
      eventEmitter.emit(EInternalEvents.CALL_CANCELLED_BY_PEER, {})
      cleanup() // Dọn tài nguyên WebRTC, đóng mic, reset UI
    })

    clientSocket.voiceCallSocket.on(EVoiceCallEvents.call_status, (status, callSession) => {
      switch (status) {
        case EVoiceCallStatus.ACCEPTED:
          emitLog("call accepted, sending an offer")
          if (callSession) {
            console.log("callsession>>", callSession)
            dispatch(setCallSession(callSession))
          }
          sendOffer()
          break
        case EVoiceCallStatus.RINGING:
          break
        case EVoiceCallStatus.REJECTED:
          console.log("resssssssssssssss")
          if (callSession) {
            const directChatId = callSession.directChatId
            eventEmitter.emit(EInternalEvents.CALL_REJECTED_BY_PEER, { directChatId })
          } else {
            // Nếu callSession undefined, vẫn emit event không payload (UI sẽ tự đóng)
            eventEmitter.emit(EInternalEvents.CALL_REJECTED_BY_PEER, {})
          }
          cleanup()
          toaster.info("Call rejected")
          break

        case EVoiceCallStatus.CANCELLED:
          console.log("tesssssssssssssss")
          if (callSession) {
            const directChatId = callSession.directChatId
            eventEmitter.emit(EInternalEvents.CALL_CANCELLED_BY_PEER, { directChatId })
          } else {
            // Nếu callSession undefined, vẫn emit event không payload (UI sẽ tự đóng)
            eventEmitter.emit(EInternalEvents.CALL_CANCELLED_BY_PEER, {})
          }
          cleanup()
          console.log("tesssssssssssssss")
          toaster.info("Call cancel")
          break
        case EVoiceCallStatus.BUSY:
          break
        case EVoiceCallStatus.OFFLINE:
          break
        case EVoiceCallStatus.TIMEOUT:
          break
        case EVoiceCallStatus.ENDED:
          toaster.info("Call ended by peer.")
          if (callSession) {
            eventEmitter.emit(EInternalEvents.CALL_CANCELLED_BY_PEER, {
              directChatId: callSession.directChatId,
            })
          }
          cleanup() // <<< PHẢI GỌI CLEANUP
          break
          break
        case EVoiceCallStatus.RINGING:
          break
        case EVoiceCallStatus.REQUESTING:
          break
      }
    })

    clientSocket.voiceCallSocket.on(EVoiceCallEvents.call_offer_answer, async (SDP, type) => {
      emitLog("received an offer or answer")
      const p2pConnection = p2pConnectionRef.current
      const signalingState = p2pConnection?.signalingState
      console.log(
        ">>> [SDP Handler] Type:",
        type,
        "SignalingState:",
        signalingState,
        "CallSession:",
        callSession?.id
      )
      if (!p2pConnection || !callSession) {
        console.log(">>> Skip SDP: No connection or session")
        return
      }
      if (type === ESDPType.OFFER && signalingState !== "stable") {
        console.log(">>> Skip offer: Wrong state", signalingState)
        return
      }
      if (type === ESDPType.ANSWER && signalingState !== "have-local-offer") {
        console.log(">>> Skip answer: Wrong state for answer", signalingState)
        return
      }
      emitLog(
        `>>> at call_offer_answer: `,
        `p2pConnection: ${p2pConnection}, `,
        `callSession: ${callSession}, `,
        `SDP: ${SDP}, `,
        `type: ${type}.`
      )
      if (!p2pConnection || !callSession) return
      if (type === ESDPType.OFFER) {
        emitLog("received an offer")
        receivedOfferRef.current = true
        await ensurePeer()
        await attachMic()
        await p2pConnection.setRemoteDescription({ sdp: SDP, type })
        flushIceCandidates()
        const answer = await p2pConnection.createAnswer()
        await p2pConnection.setLocalDescription(answer)
        clientSocket.voiceCallSocket.emit(EVoiceCallEvents.call_offer_answer, {
          sessionId: callSession.id,
          SDP: answer.sdp!,
          type: ESDPType.ANSWER,
        })
      } else if (type === ESDPType.ANSWER) {
        emitLog("received an answer")
        await p2pConnection.setRemoteDescription({ sdp: SDP, type })
        flushIceCandidates()
        dispatch(updateCallSession({ status: EVoiceCallStatus.CONNECTED }))
      }
    })

    clientSocket.voiceCallSocket.on(
      EVoiceCallEvents.call_ice,
      async (candidate: string, sdpMid?: string, sdpMLineIndex?: number) => {
        emitLog("received an ice candidate")
        const p2pConnection = p2pConnectionRef.current
        if (!p2pConnection) return
        try {
          await p2pConnection.addIceCandidate({
            candidate,
            sdpMid,
            sdpMLineIndex,
          })
        } catch (error) {
          emitLog(`Failed to add ice candidate: ${{ error }}`)
          toaster.error(
            error instanceof Error
              ? error.message
              : "Failed to establish voice call, please try again later!"
          )
        }
      }
    )
  }
  function sendPhoneIconMessage(directChatId: number, receiverId: number, action: TActionSendIcon) {
    const content =
      action === "start"
        ? '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Call started'
        : '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Call ended'
    const msgPayload = {
      content,
      receiverId,
      token: chattingService.getMessageToken(),
      timestamp: new Date(),
    }
    chattingService.sendMessage(EMessageTypeAllTypes.TEXT, msgPayload, (data) => {
      if ("success" in data && data.success) {
        console.log(`>>> [useVoiceCall] Sent phone icon message (${action})`)
        chattingService.recursiveSendingQueueMessages()
      } else if ("isError" in data && data.isError) {
        console.error(
          `>>> [useVoiceCall] Failed to send phone icon message (${action}):`,
          data.message
        )
      }
    })
  }

  useEffect(() => {
    registerSocketListeners()
    return () => {
      clientSocket.voiceCallSocket.off(EVoiceCallEvents.call_request)
      clientSocket.voiceCallSocket.off(EVoiceCallEvents.call_status)
      clientSocket.voiceCallSocket.off(EVoiceCallEvents.call_offer_answer)
      clientSocket.voiceCallSocket.off(EVoiceCallEvents.call_ice)
    }
  }, [callSession])

  return {
    startCall,
    acceptCall,
    rejectCall,
    hangupCall,
    cleanup,
    sendOffer,
    getLocalStream,
    getRemoteStream,
    getP2pConnection: () => p2pConnectionRef.current,
    incomingCallSession,
    toggleMic,
  }
}
