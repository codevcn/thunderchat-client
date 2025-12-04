/**
 * Voice Activity Detection (VAD) utilities
 * Advanced speech detection using frequency analysis and zero-crossing rate
 */

export interface VADConfig {
  isConfirmationMode: boolean
  audioContext: AudioContext
  analyser: AnalyserNode
}

export interface VADResult {
  energy: number
  isSpeech: boolean
  confidence: number
}

export interface VADThresholds {
  INITIAL_SILENCE_THRESHOLD: number
  SPEECH_THRESHOLD_MULTIPLIER: number
  MIN_SPEECH_ENERGY: number
  SILENCE_DURATION: number
  TRAILING_SILENCE: number
  MIN_SPEECH_DURATION: number
  MAX_RECORDING_TIME: number
  STARTUP_GRACE_PERIOD: number
  SILENCE_FRAMES_THRESHOLD: number
  VOICE_FREQUENCY_LOW: number
  VOICE_FREQUENCY_HIGH: number
}

export interface VADState {
  energyHistory: number[]
  baselineNoise: number
  hasSpoken: boolean
  speechStartTime: number | null
  lastSpeechTime: number | null
  silenceStart: number | null
  continuousSilenceCount: number
  recordingStartTime: number
}

const HISTORY_SIZE = 20

export function getVADThresholds(isConfirmationMode: boolean): VADThresholds {
  return {
    INITIAL_SILENCE_THRESHOLD: 25,
    SPEECH_THRESHOLD_MULTIPLIER: 2.0,
    MIN_SPEECH_ENERGY: 25,
    SILENCE_DURATION: isConfirmationMode ? 2000 : 2000,
    TRAILING_SILENCE: 500,
    MIN_SPEECH_DURATION: isConfirmationMode ? 600 : 600,
    MAX_RECORDING_TIME: isConfirmationMode ? 10000 : 10000,
    STARTUP_GRACE_PERIOD: isConfirmationMode ? 1000 : 1000,
    SILENCE_FRAMES_THRESHOLD: isConfirmationMode ? 15 : 40,
    VOICE_FREQUENCY_LOW: 85,
    VOICE_FREQUENCY_HIGH: 255,
  }
}

export function createVADState(): VADState {
  return {
    energyHistory: [],
    baselineNoise: 0,
    hasSpoken: false,
    speechStartTime: null,
    lastSpeechTime: null,
    silenceStart: null,
    continuousSilenceCount: 0,
    recordingStartTime: Date.now(),
  }
}

