import { useEffect } from "react"
import { useAppDispatch } from "@/hooks/redux"
import { clientSocket } from "@/utils/socket/client-socket"
import { EVoiceCallEvents } from "@/utils/socket/events"
import type { TActiveVoiceCallSession } from "@/utils/types/global"
import { setIncomingCallSession, resetIncomingCallSession } from "@/redux/voice-call/layout.slice"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { emitLog } from "@/utils/helpers"
import { AppDispatch } from "@/redux/store"

export function useGlobalVoiceCallListener() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const handleCallRequest = (activeCallSession: TActiveVoiceCallSession) => {
      emitLog("Global: Nhận incoming call request")
      console.log(">>> [GLOBAL LISTENER] Nhận call_request:", activeCallSession)
      dispatch(setIncomingCallSession(activeCallSession))
      eventEmitter.emit(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED)
    }

    clientSocket.voiceCallSocket.on(EVoiceCallEvents.call_request, handleCallRequest)

    return () => {
      clientSocket.voiceCallSocket.off(EVoiceCallEvents.call_request, handleCallRequest)
      dispatch(resetIncomingCallSession())
    }
  }, [dispatch])
}
export function initGlobalVoiceCallListener(dispatch: AppDispatch) {
  const handleCallRequest = (activeCallSession: TActiveVoiceCallSession) => {
    emitLog("Global: Nhận incoming call request")
    console.log(">>> [GLOBAL LISTENER] Nhận call_request:", activeCallSession)
    dispatch(setIncomingCallSession(activeCallSession))
    eventEmitter.emit(EInternalEvents.VOICE_CALL_REQUEST_RECEIVED)
  }

  clientSocket.voiceCallSocket.on(EVoiceCallEvents.call_request, handleCallRequest)

  // Return cleanup function
  return () => {
    clientSocket.voiceCallSocket.off(EVoiceCallEvents.call_request, handleCallRequest)
    dispatch(resetIncomingCallSession())
  }
}
