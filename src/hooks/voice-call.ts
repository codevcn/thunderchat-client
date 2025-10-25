import { useEffect, useRef, useState } from "react"
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
  setIncomingCallSession,
} from "@/redux/call/layout.slice"
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

  // **VIDEO: Thêm state để track video**
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const isVideoCallRef = useRef(false) // Track xem đây có phải video call không

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
          remoteStreamRef.current?.getAudioTracks().forEach((track) => {
            remoteStreamRef.current?.removeTrack(track)
          })
          stream.getAudioTracks().forEach((track) => {
            remoteStreamRef.current?.addTrack(track)
          })
        } else if (e.track.kind === "video") {
          remoteStreamRef.current?.getVideoTracks().forEach((track) => {
            remoteStreamRef.current?.removeTrack(track)
          })

          stream.getVideoTracks().forEach((track) => {
            remoteStreamRef.current?.addTrack(track)
          })

          if (remoteStreamRef.current) {
            console.log(">>> Refreshing remote video element")
            eventEmitter.emit(EInternalEvents.REMOTE_VIDEO_UPDATED, remoteStreamRef.current)

            setTimeout(() => {
              eventEmitter.emit(EInternalEvents.REMOTE_VIDEO_UPDATED, remoteStreamRef.current!)
            }, 100)
          }
        }
      } else {
        remoteStreamRef.current?.addTrack(e.track)
        if (e.track.kind === "video") {
          if (remoteStreamRef.current) {
            eventEmitter.emit(EInternalEvents.REMOTE_VIDEO_UPDATED, remoteStreamRef.current)
            setTimeout(() => {
              eventEmitter.emit(EInternalEvents.REMOTE_VIDEO_UPDATED, remoteStreamRef.current!)
            }, 100)
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

    p2pConnectionRef.current.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true
        emitLog("[P2P Connection] negotiation needed")

        const callSession = store.getState()["voice-call"].callSession
        if (!callSession) return

        const offer = await p2pConnectionRef.current!.createOffer()

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

  // **VIDEO: Sửa lại hàm lấy media stream để hỗ trợ video**
  async function getMediaStream(withVideo: boolean = false): Promise<MediaStream> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Media devices not supported in this environment")
    }
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: withVideo
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        : false,
    })
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

  // **VIDEO: Thêm hàm toggle video**
  async function toggleVideo(): Promise<boolean> {
    const p2pConnection = p2pConnectionRef.current

    if (!localStreamRef.current) {
      console.log(">>> [toggleVideo] No local stream")
      return false
    }

    const videoTracks = localStreamRef.current.getVideoTracks()

    if (isVideoEnabled && videoTracks.length > 0) {
      // Tắt video
      videoTracks.forEach((track) => {
        track.stop()
        localStreamRef.current?.removeTrack(track)
      })

      // Remove video sender
      if (p2pConnection) {
        const senders = p2pConnection.getSenders()
        senders.forEach((sender) => {
          if (sender.track?.kind === "video") {
            p2pConnection.removeTrack(sender)
          }
        })
      }

      setIsVideoEnabled(false)
      console.log(">>> Video disabled")
      return false
    } else {
      // Bật video
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })

        const videoTrack = videoStream.getVideoTracks()[0]
        localStreamRef.current.addTrack(videoTrack)

        // Add video track to peer connection
        if (p2pConnection) {
          p2pConnection.addTrack(videoTrack, localStreamRef.current)
        }

        setIsVideoEnabled(true)
        console.log(">>> Video enabled")
        return true
      } catch (error) {
        console.error(">>> Failed to enable video:", error)
        toaster.error("Không thể bật camera")
        return false
      }
    }
  }

  function initRemoteStream() {
    remoteStreamRef.current = new MediaStream()
    eventEmitter.emit(EInternalEvents.INIT_REMOTE_STREAM)
  }

  // **VIDEO: Sửa attachMic thành attachMedia để hỗ trợ video**
  async function attachMedia(withVideo: boolean = false) {
    if (localStreamRef.current) {
      console.log("🎙️ [attachMedia] Stream already exists, reusing")
      return
    }

    try {
      const stream = await getMediaStream(withVideo)
      localStreamRef.current = stream
      console.log("🎙️ [attachMedia] Got local stream:", stream)

      // Track video state
      if (withVideo) {
        setIsVideoEnabled(true)
      }

      stream.getTracks().forEach((track) => {
        console.log("🎙️ [attachMedia] Adding track:", track.kind)
        p2pConnectionRef.current?.addTrack(track, stream)
      })
    } catch (err) {
      console.error("❌ [attachMedia] Failed to get media:", err)
      throw err
    }
  }

  function getLocalStream() {
    return localStreamRef.current
  }

  function getRemoteStream() {
    return remoteStreamRef.current
  }

  async function startCall(
    calleeUserId: number,
    directChatId: number,
    callback: TUnknownFunction<TCallRequestEmitRes, void>,
    isVideoCall: boolean = false
  ) {
    isCallerRef.current = true
    isVideoCallRef.current = isVideoCall

    await ensurePeer()
    await attachMedia(isVideoCall) // Truyền flag video vào

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
      if (p2pConnection.signalingState !== "stable") {
        console.warn(
          `[sendOffer] Skip creating offer, signaling state = ${p2pConnection.signalingState}`
        )
        return
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

  async function acceptCall() {
    try {
      isCallerRef.current = false

      const activeCallSession = incomingCallSession || tempActiveCallSessionRef.current
      console.log("activeCallSession in accept:", activeCallSession)

      if (!activeCallSession) {
        console.log("No session for accept - return early")
        return
      }

      dispatch(setCallSession(activeCallSession))
      dispatch(resetIncomingCallSession())

      await ensurePeer()
      // **VIDEO: Khi accept call, không tự động bật video**
      await attachMedia(false)

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
    dispatch(updateIncomingCallSession({ status: EVoiceCallStatus.REJECTED }))
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

    isCallerRef.current = false
    makingOfferRef.current = false
    isSettingRemoteDescriptionRef.current = false
    receivedOfferRef.current = false
    pendingIceCandidatesRef.current = []

    // **VIDEO: Reset video state**
    setIsVideoEnabled(false)
    isVideoCallRef.current = false
  }

  function autoCleanup() {
    setTimeout(() => {
      if (!receivedOfferRef.current) {
        cleanup()
      }
    }, AUTO_CLEANUP_TIMEOUT)
  }

  function registerSocketListeners() {
    console.log("🎯 [registerSocketListeners] Starting registration")
    console.log("🔌 [Socket] Connected:", clientSocket.callSocket.connected)
    console.log("🔌 [Socket] ID:", clientSocket.callSocket.id)

    clientSocket.callSocket.on(EVoiceCallEvents.call_request, (activeCallSession) => {
      emitLog("Call request received")
      dispatch(
        setIncomingCallSession({
          ...activeCallSession,
          status: EVoiceCallStatus.RINGING,
        })
      )
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
          await attachMedia(isVideoCallRef.current) // Sử dụng flag video
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
          toaster.info("case ended.")
          if (callSession) {
            eventEmitter.emit(EInternalEvents.CALL_CANCELLED_BY_PEER, {
              directChatId: callSession.directChatId,
            })
          }
          cleanup()
          break
      }
    })

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

          const offerCollision =
            type === ESDPType.OFFER &&
            (makingOfferRef.current || p2pConnection.signalingState !== "stable")

          const ignoreOffer = !isCallerRef.current && offerCollision

          if (ignoreOffer) {
            console.log(">>> Ignoring offer due to collision (polite peer)")
            return
          }

          if (offerCollision) {
            console.log(">>> Rollback local description")
            await Promise.all([p2pConnection.setLocalDescription({ type: "rollback" })])
          }

          isSettingRemoteDescriptionRef.current = true

          await ensurePeer()
          await attachMedia(false) // Callee không tự động bật video
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
          console.error(" addIceCandidate error:", err)
        }
      }
    )
  }

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
    console.log("🔧 [useVoiceCall] REGISTERING socket listeners")
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
    toggleVideo, // **VIDEO: Export toggleVideo**
    isVideoEnabled, // **VIDEO: Export isVideoEnabled state**
  }
}
