import { Play, Pause } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import WaveformData from "waveform-data"
import { useVoicePlayerState, useVoicePlayerActions } from "@/contexts/voice-player.context"
import type { TStateMessage } from "@/utils/types/global"

export async function getWaveformFromAudio(url: string, columns = 36): Promise<number[]> {
  const res = await fetch(url)
  const arrayBuffer = await res.arrayBuffer()
  const audioContext = new window.AudioContext()
  return new Promise<number[]>((resolve, reject) => {
    WaveformData.createFromAudio(
      { audio_context: audioContext, array_buffer: arrayBuffer },
      (err, waveform) => {
        if (err) return reject(err)
        const channel = waveform.channel(0)
        const peaks: number[] = []
        for (let i = 0; i < waveform.length; i++) {
          peaks.push(Math.abs(channel.max_sample(i)))
        }
        const downsampled: number[] = []
        for (let i = 0; i < columns; i++) {
          const idx = Math.floor((i * peaks.length) / columns)
          downsampled.push(peaks[idx])
        }
        const max = Math.max(...downsampled) || 1
        // Cải thiện normalization để có range tốt hơn
        const normalized = downsampled.map((v) => {
          const normalizedValue = (v / max) * 24 + 8 // Range từ 8-32
          return Math.max(6, Math.min(32, normalizedValue)) // Đảm bảo min 6, max 32
        })
        resolve(normalized)
      }
    )
  })
}

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

type VoiceMessageProps = {
  message: TStateMessage
  audioUrl: string
  isSender?: boolean // Thêm prop để phân biệt người gửi/nhận
}

