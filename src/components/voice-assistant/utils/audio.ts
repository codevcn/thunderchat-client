import { TIMING } from "../constants"

/**
 * Convert Blob to Base64 string
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Play a short beep sound to indicate wake word detection
 */
export const playBeep = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800 // Frequency in Hz
    oscillator.type = "sine"

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + TIMING.BEEP_DURATION
    )

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + TIMING.BEEP_DURATION)
  } catch (err) {
    console.warn("⚠️ Không phát được beep:", err)
  }
}
