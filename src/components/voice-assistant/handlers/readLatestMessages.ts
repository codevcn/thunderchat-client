import type { SpeakFn } from "../types/speakFn"

export interface ReadLatestMessagesArgs {
  responseText: string
  rate: number
  speakText: SpeakFn
}

/**
 * Frontend helper for reading messages.
 * Note: Backend already generates TTS text. This simply speaks it.
 */
export const handleReadLatestMessages = async (args: ReadLatestMessagesArgs) => {
  const { responseText, rate, speakText } = args
  await speakText(responseText, rate, false)
}