export default function VoiceMessage({ message, audioUrl, isSender = false }: VoiceMessageProps) {
  const [waveform, setWaveform] = useState<number[]>([])
  const [iconColor, setIconColor] = useState("#766AC8")
  const [localDuration, setLocalDuration] = useState<number>(0)
  const [isLoadingDuration, setIsLoadingDuration] = useState(true)
  const loadedDurationRef = useRef<number>(0) // Lưu duration đã load để tránh bị reset

  // Sử dụng voice player context - tách riêng state và actions
  const { isPlaying, currentTime, duration, currentAudioUrl } = useVoicePlayerState()
  const { playAudio, pauseAudio } = useVoicePlayerActions()

  // Kiểm tra xem audio này có đang được phát không
  const isThisAudioPlaying = currentAudioUrl === audioUrl && isPlaying

  useEffect(() => {
    // Lấy màu từ biến CSS
    const color = getComputedStyle(document.documentElement)
      .getPropertyValue("--tdc-regular-violet-cl")
      .trim()
    if (color) setIconColor(color)
  }, [])

  useEffect(() => {
    if (audioUrl) {
      // Preload waveform
      getWaveformFromAudio(audioUrl, 36)
        .then((data) => setWaveform(data))
        .catch(() => setWaveform(Array(36).fill(12)))

      // Preload audio metadata
      setIsLoadingDuration(true)
      preloadAudioMetadata(audioUrl)
        .then((duration) => {
          setLocalDuration(duration)
          setIsLoadingDuration(false)
          loadedDurationRef.current = duration
        })
        .catch((error) => {
          // Fallback nếu có lỗi không mong muốn
          console.warn("Unexpected error loading audio duration:", error)
          setLocalDuration(0)
          setIsLoadingDuration(false)
        })
    }
  }, [audioUrl])

  const handlePlayPause = () => {
    if (isThisAudioPlaying) {
      pauseAudio()
    } else {
      playAudio(message)
    }
  }

  const format = (s: number) => {
    if (!isFinite(s) || isNaN(s) || s < 0) return "00:00"
    const roundedS = Math.round(s) // Làm tròn theo quy tắc >= 0.5
    const mm = Math.floor(roundedS / 60)
      .toString()
      .padStart(2, "0")
    const ss = Math.floor(roundedS % 60)
      .toString()
      .padStart(2, "0")
    return `${mm}:${ss}`
  }

  // Sử dụng duration từ context nếu audio đang được quản lý, hoặc localDuration nếu không - làm tròn theo quy tắc >= 0.5
  const displayDuration =
    currentAudioUrl === audioUrl
      ? duration && isFinite(duration) && duration > 0
        ? Math.round(duration)
        : Math.round(loadedDurationRef.current)
      : Math.round(localDuration || loadedDurationRef.current)
  // Luôn lấy currentTime từ context nếu đây là audio đang được quản lý - làm tròn theo quy tắc >= 0.5
  const displayCurrentTime = currentAudioUrl === audioUrl ? Math.round(currentTime) : 0

  // Tính progress cho waveform
  const progress = displayDuration > 0 ? displayCurrentTime / displayDuration : 0

  return (
    <div className="max-w-[370px] rounded-2xl flex min-w-[230px]">
      {/* Nút phát/dừng */}
      <div className="flex items-center justify-center mr-3 shrink-0" style={{ height: 56 }}>
        <button
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 ${
            isSender ? "bg-white dark:bg-gray-800" : "bg-white dark:bg-gray-700"
          }`}
          onClick={handlePlayPause}
          aria-label={isThisAudioPlaying ? "Pause" : "Play"}
          style={{
            boxShadow: "0 4px 12px 0 rgba(0,0,0,0.15)",
          }}
        >
          {isThisAudioPlaying ? (
            <Pause color={iconColor} size={28} />
          ) : (
            <Play color={iconColor} size={28} />
          )}
        </button>
      </div>

      {/* Nội dung sóng âm & info */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Hàng 1: Sóng + nút tốc độ */}
        <div className="flex items-center mb-1">
          <div className="flex-1 flex items-center h-8 overflow-hidden relative">
            <Waveform
              data={waveform.length ? waveform : Array(36).fill(12)}
              progress={progress}
              color={isSender ? "#ffffff" : "#cccccc"}
              progressColor={isSender ? "#f1d0ff" : "#ffffff"}
            />
          </div>
          <button
            className="ml-2 text-white/70 hover:text-white text-xl w-8 h-8 flex items-center justify-center transition-colors duration-200"
            tabIndex={-1}
          >
            &rarr;A
          </button>
        </div>

        {/* Hàng 2: Thời gian & trạng thái */}
        <div className="flex items-center justify-between w-full mt-0.5">
          {/* Thời gian */}
          <span className="text-white text-[15px] flex items-center font-bold">
            {isLoadingDuration ? (
              <span className="text-white/70">Loading...</span>
            ) : currentAudioUrl === audioUrl && displayDuration > 0 ? (
              <>
                <span>{format(displayCurrentTime)}</span>
                <span className="mx-1 text-white/70">/</span>
                <span>{format(displayDuration)}</span>
                {/* Chấm đỏ nhấp nháy chỉ khi đang phát */}
                {isThisAudioPlaying && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-red-500 inline-block opacity-100 transition-opacity animate-pulse"></span>
                )}
              </>
            ) : displayDuration > 0 ? (
              <span>{format(displayDuration)}</span>
            ) : (
              <span className="text-white/70">--:--</span>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

function Waveform({
  data,
  progress,
  color = "#ffffff",
  progressColor = "#f1d0ff",
}: {
  data: number[]
  progress: number
  color?: string
  progressColor?: string
}) {
  return (
    <div className="flex h-full items-center w-full gap-[1px]">
      {data.map((v, i) => {
        const isPlayed = i / data.length < progress
        const currentColor = isPlayed ? progressColor : color
        const opacity = isPlayed ? 1 : 0.6

        // Đảm bảo chiều cao tối thiểu và tối đa
        const minHeight = 4 // Chiều cao tối thiểu
        const maxHeight = 32 // Chiều cao tối đa
        const barHeight = Math.max(minHeight, Math.min(maxHeight, v))

        return (
          <div
            key={i}
            className="flex items-center justify-center"
            style={{
              width: 4,
              height: `${barHeight}px`,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                background: currentColor,
                borderRadius: 2,
                transition: "background 0.3s ease-in-out",
                opacity: opacity,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
