import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { TVoiceCallSession } from "@/utils/types/be-api"

type TVoiceCallState = {
  callSession: TVoiceCallSession | null
}

const initialState: TVoiceCallState = {
  callSession: null,
}

export const voiceCallSlice = createSlice({
  name: "voice-call",
  initialState,
  reducers: {
    setCallSession: (state, action: PayloadAction<TVoiceCallSession | null>) => {
      state.callSession = action.payload
    },
  },
})

export const { setCallSession } = voiceCallSlice.actions
