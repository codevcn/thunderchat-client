// Voice Activity Detection (VAD) Constants
export const VAD_CONFIG = {
  SILENCE_THRESHOLD: 25, // Ngưỡng âm lượng (0-255) - thấp hơn = im lặng
  SILENCE_DURATION: 1500, // Im lặng 1.5 giây thì dừng
  MIN_SPEECH_DURATION: 800, // Phải nói ít nhất 0.8 giây
  MAX_RECORDING_TIME: 15000, // Tối đa 15 giây
  CHECK_INTERVAL: 100, // Kiểm tra audio level mỗi 100ms
} as const

// Audio Recording Configuration
export const AUDIO_CONFIG = {
  CHANNEL_COUNT: 1,
  SAMPLE_RATE: 16000,
  MIME_TYPE: "audio/webm;codecs=opus",
  FFT_SIZE: 2048,
  SMOOTHING_CONSTANT: 0.8,
} as const

// Porcupine Wake Word Configuration
export const PORCUPINE_CONFIG = {
  SENSITIVITY: 0.9, // 0.0-1.0, mặc định 0.5
  MODEL_PATH: "/models/hey-chat_en_wasm_v3_0_0.ppn",
  PARAMS_PATH: "/models/porcupine_params.pv",
  LABEL: "hey-chat",
} as const

// Timing Constants
export const TIMING = {
  BEEP_DURATION: 0.1, // 100ms beep
  RESTART_DELAY: 1000, // Delay before restarting detection
  CONFIRMATION_DELAY: 500, // Delay after beep before recording
  TTS_RESTART_DELAY: 1500, // Delay after TTS before restart
  ERROR_RESTART_DELAY: 3000, // Delay after error before restart
} as const

// API Retry Configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY: 1000, // 1 second base delay
  MAX_DELAY: 5000, // Maximum 5 seconds delay
} as const
