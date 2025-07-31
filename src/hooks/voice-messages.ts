import { useEffect, useState, useCallback, useMemo } from "react"
import { useAppSelector } from "./redux"
import { useVoicePlayer } from "@/contexts/voice-player.context"
import { messageService } from "@/services/message.service"
import { EMessageTypes, ESortTypes } from "@/utils/enums"
import type { TStateDirectMessage } from "@/utils/types/global"

const INITIAL_LOAD_SIZE = 10
const LOAD_SIZE = 5

export const useAudioMessages = () => {
  const { setAudioMessages } = useVoicePlayer()
  const { directChat, directMessages } = useAppSelector(({ messages }) => messages)

  const [allVoices, setAllVoices] = useState<TStateDirectMessage[]>([])
  const [hasMoreOlder, setHasMoreOlder] = useState(false)
  const [hasMoreNewer, setHasMoreNewer] = useState(false)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [isLoadingNewer, setIsLoadingNewer] = useState(false)

  // Load initial voices from directMessages
  const loadInitialVoices = useCallback(() => {
    console.log("🔍 loadInitialVoices called, directMessages:", directMessages?.length || 0)

    if (!directMessages) {
      console.log("❌ No directMessages available")
      return
    }

    const audioMessages = directMessages
      .filter((message: TStateDirectMessage) => message.type === "AUDIO" && message.mediaUrl)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // ASC: cũ nhất trước

    console.log("🎵 Found audio messages:", audioMessages.length)
    console.log(
      "🎵 Audio messages:",
      audioMessages.map((m) => ({ id: m.id, createdAt: m.createdAt }))
    )

    const initialVoices = audioMessages.slice(-INITIAL_LOAD_SIZE) // Lấy 10 mới nhất từ cuối
    console.log("📥 Setting initial voices:", initialVoices.length)

    setAllVoices(initialVoices)
    setHasMoreNewer(audioMessages.length > INITIAL_LOAD_SIZE)
    setHasMoreOlder(false) // Ban đầu không có voices cũ hơn

    console.log("✅ Initial voices set, hasMoreNewer:", audioMessages.length > INITIAL_LOAD_SIZE)
  }, [directMessages])

  // Load older voices
  const loadOlderVoices = useCallback(async () => {
    if (isLoadingOlder || !hasMoreOlder || allVoices.length === 0) return

    setIsLoadingOlder(true)
    try {
      // Tính offset dựa trên số lượng voices đã load
      const offset = allVoices.length
      const olderVoices = await messageService.fetchVoiceMessages(
        directChat!.id,
        LOAD_SIZE,
        offset,
        ESortTypes.ASC
      )

      if (olderVoices.directMessages && olderVoices.directMessages.length > 0) {
        setAllVoices((prev) => [...prev, ...olderVoices.directMessages])
        setHasMoreOlder(olderVoices.directMessages.length === LOAD_SIZE)
      } else {
        setHasMoreOlder(false)
      }
    } catch (error) {
      console.error("Failed to load older voices:", error)
      setHasMoreOlder(false)
    } finally {
      setIsLoadingOlder(false)
    }
  }, [allVoices, isLoadingOlder, hasMoreOlder, directChat])

  // Load newer voices
  const loadNewerVoices = useCallback(async () => {
    if (isLoadingNewer || !hasMoreNewer || allVoices.length === 0) return

    setIsLoadingNewer(true)
    try {
      // Tính offset dựa trên số lượng voices đã load
      const offset = allVoices.length
      const newerVoices = await messageService.fetchVoiceMessages(
        directChat!.id,
        LOAD_SIZE,
        offset,
        ESortTypes.ASC
      )

      if (newerVoices.directMessages && newerVoices.directMessages.length > 0) {
        setAllVoices((prev) => [...prev, ...newerVoices.directMessages])
        setHasMoreNewer(newerVoices.directMessages.length === LOAD_SIZE)
      } else {
        setHasMoreNewer(false)
      }
    } catch (error) {
      console.error("Failed to load newer voices:", error)
      setHasMoreNewer(false)
    } finally {
      setIsLoadingNewer(false)
    }
  }, [allVoices, isLoadingNewer, hasMoreNewer, directChat])

  // Load initial voices when directMessages change
  useEffect(() => {
    loadInitialVoices()
  }, [loadInitialVoices])

  // Update context with current voices
  useEffect(() => {
    console.log("🔄 Updating context with voices:", allVoices.length)
    console.log(
      "🔄 Voices:",
      allVoices.map((v) => ({ id: v.id, createdAt: v.createdAt }))
    )
    setAudioMessages(allVoices)
  }, [allVoices, setAudioMessages])

  return {
    voices: allVoices,
    hasMoreOlder,
    hasMoreNewer,
    isLoadingOlder,
    isLoadingNewer,
    loadOlderVoices,
    loadNewerVoices,
  }
}
