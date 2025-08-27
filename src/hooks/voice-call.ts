import { useEffect, useRef } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"
import type { TUnknownFunction } from "@/utils/types/global"
import type { TCallRequestEmitRes } from "@/utils/types/socket"
import { EHangupReason, ESDPType, EVoiceCallStatus } from "@/utils/enums"
import {
  resetCallSession,
  setCallSession,
  updateCallSession,
} from "@/redux/voice-call/layout.slice"
import { toaster } from "@/utils/toaster"

const DEFAULT_STUN_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }]
const AUTO_CLEANUP_TIMEOUT: number = 10000

export function useVoiceCall() {
  const { callSession } = useAppSelector(({ "voice-call": voiceCall }) => voiceCall)
  const p2pConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const receivedOfferRef = useRef<boolean>(false)
  const dispatch = useAppDispatch()

  function createPeerConnection(
    iceServers: RTCIceServer[] = DEFAULT_STUN_SERVERS
  ): RTCPeerConnection {
    const p2pConnection = new RTCPeerConnection({ iceServers })
    p2pConnection.onconnectionstatechange = () => {
      console.log(">>> [P2P Connection] state:", p2pConnection.connectionState)
    }
    return p2pConnection
  }

  async function getMicStream(): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  }

  // Khởi tạo PC + stream
  async function ensurePeer() {
    if (p2pConnectionRef.current) return
    p2pConnectionRef.current = createPeerConnection()
    remoteStreamRef.current = new MediaStream()

    // Khi nhận được audio track từ peer khác, thêm vào remoteStreamRef, cho phép nghe được audio từ peer khác
    p2pConnectionRef.current.ontrack = (e) => {
      e.streams[0].getAudioTracks().forEach((track) => {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream()
        }
        remoteStreamRef.current.addTrack(track)
      })
    }

    // Khi nhận được candidate từ peer khác, gửi lại cho peer
    p2pConnectionRef.current.onicecandidate = (event) => {
      if (!event.candidate || !callSession) return
      clientSocket.socket.emit(ESocketEvents.call_ice, {
        sessionId: callSession.id,
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid || undefined,
        sdpMLineIndex: event.candidate.sdpMLineIndex || undefined,
      })
    }
  }

  async function attachMic() {
    if (!p2pConnectionRef.current) await ensurePeer()
    if (!localStreamRef.current) localStreamRef.current = await getMicStream()
    localStreamRef.current
      .getTracks()
      .forEach((track) => p2pConnectionRef.current!.addTrack(track, localStreamRef.current!))
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
    clientSocket.socket.emit(ESocketEvents.call_request, { calleeUserId, directChatId }, callback)
  }

  async function sendOffer() {
    const p2pConnection = p2pConnectionRef.current
    if (!p2pConnection) return
    const offer = await p2pConnection.createOffer()
    await p2pConnection.setLocalDescription(offer)
    const offerSdp = offer.sdp
    if (callSession && offerSdp) {
      clientSocket.socket.emit(ESocketEvents.call_offer_answer, {
        sessionId: callSession.id,
        SDP: offerSdp,
        type: ESDPType.OFFER,
      })
    }
  }

  // Nhận cuộc gọi đến
  async function acceptCall() {
    if (!callSession) return
    await ensurePeer()
    await attachMic()
    dispatch(updateCallSession({ status: EVoiceCallStatus.ACCEPTED }))
    clientSocket.socket.emit(ESocketEvents.call_accept, { sessionId: callSession.id })
  }

  function rejectCall() {
    if (!callSession) return
    dispatch(updateCallSession({ status: EVoiceCallStatus.REJECTED }))
    clientSocket.socket.emit(ESocketEvents.call_reject, { sessionId: callSession.id })
  }

  async function hangupCall(reason: EHangupReason = EHangupReason.NORMAL) {
    if (!callSession) return
    clientSocket.socket.emit(ESocketEvents.call_hangup, { sessionId: callSession.id, reason })
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
    clientSocket.socket.on(ESocketEvents.call_request, (activeCallSession) => {
      dispatch(setCallSession(activeCallSession))
      clientSocket.socket.emit(ESocketEvents.callee_set_session, {
        sessionId: activeCallSession.id,
      })
      autoCleanup()
    })

    clientSocket.socket.on(ESocketEvents.callee_set_session, () => {
      sendOffer()
    })

    clientSocket.socket.on(ESocketEvents.call_status, (status) => {
      switch (status) {
        case EVoiceCallStatus.ACCEPTED:
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

    clientSocket.socket.on(ESocketEvents.call_offer_answer, async (SDP, type) => {
      const p2pConnection = p2pConnectionRef.current
      if (!p2pConnection || !callSession) return
      if (type === ESDPType.OFFER) {
        receivedOfferRef.current = true
        await ensurePeer()
        await attachMic()
        await p2pConnection.setRemoteDescription({ sdp: SDP, type })
        const answer = await p2pConnection.createAnswer()
        await p2pConnection.setLocalDescription(answer)
        clientSocket.socket.emit(ESocketEvents.call_offer_answer, {
          sessionId: callSession.id,
          SDP: answer.sdp!,
          type: ESDPType.ANSWER,
        })
      } else if (type === ESDPType.ANSWER) {
        await p2pConnection.setRemoteDescription({ sdp: SDP, type })
        dispatch(updateCallSession({ status: EVoiceCallStatus.CONNECTED }))
      }
    })

    clientSocket.socket.on(
      ESocketEvents.call_ice,
      async (candidate: string, sdpMid?: string, sdpMLineIndex?: number) => {
        const p2pConnection = p2pConnectionRef.current
        if (!p2pConnection) return
        try {
          await p2pConnection.addIceCandidate({
            candidate,
            sdpMid,
            sdpMLineIndex,
          })
        } catch (error) {
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
      clientSocket.socket.off(ESocketEvents.call_request)
      clientSocket.socket.off(ESocketEvents.callee_set_session)
      clientSocket.socket.off(ESocketEvents.call_status)
      clientSocket.socket.off(ESocketEvents.call_offer_answer)
      clientSocket.socket.off(ESocketEvents.call_ice)
    }
  }, [])

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
