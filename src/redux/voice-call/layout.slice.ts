import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type { TActiveVoiceCallSession } from "@/utils/types/global"
import { TDeepPartial, THierarchyKeyObject } from "@/utils/types/utility-types"
import { updateObjectByPath } from "@/utils/helpers"

type TVoiceCallState = {
  callSession: TActiveVoiceCallSession | null
}

const initialState: TVoiceCallState = {
  callSession: null,
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
  },
})

export const { setCallSession, updateCallSession, resetCallSession } = voiceCallSlice.actions
