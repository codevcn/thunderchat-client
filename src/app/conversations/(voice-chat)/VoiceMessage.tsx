import { Play, Pause } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import WaveformData from "waveform-data"
import { useVoicePlayer } from "@/contexts/voice-player.context"
import type { TStateDirectMessage } from "@/utils/types/global"
import dayjs from "dayjs"

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
        const normalized = downsampled.map((v) => (v / max) * 32 + 8)
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
  message: TStateDirectMessage
  audioUrl: string
}

export default function VoiceMessage({ message, audioUrl }: VoiceMessageProps) {
  const [waveform, setWaveform] = useState<number[]>([])
  const [iconColor, setIconColor] = useState("#8F62FF")
  const [localDuration, setLocalDuration] = useState<number>(0)
  const [isLoadingDuration, setIsLoadingDuration] = useState(true)
  const loadedDurationRef = useRef<number>(0) // Lưu duration đã load để tránh bị reset

  // Sử dụng voice player context
  const { isPlaying, currentTime, duration, currentAudioUrl, playAudio, pauseAudio } =
    useVoicePlayer()

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
    const mm = Math.floor(s / 60)
      .toString()
      .padStart(2, "0")
    const ss = Math.floor(s % 60)
      .toString()
      .padStart(2, "0")
    return `${mm}:${ss}`
  }

  // Sử dụng duration từ context nếu audio đang được quản lý, hoặc localDuration nếu không
  const displayDuration =
    currentAudioUrl === audioUrl
      ? duration || loadedDurationRef.current
      : localDuration || loadedDurationRef.current
  // Luôn lấy currentTime từ context nếu đây là audio đang được quản lý
  const displayCurrentTime = currentAudioUrl === audioUrl ? currentTime : 0

  return (
    <div className="max-w-[370px] rounded-2xl flex min-w-[230px]">
      {/* Nút phát/dừng */}
      <div className="flex items-center justify-center mr-3 shrink-0" style={{ height: 56 }}>
        <button
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow"
          onClick={handlePlayPause}
          aria-label={isThisAudioPlaying ? "Pause" : "Play"}
          style={{
            boxShadow: "0 2px 8px 0 rgba(0,0,0,0.07)",
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
              progress={displayDuration > 0 ? displayCurrentTime / displayDuration : 0}
              color="#fff"
              progressColor="#f1d0ff"
            />
          </div>
          <button
            className="ml-2 text-white/70 text-xl w-8 h-8 flex items-center justify-center"
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
              <span>Loading...</span>
            ) : currentAudioUrl === audioUrl && displayDuration > 0 ? (
              <>
                <span>{format(displayCurrentTime)}</span>
                <span className="mx-1">/</span>
                <span>{format(displayDuration)}</span>
                {/* Chấm đỏ nhấp nháy chỉ khi đang phát */}
                {isThisAudioPlaying && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-red-500 inline-block opacity-100 transition-opacity animate-pulse"></span>
                )}
              </>
            ) : displayDuration > 0 ? (
              <span>{format(displayDuration)}</span>
            ) : (
              <span>--:--</span>
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
  color = "#fff",
  progressColor = "#d0aaff",
}: {
  data: number[]
  progress: number
  color?: string
  progressColor?: string
}) {
  return (
    <div className="flex h-full items-end w-full gap-[1px]">
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: `${v}px`,
            background: i / data.length < progress ? progressColor : color,
            borderRadius: 2,
            transition: "background 0.3s",
          }}
        />
      ))}
    </div>
  )
}
