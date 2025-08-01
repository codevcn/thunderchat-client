"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"
import type { TStateDirectMessage } from "@/utils/types/global"

// Tách thành 2 context riêng biệt
type VoicePlayerStateContextType = {
  isPlaying: boolean
  currentTime: number
  duration: number
  currentAudioUrl: string | null
  currentMessage: TStateDirectMessage | null
  showPlayer: boolean
  playbackRate: number
  audioMessages: TStateDirectMessage[]
  currentAudioIndex: number
  volume: number
}

type VoicePlayerActionsContextType = {
  playAudio: (message: TStateDirectMessage) => Promise<void>
  pauseAudio: () => void
  seekAudio: (time: number) => void
  stopAudio: () => void
  setPlaybackRate: (rate: number) => void
  setVolume: (volume: number) => void
  playNext: () => void
  playPrevious: () => void
  setAudioMessages: (messages: TStateDirectMessage[]) => void
  setShowPlayer: (show: boolean) => void
}

const VoicePlayerStateContext = createContext<VoicePlayerStateContextType | null>(null)
const VoicePlayerActionsContext = createContext<VoicePlayerActionsContextType | null>(null)

export const VoicePlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null)
  const [currentMessage, setCurrentMessage] = useState<TStateDirectMessage | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [audioMessages, setAudioMessages] = useState<TStateDirectMessage[]>([])
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0)
  const [volume, setVolume] = useState(1)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastPausedTimeRef = useRef<number>(0)

  // Actions - đặt ở top level
  const playAudio = useCallback(
    async (message: TStateDirectMessage) => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      const newAudio = new Audio(message.mediaUrl)
      newAudio.volume = volume
      newAudio.playbackRate = playbackRate

      const handleTimeUpdate = () => {
        setCurrentTime(newAudio.currentTime)
        lastPausedTimeRef.current = newAudio.currentTime
      }

      const handleLoadedMetadata = () => {
        setDuration(newAudio.duration)
      }

      const handleEnded = () => {
        setIsPlaying(false)
        setCurrentTime(0)
        lastPausedTimeRef.current = 0
        newAudio.removeEventListener("timeupdate", handleTimeUpdate)
        newAudio.removeEventListener("loadedmetadata", handleLoadedMetadata)
        newAudio.removeEventListener("ended", handleEnded)
      }

      newAudio.addEventListener("timeupdate", handleTimeUpdate)
      newAudio.addEventListener("loadedmetadata", handleLoadedMetadata)
      newAudio.addEventListener("ended", handleEnded)

      try {
        await newAudio.play()
        setIsPlaying(true)
        setCurrentAudioUrl(message.mediaUrl || null)
        setCurrentMessage(message)
        setShowPlayer(true)

        // Tìm index của message trong audioMessages
        const messageIndex = audioMessages.findIndex((msg) => msg.id === message.id)
        if (messageIndex !== -1) {
          setCurrentAudioIndex(messageIndex)
        }

        audioRef.current = newAudio
      } catch (error) {
        console.error("Error playing audio:", error)
      }
    },
    [volume, playbackRate, audioMessages]
  )

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      lastPausedTimeRef.current = audioRef.current.currentTime
    }
  }, [])

  const seekAudio = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
      lastPausedTimeRef.current = time
    }
  }, [])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
      lastPausedTimeRef.current = 0
    }
  }, [])

  const handleSetPlaybackRate = useCallback((rate: number) => {
    setPlaybackRate(rate)
    if (audioRef.current) {
      audioRef.current.playbackRate = rate
    }
  }, [])

  const handleSetVolume = useCallback((vol: number) => {
    setVolume(vol)
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
  }, [])

  const playNext = useCallback(() => {
    if (currentAudioIndex < audioMessages.length - 1) {
      const nextMessage = audioMessages[currentAudioIndex + 1]
      playAudio(nextMessage)
    }
  }, [currentAudioIndex, audioMessages, playAudio])

  const playPrevious = useCallback(() => {
    if (currentAudioIndex > 0) {
      const prevMessage = audioMessages[currentAudioIndex - 1]
      playAudio(prevMessage)
    }
  }, [currentAudioIndex, audioMessages, playAudio])

  const handleSetAudioMessages = useCallback((messages: TStateDirectMessage[]) => {
    setAudioMessages(messages)
  }, [])

  const handleSetShowPlayer = useCallback((show: boolean) => {
    setShowPlayer(show)
  }, [])

  // State context value - chỉ thay đổi khi state thực sự thay đổi
  const stateValue = React.useMemo(
    () => ({
      isPlaying,
      currentTime,
      duration,
      currentAudioUrl,
      currentMessage,
      showPlayer,
      playbackRate,
      audioMessages,
      currentAudioIndex,
      volume,
    }),
    [
      isPlaying,
      currentTime,
      duration,
      currentAudioUrl,
      currentMessage,
      showPlayer,
      playbackRate,
      audioMessages,
      currentAudioIndex,
      volume,
    ]
  )

  // Actions context value - ổn định, không thay đổi
  const actionsValue = React.useMemo(
    () => ({
      playAudio,
      pauseAudio,
      seekAudio,
      stopAudio,
      setPlaybackRate: handleSetPlaybackRate,
      setVolume: handleSetVolume,
      playNext,
      playPrevious,
      setAudioMessages: handleSetAudioMessages,
      setShowPlayer: handleSetShowPlayer,
    }),
    [
      playAudio,
      pauseAudio,
      seekAudio,
      stopAudio,
      handleSetPlaybackRate,
      handleSetVolume,
      playNext,
      playPrevious,
      handleSetAudioMessages,
      handleSetShowPlayer,
    ]
  )

  return (
    <VoicePlayerStateContext.Provider value={stateValue}>
      <VoicePlayerActionsContext.Provider value={actionsValue}>
        {children}
      </VoicePlayerActionsContext.Provider>
    </VoicePlayerStateContext.Provider>
  )
}

// Hook để sử dụng state (cho components cần currentTime, duration)
export const useVoicePlayerState = () => {
  const context = useContext(VoicePlayerStateContext)
  if (!context) {
    throw new Error("useVoicePlayerState must be used within VoicePlayerProvider")
  }
  return context
}

// Hook để sử dụng actions (cho components chỉ cần play/pause)
export const useVoicePlayerActions = () => {
  const context = useContext(VoicePlayerActionsContext)
  if (!context) {
    throw new Error("useVoicePlayerActions must be used within VoicePlayerProvider")
  }
  return context
}

// Hook cũ để backward compatibility
export const useVoicePlayer = () => {
  const state = useVoicePlayerState()
  const actions = useVoicePlayerActions()
  return { ...state, ...actions }
}
