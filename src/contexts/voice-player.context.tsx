"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"
import type { TStateDirectMessage } from "@/utils/types/global"

// Logic preloadAudioMetadata từ VoiceMessage component
const preloadAudioMetadata = (url: string): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio()

    const handleLoadedMetadata = () => {
      const duration = audio.duration
      if (isFinite(duration) && duration > 0) {
        resolve(duration)
      } else {
        // Fallback: thử seek để trigger metadata loading
        audio.currentTime = 24 * 60 * 60 // Seek to 24 hours
        audio.addEventListener(
          "canplaythrough",
          () => {
            const seekedDuration = audio.duration
            if (isFinite(seekedDuration) && seekedDuration > 0) {
              resolve(seekedDuration)
            } else {
              // Nếu vẫn không load được, trả về 0 để hiển thị "--:--"
              console.warn("Could not load audio duration, using fallback")
              resolve(0)
            }
          },
          { once: true }
        )
        audio.addEventListener(
          "error",
          () => {
            console.warn("Audio metadata loading failed, using fallback")
            resolve(0)
          },
          { once: true }
        )
      }
    }

    const handleError = () => {
      console.warn("Audio loading failed, using fallback")
      resolve(0)
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true })
    audio.addEventListener("error", handleError, { once: true })

    audio.src = url
    audio.load()

    // Timeout fallback - không reject, chỉ resolve với 0
    setTimeout(() => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        resolve(audio.duration)
      } else {
        console.warn("Audio metadata loading timeout, using fallback")
        resolve(0)
      }
    }, 5000)
  })
}

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
  const durationCacheRef = useRef<Map<string, number>>(new Map()) // Cache duration theo audioUrl
  const pausedTimeCacheRef = useRef<Map<string, number>>(new Map()) // Cache vị trí pause theo audioUrl

  // Actions - đặt ở top level
  const playAudio = useCallback(
    async (message: TStateDirectMessage) => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      const audioUrl = message.Media?.url || ""

      // Kiểm tra xem có phải chuyển sang voice mới không
      const isNewVoice = currentAudioUrl !== audioUrl

      if (isNewVoice) {
        // Reset khi chuyển sang voice mới
        setCurrentTime(0)
        setDuration(0)
        lastPausedTimeRef.current = 0
      } else {
        // Giữ nguyên currentTime khi resume cùng voice
        setCurrentTime(lastPausedTimeRef.current)
      }

      // Kiểm tra cache trước
      let cachedDuration = durationCacheRef.current.get(audioUrl)

      // Nếu chưa có trong cache, preload để lấy duration
      if (!cachedDuration) {
        try {
          cachedDuration = await preloadAudioMetadata(audioUrl)
          durationCacheRef.current.set(audioUrl, cachedDuration)
        } catch (error) {
          console.error("Error preloading audio metadata:", error)
          cachedDuration = 0
        }
      }

      // Set duration từ cache
      if (cachedDuration && cachedDuration > 0) {
        setDuration(cachedDuration)
      }

      const newAudio = new Audio(audioUrl)
      newAudio.volume = volume
      newAudio.playbackRate = playbackRate

      // Set vị trí bắt đầu phát
      if (!isNewVoice) {
        // Resume từ vị trí đã pause
        const pausedTime = pausedTimeCacheRef.current.get(audioUrl) || 0
        newAudio.currentTime = pausedTime
        setCurrentTime(pausedTime)
      }

      const handleTimeUpdate = () => {
        setCurrentTime(newAudio.currentTime)
        lastPausedTimeRef.current = newAudio.currentTime
      }

      const handleLoadedMetadata = () => {
        const audioDuration = newAudio.duration

        // Kiểm tra nếu duration hợp lệ
        if (audioDuration && isFinite(audioDuration) && audioDuration > 0) {
          setDuration(audioDuration)
          // Cập nhật cache
          durationCacheRef.current.set(audioUrl, audioDuration)
        }
      }

      const handleLoadedData = () => {
        const audioDuration = newAudio.duration

        // Kiểm tra nếu duration hợp lệ
        if (audioDuration && isFinite(audioDuration) && audioDuration > 0) {
          setDuration(audioDuration)
          // Cập nhật cache
          durationCacheRef.current.set(audioUrl, audioDuration)
        }
      }

      const handleEnded = () => {
        setIsPlaying(false)
        setCurrentTime(0)
        lastPausedTimeRef.current = 0
        // Xóa vị trí pause khi voice kết thúc
        pausedTimeCacheRef.current.delete(audioUrl)
        newAudio.removeEventListener("timeupdate", handleTimeUpdate)
        newAudio.removeEventListener("loadedmetadata", handleLoadedMetadata)
        newAudio.removeEventListener("loadeddata", handleLoadedData)
        newAudio.removeEventListener("ended", handleEnded)
      }

      newAudio.addEventListener("timeupdate", handleTimeUpdate)
      newAudio.addEventListener("loadedmetadata", handleLoadedMetadata)
      newAudio.addEventListener("loadeddata", handleLoadedData)
      newAudio.addEventListener("ended", handleEnded)

      try {
        await newAudio.play()
        setIsPlaying(true)
        setCurrentAudioUrl(audioUrl)
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
    [volume, playbackRate, audioMessages, currentAudioUrl]
  )

  const pauseAudio = useCallback(() => {
    if (audioRef.current && currentAudioUrl) {
      audioRef.current.pause()
      setIsPlaying(false)
      const pausedTime = audioRef.current.currentTime
      lastPausedTimeRef.current = pausedTime
      // Lưu vị trí pause vào cache
      pausedTimeCacheRef.current.set(currentAudioUrl, pausedTime)
    }
  }, [currentAudioUrl])

  const seekAudio = useCallback(
    (time: number) => {
      if (audioRef.current && currentAudioUrl) {
        audioRef.current.currentTime = time
        setCurrentTime(time)
        lastPausedTimeRef.current = time
        // Cập nhật vị trí pause trong cache
        pausedTimeCacheRef.current.set(currentAudioUrl, time)
      }
    },
    [currentAudioUrl]
  )

  const stopAudio = useCallback(() => {
    if (audioRef.current && currentAudioUrl) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
      lastPausedTimeRef.current = 0
      // Xóa vị trí pause khi stop
      pausedTimeCacheRef.current.delete(currentAudioUrl)
    }
  }, [currentAudioUrl])

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
