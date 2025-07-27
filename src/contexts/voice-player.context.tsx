"use client"

import React, { createContext, useContext, useState, useRef, useCallback } from "react"
import type { TStateDirectMessage } from "@/utils/types/global"

// Hàm preload metadata của audio với fallback graceful
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

type VoicePlayerContextType = {
  // State
  isPlaying: boolean
  currentTime: number
  duration: number
  currentAudioUrl: string | null
  currentMessage: TStateDirectMessage | null
  playbackRate: number
  audioMessages: TStateDirectMessage[] // Danh sách tất cả audio messages
  currentAudioIndex: number // Vị trí hiện tại trong danh sách

  // Actions
  playAudio: (message: TStateDirectMessage) => void
  pauseAudio: () => void
  seekAudio: (time: number) => void
  stopAudio: () => void
  setPlaybackRate: (rate: number) => void
  playNext: () => void
  playPrevious: () => void
  setAudioMessages: (messages: TStateDirectMessage[]) => void

  // Player visibility
  showPlayer: boolean
  setShowPlayer: (show: boolean) => void
}

const VoicePlayerContext = createContext<VoicePlayerContextType | null>(null)

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

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastPausedTimeRef = useRef<number>(0) // Lưu vị trí khi pause

  const playAudio = useCallback(
    async (message: TStateDirectMessage) => {
      if (!message.mediaUrl) return

      // Cập nhật currentAudioIndex nếu message có trong danh sách
      const messageIndex = audioMessages.findIndex((msg) => msg.id === message.id)
      if (messageIndex !== -1) {
        setCurrentAudioIndex(messageIndex)
      }

      // Nếu đang phát audio khác, dừng lại
      if (audioRef.current && currentAudioUrl !== message.mediaUrl) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        lastPausedTimeRef.current = 0
      }

      setCurrentMessage(message)
      setCurrentAudioUrl(message.mediaUrl)
      setShowPlayer(true)

      // Preload metadata trước
      const audioDuration = await preloadAudioMetadata(message.mediaUrl)
      setDuration(audioDuration)

      // Tạo audio element mới nếu cần
      if (!audioRef.current) {
        audioRef.current = new Audio()
      }

      audioRef.current.src = message.mediaUrl
      audioRef.current.playbackRate = playbackRate // Áp dụng playback rate hiện tại

      // Nếu là cùng audio và đã có vị trí pause, tiếp tục từ đó
      if (currentAudioUrl === message.mediaUrl && lastPausedTimeRef.current > 0) {
        audioRef.current.currentTime = lastPausedTimeRef.current
        setCurrentTime(lastPausedTimeRef.current)
      } else {
        // Audio mới hoặc chưa có vị trí pause, bắt đầu từ đầu
        audioRef.current.currentTime = 0
        setCurrentTime(0)
        lastPausedTimeRef.current = 0
      }

      // Event listeners
      audioRef.current.addEventListener("loadedmetadata", () => {
        setDuration(audioRef.current?.duration || 0)
      })

      audioRef.current.addEventListener("timeupdate", () => {
        const time = audioRef.current?.currentTime || 0
        setCurrentTime(time)
        // Cập nhật vị trí pause khi đang phát
        if (isPlaying) {
          lastPausedTimeRef.current = time
        }
      })

      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false)
        setCurrentTime(0)
        lastPausedTimeRef.current = 0 // Reset khi kết thúc
      })

      audioRef.current.addEventListener("pause", () => {
        setIsPlaying(false)
        // Lưu vị trí hiện tại khi pause
        lastPausedTimeRef.current = audioRef.current?.currentTime || 0
      })

      audioRef.current.addEventListener("play", () => {
        setIsPlaying(true)
      })

      // Bắt đầu phát
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch((error) => {
          console.error("Error playing audio:", error)
        })
    },
    [currentAudioUrl, isPlaying, playbackRate, audioMessages]
  )

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      // Lưu vị trí hiện tại khi pause
      lastPausedTimeRef.current = audioRef.current.currentTime
    }
  }, [])

  const seekAudio = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
      // Cập nhật vị trí pause khi seek
      lastPausedTimeRef.current = time
    }
  }, [])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
      setCurrentAudioUrl(null)
      setCurrentMessage(null)
      setShowPlayer(false)
      setDuration(0)
      lastPausedTimeRef.current = 0 // Reset khi stop
    }
  }, [])

  const handleSetPlaybackRate = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate
      setPlaybackRate(rate)
    }
  }, [])

  const playNext = useCallback(() => {
    if (currentAudioIndex < audioMessages.length - 1) {
      const nextIndex = currentAudioIndex + 1
      const nextMessage = audioMessages[nextIndex]
      setCurrentAudioIndex(nextIndex)
      setCurrentMessage(nextMessage)
      setCurrentAudioUrl(nextMessage.mediaUrl ?? null)
      // Tự động phát audio tiếp theo
      if (isPlaying) {
        playAudio(nextMessage)
      }
    }
  }, [currentAudioIndex, audioMessages, isPlaying, playAudio])

  const playPrevious = useCallback(() => {
    if (currentAudioIndex > 0) {
      const prevIndex = currentAudioIndex - 1
      const prevMessage = audioMessages[prevIndex]
      setCurrentAudioIndex(prevIndex)
      setCurrentMessage(prevMessage)
      setCurrentAudioUrl(prevMessage.mediaUrl ?? null)
      // Tự động phát audio trước đó
      if (isPlaying) {
        playAudio(prevMessage)
      }
    }
  }, [currentAudioIndex, audioMessages, isPlaying, playAudio])

  const handleSetAudioMessages = useCallback((messages: TStateDirectMessage[]) => {
    setAudioMessages(messages)
    setCurrentAudioIndex(0)
    setCurrentAudioUrl(messages[0]?.mediaUrl ?? null)
  }, [])

  const value: VoicePlayerContextType = {
    isPlaying,
    currentTime,
    duration,
    currentAudioUrl,
    currentMessage,
    playbackRate,
    audioMessages,
    currentAudioIndex,
    playAudio,
    pauseAudio,
    seekAudio,
    stopAudio,
    setPlaybackRate: handleSetPlaybackRate,
    playNext,
    playPrevious,
    setAudioMessages: handleSetAudioMessages,
    showPlayer,
    setShowPlayer,
  }
  return <VoicePlayerContext.Provider value={value}>{children}</VoicePlayerContext.Provider>
}

export const useVoicePlayer = () => {
  const context = useContext(VoicePlayerContext)
  if (!context) {
    throw new Error("useVoicePlayer must be used within a VoicePlayerProvider")
  }
  return context
}