export function calculateSpeechProbability(
  config: VADConfig,
  state: VADState,
  thresholds: VADThresholds
): VADResult {
  const { analyser, audioContext, isConfirmationMode } = config
  const { energyHistory, baselineNoise, hasSpoken } = state

  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  const timeDataArray = new Uint8Array(analyser.fftSize)

  analyser.getByteFrequencyData(dataArray)
  analyser.getByteTimeDomainData(timeDataArray)

  // 1. Frequency energy (focus on voice range)
  const LOW_FREQ_BIN = Math.floor(
    (thresholds.VOICE_FREQUENCY_LOW * bufferLength) / (audioContext.sampleRate / 2)
  )
  const HIGH_FREQ_BIN = Math.floor(
    (thresholds.VOICE_FREQUENCY_HIGH * bufferLength) / (audioContext.sampleRate / 2)
  )

  let voiceRangeEnergy = 0
  for (let i = LOW_FREQ_BIN; i < HIGH_FREQ_BIN && i < dataArray.length; i++) {
    voiceRangeEnergy += dataArray[i]
  }
  voiceRangeEnergy /= HIGH_FREQ_BIN - LOW_FREQ_BIN

  // 2. Total energy
  const totalEnergy = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength

  // 3. Zero-crossing rate (speech has moderate ZCR)
  let zeroCrossings = 0
  for (let i = 1; i < timeDataArray.length; i++) {
    if (
      (timeDataArray[i] >= 128 && timeDataArray[i - 1] < 128) ||
      (timeDataArray[i] < 128 && timeDataArray[i - 1] >= 128)
    ) {
      zeroCrossings++
    }
  }
  const zcr = zeroCrossings / timeDataArray.length

  // 4. Update baseline noise (exponential moving average)
  state.energyHistory.push(totalEnergy)
  if (state.energyHistory.length > HISTORY_SIZE) {
    state.energyHistory.shift()
  }

  if (!hasSpoken && energyHistory.length >= 5) {
    // Calculate baseline from first few samples (before speech)
    state.baselineNoise =
      energyHistory.slice(0, 10).reduce((a, b) => a + b, 0) / Math.min(10, energyHistory.length)
  }

  // 5. Adaptive threshold
  const adaptiveThreshold = Math.max(
    thresholds.INITIAL_SILENCE_THRESHOLD,
    baselineNoise * thresholds.SPEECH_THRESHOLD_MULTIPLIER,
    thresholds.MIN_SPEECH_ENERGY
  )

  // 6. Speech detection logic
  const energyCondition = isConfirmationMode
    ? totalEnergy > Math.max(10, adaptiveThreshold * 0.8)
    : totalEnergy > adaptiveThreshold

  const voiceCondition = isConfirmationMode
    ? voiceRangeEnergy > Math.max(5, adaptiveThreshold * 0.3)
    : voiceRangeEnergy > adaptiveThreshold * 0.6

  const zcrCondition = isConfirmationMode ? zcr > 0.05 && zcr < 0.8 : zcr > 0.08 && zcr < 0.65

  const conditionsMet = [energyCondition, voiceCondition, zcrCondition].filter(Boolean).length
  const isSpeech = isConfirmationMode ? conditionsMet >= 1 : conditionsMet >= 2
  const confidence = Math.min(100, (totalEnergy / adaptiveThreshold) * 100)

  return { energy: totalEnergy, isSpeech, confidence }
}

export function updateVADState(
  state: VADState,
  isSpeech: boolean,
  thresholds: VADThresholds
): void {
  const now = Date.now()

  if (isSpeech) {
    if (!state.hasSpoken) {
      state.hasSpoken = true
      state.speechStartTime = now
    }
    state.lastSpeechTime = now
    state.silenceStart = null
    state.continuousSilenceCount = 0
  } else {
    state.continuousSilenceCount++

    if (state.hasSpoken && !state.silenceStart) {
      state.silenceStart = now
    }

    // Check trailing silence (short pauses during speech)
    if (state.lastSpeechTime && now - state.lastSpeechTime < thresholds.TRAILING_SILENCE) {
      state.silenceStart = null
      state.continuousSilenceCount = 0
    }
  }
}

export function shouldStopRecording(
  state: VADState,
  thresholds: VADThresholds
): { shouldStop: boolean; reason: string } {
  const now = Date.now()

  // Check if in grace period
  if (now - state.recordingStartTime < thresholds.STARTUP_GRACE_PERIOD) {
    return { shouldStop: false, reason: "grace_period" }
  }

  // Check if minimum speech duration met
  if (!state.hasSpoken || !state.speechStartTime) {
    return { shouldStop: false, reason: "no_speech" }
  }

  const speechDuration = now - state.speechStartTime
  if (speechDuration < thresholds.MIN_SPEECH_DURATION) {
    return { shouldStop: false, reason: "min_duration_not_met" }
  }

  // Method 1: Continuous silence frames
  if (state.continuousSilenceCount >= thresholds.SILENCE_FRAMES_THRESHOLD) {
    return {
      shouldStop: true,
      reason: `continuous_silence_frames:${state.continuousSilenceCount}`,
    }
  }

  // Method 2: Time-based silence
  if (state.silenceStart && now - state.silenceStart >= thresholds.SILENCE_DURATION) {
    return { shouldStop: true, reason: `time_based_silence:${now - state.silenceStart}ms` }
  }

  // Method 3: Max recording time
  if (now - state.recordingStartTime >= thresholds.MAX_RECORDING_TIME) {
    return { shouldStop: true, reason: "max_time_reached" }
  }

  return { shouldStop: false, reason: "continue" }
}
