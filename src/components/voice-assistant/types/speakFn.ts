/**
 * Common type for TTS speak function used across voice assistant handlers
 */
export type SpeakFn = (text: string, rate?: number, waitForConfirmation?: boolean) => Promise<void>
