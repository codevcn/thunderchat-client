import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type { TActiveVoiceCallSession } from "@/utils/types/global"
import { TDeepPartial, THierarchyKeyObject } from "@/utils/types/utility-types"
import { updateObjectByPath } from "@/utils/helpers"

type TVoiceCallState = {
  callSession: TActiveVoiceCallSession | null
  incomingCallSession: TActiveVoiceCallSession | null // Thêm: Trạng thái toàn cục cho incoming call
}

const initialState: TVoiceCallState = {
  callSession: null,
  incomingCallSession: null,
}

export const voiceCallSlice = createSlice({
  name: "voice-call",
  initialState,
  reducers: {
    setCallSession: (state, action: PayloadAction<TActiveVoiceCallSession | null>) => {
      state.callSession = action.payload
    },
    updateCallSession: (
      state,
      action: PayloadAction<TDeepPartial<THierarchyKeyObject<TActiveVoiceCallSession>>>
    ) => {
      const updates = action.payload
      const callSession = state.callSession
      if (callSession) {
        updateObjectByPath<TActiveVoiceCallSession>(callSession, updates)
      }
    },
    resetCallSession: (state) => {
      state.callSession = null
    },
    // Thêm actions cho incoming call
    setIncomingCallSession: (state, action: PayloadAction<TActiveVoiceCallSession | null>) => {
      state.incomingCallSession = action.payload
    },
    resetIncomingCallSession: (state) => {
      state.incomingCallSession = null
    },
    updateIncomingCallSession: (
      state,
      action: PayloadAction<TDeepPartial<THierarchyKeyObject<TActiveVoiceCallSession>>>
    ) => {
      const updates = action.payload
      const incomingSession = state.incomingCallSession
      if (incomingSession) {
        updateObjectByPath<TActiveVoiceCallSession>(incomingSession, updates)
      }
    },
  },
})

export const {
  setCallSession,
  updateCallSession,
  resetCallSession,
  setIncomingCallSession,
  resetIncomingCallSession,
  updateIncomingCallSession,
} = voiceCallSlice.actions
