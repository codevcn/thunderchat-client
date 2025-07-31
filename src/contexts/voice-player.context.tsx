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
      const timeoutDuration = audio.duration
      if (isFinite(timeoutDuration) && timeoutDuration > 0) {
        resolve(timeoutDuration)
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
  volume: number
  audioMessages: TStateDirectMessage[] // Danh sách tất cả audio messages
  currentAudioIndex: number // Vị trí hiện tại trong danh sách

  // Actions
  playAudio: (message: TStateDirectMessage) => void
  pauseAudio: () => void
  seekAudio: (time: number) => void
  stopAudio: () => void
  setPlaybackRate: (rate: number) => void
  setVolume: (volume: number) => void
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
  const [volume, setVolume] = useState(1)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastPausedTimeRef = useRef<number>(0) // Lưu vị trí khi pause

  const playAudio = useCallback(
    async (message: TStateDirectMessage) => {
      console.log("🎵 playAudio called with message:", message.id)

      if (!message.mediaUrl) {
        console.log("❌ No mediaUrl for message:", message.id)
        return
      }

      // Cập nhật currentAudioIndex nếu message có trong danh sách
      const messageIndex = audioMessages.findIndex((msg) => msg.id === message.id)
      console.log(
        "🔍 Message index in audioMessages:",
        messageIndex,
        "totalMessages:",
        audioMessages.length
      )

      if (messageIndex !== -1) {
        console.log("✅ Found message in audioMessages, setting currentIndex:", messageIndex)
        setCurrentAudioIndex(messageIndex)
      } else {
        console.log("⚠️ Message not found in audioMessages, adding to end")
        // Nếu message không có trong danh sách, thêm vào cuối
        setAudioMessages((prev) => [...prev, message])
        setCurrentAudioIndex(audioMessages.length)
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

      // Remove event listeners cũ để tránh duplicate
      audioRef.current.removeEventListener("loadedmetadata", () => {})
      audioRef.current.removeEventListener("timeupdate", () => {})
      audioRef.current.removeEventListener("ended", () => {})
      audioRef.current.removeEventListener("pause", () => {})
      audioRef.current.removeEventListener("play", () => {})

      audioRef.current.src = message.mediaUrl
      audioRef.current.playbackRate = playbackRate // Áp dụng playback rate hiện tại
      audioRef.current.volume = volume // Áp dụng volume hiện tại

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
      const handleLoadedMetadata = () => {
        const loadedDuration = audioRef.current?.duration || 0
        // Chỉ set duration nếu preloaded duration không hợp lệ
        if (!isFinite(audioDuration) || audioDuration <= 0) {
          setDuration(loadedDuration)
        }
      }

      const handleTimeUpdate = () => {
        const time = audioRef.current?.currentTime || 0
        setCurrentTime(time)
        // Cập nhật vị trí pause khi đang phát
        if (isPlaying) {
          lastPausedTimeRef.current = time
        }
      }

      const handleEnded = () => {
        setIsPlaying(false)
        setCurrentTime(0)
        lastPausedTimeRef.current = 0 // Reset khi kết thúc
      }

      const handlePause = () => {
        setIsPlaying(false)
        // Lưu vị trí hiện tại khi pause
        lastPausedTimeRef.current = audioRef.current?.currentTime || 0
      }

      const handlePlay = () => {
        setIsPlaying(true)
      }

      audioRef.current.addEventListener("loadedmetadata", handleLoadedMetadata)
      audioRef.current.addEventListener("timeupdate", handleTimeUpdate)
      audioRef.current.addEventListener("ended", handleEnded)
      audioRef.current.addEventListener("pause", handlePause)
      audioRef.current.addEventListener("play", handlePlay)

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
    [currentAudioUrl, isPlaying, playbackRate, audioMessages, volume]
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

  const handleSetVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      setVolume(volume)
    }
  }, [])

  const playNext = useCallback(() => {
    console.log(
      "⏭️ playNext called, currentIndex:",
      currentAudioIndex,
      "totalMessages:",
      audioMessages.length
    )

    if (currentAudioIndex < audioMessages.length - 1) {
      const nextIndex = currentAudioIndex + 1
      const nextMessage = audioMessages[nextIndex]
      console.log("⏭️ Playing next message:", nextMessage.id, "at index:", nextIndex)

      setCurrentAudioIndex(nextIndex)
      setCurrentMessage(nextMessage)
      setCurrentAudioUrl(nextMessage.mediaUrl ?? null)
      // Tự động phát audio tiếp theo
      if (isPlaying) {
        playAudio(nextMessage)
      }
    } else {
      console.log("❌ Cannot play next: already at end")
    }
    // TODO: Trigger load more voices if needed
  }, [currentAudioIndex, audioMessages, isPlaying, playAudio])

  const playPrevious = useCallback(() => {
    console.log(
      "⏮️ playPrevious called, currentIndex:",
      currentAudioIndex,
      "totalMessages:",
      audioMessages.length
    )

    if (currentAudioIndex > 0) {
      const prevIndex = currentAudioIndex - 1
      const prevMessage = audioMessages[prevIndex]
      console.log("⏮️ Playing previous message:", prevMessage.id, "at index:", prevIndex)

      setCurrentAudioIndex(prevIndex)
      setCurrentMessage(prevMessage)
      setCurrentAudioUrl(prevMessage.mediaUrl ?? null)
      // Tự động phát audio trước đó
      if (isPlaying) {
        playAudio(prevMessage)
      }
    } else {
      console.log("❌ Cannot play previous: already at beginning")
    }
    // TODO: Trigger load more voices if needed
  }, [currentAudioIndex, audioMessages, isPlaying, playAudio])

  const handleSetAudioMessages = useCallback((messages: TStateDirectMessage[]) => {
    console.log("🎯 handleSetAudioMessages called with:", messages.length, "messages")
    console.log(
      "🎯 Messages:",
      messages.map((m) => ({ id: m.id, createdAt: m.createdAt }))
    )

    setAudioMessages(messages)
    setCurrentAudioIndex(0)
    setCurrentAudioUrl(messages[0]?.mediaUrl ?? null)

    console.log("✅ Audio messages set in context, currentIndex:", 0)
  }, [])

  const value: VoicePlayerContextType = {
    isPlaying,
    currentTime,
    duration,
    currentAudioUrl,
    currentMessage,
    playbackRate,
    volume,
    audioMessages,
    currentAudioIndex,
    playAudio,
    pauseAudio,
    seekAudio,
    stopAudio,
    setPlaybackRate: handleSetPlaybackRate,
    setVolume: handleSetVolume,
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
