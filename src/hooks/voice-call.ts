// hooks/useVoiceCall.ts
import { useEffect, useRef } from "react"
import { useAppSelector } from "@/hooks/redux"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"

type IcePayload = { sessionId: string; candidate: string; sdpMid?: string; sdpMLineIndex?: number }
type SdpPayload = { sessionId: string; sdp: string; type: "offer" | "answer" }

type PcBundle = {
  pc: RTCPeerConnection
  localStream: MediaStream | null
}

function createPeerConnection(iceServers?: RTCIceServer[]): RTCPeerConnection {
  const pc = new RTCPeerConnection({
    iceServers: iceServers || [{ urls: "stun:stun.l.google.com:19302" }],
  })
  pc.onconnectionstatechange = () => {
    console.log(">>> [P2P Connection] state:", pc.connectionState)
  }
  return pc
}

async function getMicStream(): Promise<MediaStream> {
  // Lưu ý: Autoplay policy — cần tương tác user (click) trước khi getUserMedia.
  return navigator.mediaDevices.getUserMedia({ audio: true, video: false })
}

export function useVoiceCall() {
  const { callSession } = useAppSelector(({ "voice-call": voiceCall }) => voiceCall)
  const p2pConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)

  // Khởi tạo PC + stream
  async function ensurePeer() {
    if (p2pConnectionRef.current) return
    p2pConnectionRef.current = createPeerConnection()
    remoteStreamRef.current = new MediaStream()

    p2pConnectionRef.current.ontrack = (e) => {
      // audio remote
      e.streams[0].getAudioTracks().forEach((t) => {
        if (!remoteStreamRef.current) remoteStreamRef.current = new MediaStream()
        remoteStreamRef.current!.addTrack(t)
      })
      // gán vào thẻ audio bên ngoài qua getter getRemoteStream()
    }

    p2pConnectionRef.current.onicecandidate = (event) => {
      if (!event.candidate || !callSession?.id) return
      const payload: IcePayload = {
        sessionId: `${callSession.id}`,
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid ?? undefined,
        sdpMLineIndex: event.candidate.sdpMLineIndex ?? undefined,
      }
      clientSocket.socket.emit(ESocketEvents.call_ice, payload)
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
  async function startCall(calleeUserId: number, directChatId: number) {
    await ensurePeer()
    await attachMic()

    // yêu cầu phiên gọi (server sẽ trả INCOMING cho callee)
    clientSocket.socket.emit(ESocketEvents.call_request, { calleeUserId, directChatId })

    setState({ status: "RINGING_OUT", peerUserId: calleeUserId, directChatId })
  }

  // Nhận cuộc gọi đến (server đã emit 'CALL_VOICE/INCOMING')
  async function acceptCall(incomingSessionId: string, fromUserId: string) {
    if (!socket) return
    await ensurePeer()
    await attachMic()

    setState({ sessionId: incomingSessionId, peerUserId: fromUserId, status: "ACCEPTED" })
    socket.emit("CALL_VOICE/ACCEPT", { sessionId: incomingSessionId })

    // Tạo Answer: chờ OFFER từ caller → handle ở listener 'CALL_VOICE/OFFER'
  }

  function rejectCall(incomingSessionId: string) {
    if (!socket) return
    socket.emit("CALL_VOICE/REJECT", { sessionId: incomingSessionId })
    setState({ status: "ENDED", sessionId: undefined, peerUserId: undefined })
  }

  async function hangup(reason: string = "NORMAL") {
    if (!socket || !useCallStore.getState().sessionId) return
    const sid = useCallStore.getState().sessionId!
    socket.emit("CALL_VOICE/END", { sessionId: sid, reason })
    cleanup()
  }

  function cleanup() {
    try {
      localRef.current?.getTracks().forEach((t) => t.stop())
    } catch {}
    localRef.current = null
    remoteRef.current = null
    try {
      pcRef.current?.getSenders().forEach((s) => pcRef.current?.removeTrack(s))
    } catch {}
    pcRef.current?.close()
    pcRef.current = null
    useCallStore.getState().reset()
  }

  // Đăng ký listener socket
  useEffect(() => {
    if (!socket) return

    // Server ack khi gửi REQUEST
    socket.on(
      "CALL_VOICE/REQUEST_ACK",
      ({ sessionId, delivered }: { sessionId: string; delivered: boolean }) => {
        useCallStore.getState().setState({ sessionId })
        if (!delivered) useCallStore.getState().setState({ status: "OFFLINE" })
      }
    )

    // Callee: nhận mời gọi
    socket.on(
      "CALL_VOICE/INCOMING",
      ({ sessionId, fromUserId }: { sessionId: string; fromUserId: string }) => {
        setState({ sessionId, peerUserId: fromUserId, status: "RINGING_IN" })
      }
    )

    // Trạng thái hệ thống (BUSY/OFFLINE/TIMEOUT/ENDED/ESTABLISHED/ACCEPTED...)
    socket.on("CALL_VOICE/STATUS", (p: { status: string; message?: string; reason?: string }) => {
      // gom 1 số mapping tối giản
      const map: Record<string, any> = {
        BUSY: "BUSY",
        OFFLINE: "OFFLINE",
        TIMEOUT: "TIMEOUT",
        ENDED: "ENDED",
        ACCEPTED: "ACCEPTED",
        ESTABLISHED: "ESTABLISHED",
        FAILED: "FAILED",
        RINGING: "RINGING_OUT",
        REJECTED: "ENDED",
      }
      const st = map[p.status] ?? "FAILED"
      setState({ status: st, reason: p.reason ?? p.message })
      if (
        st === "ENDED" ||
        st === "FAILED" ||
        st === "TIMEOUT" ||
        st === "OFFLINE" ||
        st === "BUSY"
      ) {
        // dọn dẹp nếu cần
      }
    })

    // === Signaling: OFFER → Callee nhận ===
    socket.on(
      "CALL_VOICE/OFFER",
      async ({ sdp, type, sessionId }: SdpPayload & { sessionId: string }) => {
        await ensurePeer()
        await attachMic()
        await pcRef.current!.setRemoteDescription({ sdp, type }) // type = "offer"
        const answer = await pcRef.current!.createAnswer()
        await pcRef.current!.setLocalDescription(answer)
        socket.emit("CALL_VOICE/ANSWER", { sessionId, sdp: answer.sdp!, type: "answer" })
      }
    )

    // === Signaling: ANSWER → Caller nhận ===
    socket.on("CALL_VOICE/ANSWER", async ({ sdp, type }: SdpPayload) => {
      if (!pcRef.current) return
      await pcRef.current.setRemoteDescription({ sdp, type }) // type = "answer"
      useCallStore.getState().setState({ status: "ESTABLISHED" })
    })

    // === Signaling: ICE (cả 2 chiều) ===
    socket.on("CALL_VOICE/ICE", async (dto: IcePayload) => {
      if (!pcRef.current) return
      try {
        await pcRef.current.addIceCandidate({
          candidate: dto.candidate,
          sdpMid: dto.sdpMid,
          sdpMLineIndex: dto.sdpMLineIndex,
        })
      } catch (e) {
        console.warn("[ICE] addIceCandidate error", e)
      }
    })

    return () => {
      socket.off("CALL_VOICE/REQUEST_ACK")
      socket.off("CALL_VOICE/INCOMING")
      socket.off("CALL_VOICE/STATUS")
      socket.off("CALL_VOICE/OFFER")
      socket.off("CALL_VOICE/ANSWER")
      socket.off("CALL_VOICE/ICE")
    }
  }, [socket, setState])

  // Caller tạo OFFER sau khi callee ACCEPT
  async function sendOfferIfCaller() {
    if (!pcRef.current) await ensurePeer()
    await attachMic()
    const offer = await pcRef.current!.createOffer()
    await pcRef.current!.setLocalDescription(offer)
    if (sessionId) {
      // gửi lên server
      socket?.emit("CALL_VOICE/OFFER", { sessionId, sdp: offer.sdp!, type: "offer" })
    }
  }

  return {
    status,
    sessionId,
    peerUserId,
    startCall,
    acceptCall,
    rejectCall,
    hangup,
    cleanup,
    sendOfferIfCaller,
    getLocalStream,
    getRemoteStream,
  }
}
