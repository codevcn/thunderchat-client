import { CustomTooltip } from "@/components/materials/tooltip"
import { IconButton } from "@/components/materials/icon-button"
import { Phone, X, Maximize2, MicOff, Video, ScreenShare, PhoneOff } from "lucide-react"
import { useVoiceCall } from "@/hooks/voice-call"
import { useUser } from "@/hooks/user"
import { useEffect, useRef, useState } from "react"
import type { TDirectChat } from "@/utils/types/be-api"
import { EVoiceCallStatus } from "@/utils/enums"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { toaster } from "@/utils/toaster"
import { emitLog, sortEmitLogs } from "@/utils/helpers"
import type { TEmitLogMessage } from "@/utils/types/global"

const holder = (
  <div className="fixed inset-0 z-[9999]">
    <div
      className="absolute inset-0 bg-center bg-cover"
      style={{
        // Replace this URL with your own background image
        backgroundImage: "url('/images/your-bg.webp')",
      }}
    />
    <div className="absolute inset-0 bg-black/40" />

    <div className="relative h-full w-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-start justify-between p-4">
        <button
          className="inline-flex items-center justify-center rounded-full w-10 h-10 text-white/90 hover:text-white hover:bg-white/10 transition"
          aria-label="Enter fullscreen"
        >
          <Maximize2 />
        </button>
        <button
          className="inline-flex items-center justify-center rounded-full w-10 h-10 text-white/90 hover:text-white hover:bg-white/10 transition"
          aria-label="Close"
        >
          <X />
        </button>
      </div>

      {/* Center texts */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-white text-4xl sm:text-5xl font-semibold mb-4">
          Live Stream kiếm tiền
        </h2>
        <p className="text-white/90 text-lg">waiting...</p>
      </div>

      {/* Bottom controls */}
      <div className="pb-8 flex items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <button
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center backdrop-blur transition"
            aria-label="Unmute"
          >
            <MicOff className="w-6 h-6" />
          </button>
          <span className="text-white/90 text-sm">unmute</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center backdrop-blur transition"
            aria-label="Start video"
          >
            <Video className="w-6 h-6" />
          </button>
          <span className="text-white/90 text-sm">start video</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center backdrop-blur transition"
            aria-label="Screencast"
          >
            <ScreenShare className="w-6 h-6" />
          </button>
          <span className="text-white/90 text-sm">screencast</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white inline-flex items-center justify-center shadow-lg transition"
            aria-label="End call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
          <span className="text-white/90 text-sm">end call</span>
        </div>
      </div>
    </div>
  </div>
)

type TCallBoxProps = {
  open: boolean
  directChat: TDirectChat
}

const CallBox = ({ open, directChat }: TCallBoxProps) => {
  const { id: directChatId, creatorId, recipientId } = directChat
  const { startCall, hangupCall, acceptCall, rejectCall, getRemoteStream } = useVoiceCall()
  const user = useUser()!
  const [callState, setCallState] = useState<EVoiceCallStatus>()
  const [logs, setLogs] = useState<TEmitLogMessage[]>([])
  const remoteAudioEleRef = useRef<HTMLAudioElement | null>(null)

  const calleeUserId = creatorId === user.id ? recipientId : creatorId

  const voiceCallHandler = () => {
    if (open) {
      startCall(calleeUserId, directChatId, (res) => {}).catch(() => {
        toaster.error("Failed to start call")
      })
    }
  }

  const listenCallRequestReceived = () => {
    setCallState(EVoiceCallStatus.RINGING)
  }

  const listenInitRemoteStream = () => {
    const remoteStream = getRemoteStream()
    if (remoteStream) {
      const audioEle = remoteAudioEleRef.current
      if (audioEle) {
        audioEle.srcObject = remoteStream
      }
    }
  }

  useEffect(() => {
    voiceCallHandler()
  }, [open])

  useEffect(() => {
    emitLog("Registering for call request received")
    eventEmitter.on(EInternalEvents.INIT_REMOTE_STREAM, listenInitRemoteStream)
    eventEmitter.on(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED, listenCallRequestReceived)
    eventEmitter.on(EInternalEvents.EMIT_LOG, (messages) => {
      setLogs((prev) => [...messages, ...prev])
    })
    return () => {
      emitLog("Un-registering for call request received")
      eventEmitter.off(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED, listenCallRequestReceived)
      eventEmitter.off(EInternalEvents.EMIT_LOG)
    }
  }, [])

  console.log(">>> [CallBox] callState:", callState)

  return (
    <div className="mt-6">
      <button className="p-2 bg-pink-600 w-fit" onClick={() => hangupCall()}>
        end call
      </button>
      <div className="mt-4 w-fit">
        {callState === EVoiceCallStatus.RINGING && (
          <div className="flex gap-6 bg-orange-400">
            <button className="bg-green-500 text-black px-4 py-2 rounded-md" onClick={acceptCall}>
              Accept
            </button>
            <button className="bg-red-500 text-black px-4 py-2 rounded-md" onClick={rejectCall}>
              Reject
            </button>
          </div>
        )}
      </div>
      <audio ref={remoteAudioEleRef} autoPlay playsInline />
      <div className="mt-8 mb-16">
        {sortEmitLogs(logs).map(({ message, order }) => (
          <div
            key={order}
            className="flex gap-2 text-sm text-gray-400 py-2 px-4 rounded-md border-solid border-gray-400 border my-1 w-[280px] truncate"
          >
            <span className="text-xs text-gray-400">
              <span>{order}</span>.
            </span>
            <span className="text-xs text-gray-400">{message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type TVoiceCallProps = {
  canSend: boolean
  directChat: TDirectChat
}

export const VoiceCall = ({ canSend, directChat }: TVoiceCallProps) => {
  const [callBoxOpen, setCallBoxOpen] = useState<boolean>(false)

  return (
    <div className="w-fit">
      <CustomTooltip title="Call" placement="bottom" align="end">
        <div
          className={`${canSend === false ? "pointer-events-none cursor-not-allowed" : ""} w-fit`}
        >
          <IconButton
            onClick={() => setCallBoxOpen(true)}
            className="flex justify-center items-center text-regular-icon-cl w-[40px] h-[40px]"
          >
            <Phone />
          </IconButton>
        </div>
      </CustomTooltip>

      <CallBox open={callBoxOpen} directChat={directChat} />
    </div>
  )
}
