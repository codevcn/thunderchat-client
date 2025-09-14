import { useEffect, useRef } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { clientSocket } from "@/utils/socket/client-socket"
import { EVoiceCallEvents } from "@/utils/socket/events"
import type { TActiveVoiceCallSession, TUnknownFunction } from "@/utils/types/global"
import type { TCallRequestEmitRes } from "@/utils/types/socket"
import { EHangupReason, ESDPType, EVoiceCallStatus } from "@/utils/enums"
import {
  resetCallSession,
  setCallSession,
  updateCallSession,
} from "@/redux/voice-call/layout.slice"
import { toaster } from "@/utils/toaster"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import store from "@/redux/store"
import { emitLog } from "@/utils/helpers"

const DEFAULT_STUN_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }]
const AUTO_CLEANUP_TIMEOUT: number = 10000

export function useVoiceCall() {
  const { callSession } = useAppSelector(({ "voice-call": voiceCall }) => voiceCall)
  const p2pConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const receivedOfferRef = useRef<boolean>(false)
  const tempActiveCallSessionRef = useRef<TActiveVoiceCallSession | null>(null)
  const dispatch = useAppDispatch()

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

  async function getMicStream(): Promise<MediaStream> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Media devices not supported in this environment")
    }
    return navigator.mediaDevices.getUserMedia({ audio: true, video: false })
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
      callback
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
    } catch (error) {
      if (error instanceof Error) {
        toaster.error(error.message)
      } else {
        toaster.error("Failed to send offer")
      }
    }
  }

  // Nhận cuộc gọi đến
  async function acceptCall() {
    try {
      const activeCallSession = tempActiveCallSessionRef.current
      if (!activeCallSession) return
      dispatch(setCallSession(activeCallSession))
      await ensurePeer()
      emitLog(`[acceptCall] ensurePeer done: ${p2pConnectionRef.current}`)
      await attachMic()
      clientSocket.voiceCallSocket.emit(EVoiceCallEvents.call_accept, {
        sessionId: activeCallSession.id,
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
    if (!callSession) return
    dispatch(updateCallSession({ status: EVoiceCallStatus.REJECTED }))
    clientSocket.voiceCallSocket.emit(EVoiceCallEvents.call_reject, { sessionId: callSession.id })
  }

  async function hangupCall(reason: EHangupReason = EHangupReason.NORMAL) {
    if (!callSession) return
    clientSocket.voiceCallSocket.emit(EVoiceCallEvents.call_hangup, {
      sessionId: callSession.id,
      reason,
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

    clientSocket.voiceCallSocket.on(EVoiceCallEvents.call_status, (status, callSession) => {
      switch (status) {
        case EVoiceCallStatus.ACCEPTED:
          emitLog("call accepted, sending an offer")
          if (callSession) {
            dispatch(setCallSession(callSession))
          }
          sendOffer()
          break
        case EVoiceCallStatus.REJECTED:
          break
        case EVoiceCallStatus.CANCELLED:
          break
        case EVoiceCallStatus.BUSY:
          break
        case EVoiceCallStatus.OFFLINE:
          break
        case EVoiceCallStatus.TIMEOUT:
          break
        case EVoiceCallStatus.ENDED:
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
  }
}
