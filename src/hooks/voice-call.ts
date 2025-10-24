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
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([])

  // **FIX KEY: Thêm flag để track vai trò**
  const isCallerRef = useRef<boolean>(false)
  const makingOfferRef = useRef<boolean>(false)
  const isSettingRemoteDescriptionRef = useRef<boolean>(false)

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
    pendingIceCandidatesRef.current = []
  }

  function createPeerConnection(
    iceServers: RTCIceServer[] = DEFAULT_STUN_SERVERS
  ): RTCPeerConnection {
    const p2pConnection = new RTCPeerConnection({ iceServers })

    p2pConnection.onconnectionstatechange = () => {
      emitLog(`[P2P Connection] state: ${p2pConnection.connectionState}`)
      console.log(">>> [P2P Connection] state:", p2pConnection.connectionState)
    }

    return p2pConnection
  }

  async function ensurePeer() {
    if (p2pConnectionRef.current) {
      emitLog("Peer connection already established")
      return
    }
    p2pConnectionRef.current = createPeerConnection()
    initRemoteStream()

    p2pConnectionRef.current.ontrack = (e) => {
      console.log(">>> [ontrack] Received track:", e.track.kind, e.track.enabled)

      const stream = e.streams[0]
      if (stream) {
        if (e.track.kind === "audio") {
          stream.getAudioTracks().forEach((track) => {
            remoteStreamRef.current?.addTrack(track)
          })
        } else if (e.track.kind === "video") {
          stream.getVideoTracks().forEach((track) => {
            remoteStreamRef.current?.addTrack(track)
          })
          // **Emit event để UI update**
          if (remoteStreamRef.current) {
            // <-- Thêm guard clause
            eventEmitter.emit(EInternalEvents.REMOTE_VIDEO_UPDATED, remoteStreamRef.current)
          }
        }
      } else {
        remoteStreamRef.current?.addTrack(e.track)
        if (e.track.kind === "video") {
          if (remoteStreamRef.current) {
            // <-- Thêm guard clause
            eventEmitter.emit(EInternalEvents.REMOTE_VIDEO_UPDATED, remoteStreamRef.current)
          }
        }
      }
    }

    p2pConnectionRef.current.onicecandidate = (event) => {
      const callSession = store.getState()["voice-call"].callSession
      emitLog(`[P2P Connection] on ice candidate: ${{ event, callSession }}`)
      if (!event.candidate || !callSession) return
      clientSocket.callSocket.emit(EVoiceCallEvents.call_ice, {
        sessionId: callSession.id,
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid || undefined,
        sdpMLineIndex: event.candidate.sdpMLineIndex || undefined,
      })
    }

    // **FIX: Perfect Negotiation Pattern**
    p2pConnectionRef.current.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true
        emitLog("[P2P Connection] negotiation needed")

        const callSession = store.getState()["voice-call"].callSession
        if (!callSession) return

        const offer = await p2pConnectionRef.current!.createOffer()

        // Kiểm tra xem có phải đang setting remote description không
        if (p2pConnectionRef.current!.signalingState !== "stable") {
          console.log(">>> Skip negotiation: Not in stable state")
          return
        }

        await p2pConnectionRef.current!.setLocalDescription(offer)

        clientSocket.callSocket.emit(EVoiceCallEvents.call_offer_answer, {
          sessionId: callSession.id,
          SDP: offer.sdp!,
          type: ESDPType.OFFER,
        })
      } catch (error) {
        emitLog(`Failed to handle negotiation needed: ${error}`)
      } finally {
        makingOfferRef.current = false
      }
    }
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

    // **FIX: Cập nhật sender trong peer connection**
    const p2pConnection = p2pConnectionRef.current
    if (p2pConnection) {
      p2pConnection.getSenders().forEach((sender) => {
        if (sender.track?.kind === "audio") {
          sender.track.enabled = !isEnabled
        }
      })
    }

    console.log(`>>> [useVoiceCall] Mic ${isEnabled ? "disabled" : "enabled"}`)
    emitLog(`Mic ${isEnabled ? "muted" : "unmuted"}`)
    return !isEnabled
  }
  function initRemoteStream() {
    remoteStreamRef.current = new MediaStream()
    eventEmitter.emit(EInternalEvents.INIT_REMOTE_STREAM)
  }

  async function attachMic() {
    if (localStreamRef.current) {
      console.log("🎙️ [attachMic] Stream already exists, reusing")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      console.log("🎙️ [attachMic] Got local stream:", stream)

      stream.getTracks().forEach((track) => {
        console.log("🎙️ [attachMic] Adding track:", track)
        p2pConnectionRef.current?.addTrack(track, stream)
      })
    } catch (err) {
      console.error("❌ [attachMic] Failed to get mic:", err)
      throw err
    }
  }

  function getLocalStream() {
    return localStreamRef.current
  }

  function getRemoteStream() {
    return remoteStreamRef.current
  }

  // **FIX: Đánh dấu caller khi bắt đầu cuộc gọi**
  async function startCall(
    calleeUserId: number,
    directChatId: number,
    callback: TUnknownFunction<TCallRequestEmitRes, void>
  ) {
    isCallerRef.current = true // **Đánh dấu là caller**
    await ensurePeer()
    await attachMic()
    emitLog("sent a call request")

    clientSocket.callSocket.emit(
      EVoiceCallEvents.call_request,
      { calleeUserId, directChatId },
      (res) => {
        callback(res)
        sendPhoneIconMessage(directChatId, calleeUserId, "start")
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

      const offerSdp = offer.sdp
      const callSession = store.getState()["voice-call"].callSession
      emitLog(`offer sdp: ${offerSdp}, callSession: ${callSession?.id}`)

      if (callSession && offerSdp) {
        emitLog("sending an offer to peer")
        clientSocket.callSocket.emit(EVoiceCallEvents.call_offer_answer, {
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

  // **FIX: Callee không tạo offer tự động**
  async function acceptCall() {
    try {
      isCallerRef.current = false // **Đánh dấu là callee**

      const activeCallSession = incomingCallSession || tempActiveCallSessionRef.current
      console.log("activeCallSession in accept:", activeCallSession)

      if (!activeCallSession) {
        console.log("No session for accept - return early")
        return
      }

      dispatch(setCallSession(activeCallSession))
      dispatch(resetIncomingCallSession())

      await ensurePeer()
      await attachMic()

      console.log("Peer connection:", p2pConnectionRef.current)
      emitLog(`[acceptCall] ensurePeer done: ${p2pConnectionRef.current}`)

      clientSocket.callSocket.emit(EVoiceCallEvents.call_accept, {
        sessionId: activeCallSession.id,
      })
      console.log("Emitted call_accept", activeCallSession.id)

      autoCleanup()
    } catch (error) {
      emitLog(`Failed to accept call: ${error}`)
      toaster.error("Failed to accept call, please try again!")
    }
  }

  function rejectCall() {
    const sessionToUse = incomingCallSession || callSession || tempActiveCallSessionRef.current
    console.log("rejectCall >>", sessionToUse)

    if (!sessionToUse) {
      console.log("No session for reject - return early")
      return
    }

    dispatch(updateCallSession({ status: EVoiceCallStatus.REJECTED }))
    clientSocket.callSocket.emit(EVoiceCallEvents.call_reject, { sessionId: sessionToUse.id })
    cleanup()
  }

  function hangupCall(reason: EHangupReason = EHangupReason.NORMAL) {
    const session = callSession || incomingCallSession
    if (!session) {
      emitLog(">>> [useVoiceCall] No session found for hangup", "error")
      return
    }

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

    emitLog(
      `>>> [useVoiceCall] User ended call for session ${session.id}, chat ${session.directChatId}, reason: ${reason}`,
      "info"
    )

    dispatch(updateCallSession({ status: EVoiceCallStatus.ENDED }))
    dispatch(updateIncomingCallSession({ status: EVoiceCallStatus.ENDED }))

    clientSocket.callSocket.emit(EVoiceCallEvents.call_hangup, {
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
    dispatch(resetIncomingCallSession())

    // Reset flags
    isCallerRef.current = false
    makingOfferRef.current = false
    isSettingRemoteDescriptionRef.current = false
    receivedOfferRef.current = false
    pendingIceCandidatesRef.current = []
  }

  function autoCleanup() {
    setTimeout(() => {
      if (!receivedOfferRef.current) {
        cleanup()
      }
    }, AUTO_CLEANUP_TIMEOUT)
  }

  function registerSocketListeners() {
    clientSocket.callSocket.on(EVoiceCallEvents.call_request, (activeCallSession) => {
      emitLog("Call request received")
      tempActiveCallSessionRef.current = activeCallSession
      eventEmitter.emit(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED)
    })

    clientSocket.callSocket.on(EVoiceCallEvents.call_hangup, (reason: EHangupReason) => {
      console.log(">>> Received call_hangup from server:", reason)
      toaster.info("Call ended by peer.")
      eventEmitter.emit(EInternalEvents.CALL_CANCELLED_BY_PEER, {})
      cleanup()
    })

    clientSocket.callSocket.on(EVoiceCallEvents.call_status, async (status, callSession) => {
      switch (status) {
        case EVoiceCallStatus.ACCEPTED:
          emitLog("call accepted, sending an offer")
          if (callSession) {
            console.log("callSession >>", callSession)
            dispatch(setCallSession(callSession))
          }
          await ensurePeer()
          await attachMic()
          sendOffer()

          break

        case EVoiceCallStatus.REJECTED:
          if (callSession) {
            eventEmitter.emit(EInternalEvents.CALL_REJECTED_BY_PEER, {
              directChatId: callSession.directChatId,
            })
          } else {
            eventEmitter.emit(EInternalEvents.CALL_REJECTED_BY_PEER, {})
          }
          cleanup()
          toaster.info("Call rejected")
          break

        case EVoiceCallStatus.CANCELLED:
          if (callSession) {
            eventEmitter.emit(EInternalEvents.CALL_CANCELLED_BY_PEER, {
              directChatId: callSession.directChatId,
            })
          } else {
            eventEmitter.emit(EInternalEvents.CALL_CANCELLED_BY_PEER, {})
          }
          cleanup()
          toaster.info("Call cancelled")
          break

        case EVoiceCallStatus.ENDED:
          toaster.info("Call ended by peer.")
          if (callSession) {
            eventEmitter.emit(EInternalEvents.CALL_CANCELLED_BY_PEER, {
              directChatId: callSession.directChatId,
            })
          }
          cleanup()
          break
      }
    })

    // **FIX CHÍNH: Perfect Negotiation Pattern**
    clientSocket.callSocket.on(EVoiceCallEvents.call_offer_answer, async (SDP, type) => {
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

      try {
        if (type === ESDPType.OFFER) {
          emitLog("received an offer")
          receivedOfferRef.current = true

          // **Perfect Negotiation: Polite peer (callee) rollback nếu đang tạo offer**
          const offerCollision =
            type === ESDPType.OFFER &&
            (makingOfferRef.current || p2pConnection.signalingState !== "stable")

          const ignoreOffer = !isCallerRef.current && offerCollision

          if (ignoreOffer) {
            console.log(">>> Ignoring offer due to collision (polite peer)")
            return
          }

          // Rollback nếu cần
          if (offerCollision) {
            console.log(">>> Rollback local description")
            await Promise.all([p2pConnection.setLocalDescription({ type: "rollback" })])
          }

          isSettingRemoteDescriptionRef.current = true

          await ensurePeer()
          await attachMic()
          await p2pConnection.setRemoteDescription({ sdp: SDP, type: "offer" })

          flushIceCandidates()

          const answer = await p2pConnection.createAnswer()
          await p2pConnection.setLocalDescription(answer)

          clientSocket.callSocket.emit(EVoiceCallEvents.call_offer_answer, {
            sessionId: callSession.id,
            SDP: answer.sdp!,
            type: ESDPType.ANSWER,
          })

          isSettingRemoteDescriptionRef.current = false
        } else if (type === ESDPType.ANSWER) {
          emitLog("received an answer")
          if (p2pConnection.signalingState !== "have-local-offer") {
            console.warn(
              `>>> [SDP Handler] Ignoring answer because signaling state is not 'have-local-offer'. Current state: ${p2pConnection.signalingState}`
            )
            return
          }
          isSettingRemoteDescriptionRef.current = true
          await p2pConnection.setRemoteDescription({ sdp: SDP, type: "answer" })
          flushIceCandidates()
          isSettingRemoteDescriptionRef.current = false

          dispatch(updateCallSession({ status: EVoiceCallStatus.CONNECTED }))
        }
      } catch (error) {
        console.error(`Failed to process SDP: ${error}`)
        toaster.error("Failed to establish voice call, please try again later!")
        isSettingRemoteDescriptionRef.current = false
      }
    })

    clientSocket.callSocket.on(
      EVoiceCallEvents.call_ice,
      async (candidate: string, sdpMid?: string, sdpMLineIndex?: number) => {
        const p2pConnection = p2pConnectionRef.current

        if (!p2pConnection) {
          pendingIceCandidatesRef.current.push({ candidate, sdpMid, sdpMLineIndex })
          return
        }

        if (!p2pConnection.remoteDescription) {
          pendingIceCandidatesRef.current.push({ candidate, sdpMid, sdpMLineIndex })
          return
        }

        try {
          await p2pConnection.addIceCandidate({ candidate, sdpMid, sdpMLineIndex })
        } catch (err) {
          console.error("❌ addIceCandidate error:", err)
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
      clientSocket.callSocket.off(EVoiceCallEvents.call_request)
      clientSocket.callSocket.off(EVoiceCallEvents.call_status)
      clientSocket.callSocket.off(EVoiceCallEvents.call_offer_answer)
      clientSocket.callSocket.off(EVoiceCallEvents.call_ice)
      clientSocket.callSocket.off(EVoiceCallEvents.call_hangup)
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
