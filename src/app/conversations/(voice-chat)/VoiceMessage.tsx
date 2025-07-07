import { Play, Pause, Check } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import WaveformData from "waveform-data"

// Đọc waveform từ file audio (giống như hàm trên)
export async function getWaveformFromAudio(url: string, columns = 36): Promise<number[]> {
  const res = await fetch(url)
  const arrayBuffer = await res.arrayBuffer()
  const audioContext = new window.AudioContext()

  return new Promise<number[]>((resolve, reject) => {
    WaveformData.createFromAudio(
      {
        audio_context: audioContext,
        array_buffer: arrayBuffer,
        // scale: columns, // BỎ HOẶC ĐỂ 512/1024 cho dữ liệu chi tiết hơn
      },
      (err, waveform) => {
        if (err) return reject(err)

        const channel = waveform.channel(0)
        const peaks: number[] = []
        for (let i = 0; i < waveform.length; i++) {
          peaks.push(Math.abs(channel.max_sample(i)))
        }

        // CHỈ LẤY columns cột đều nhau để hiển thị
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

export default function VoiceMessage({
  audioUrl,
  duration,
  sentAt,
  status,
  isMine,
}: {
  audioUrl: string
  duration: number
  sentAt: string
  status: string
  isMine: boolean
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [waveform, setWaveform] = useState<number[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)

  // Blinking red dot
  const [blink, setBlink] = useState(true)
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => setBlink((b) => !b), 600)
      return () => clearInterval(interval)
    } else {
      setBlink(true)
    }
  }, [isPlaying])

  // Lấy waveform thật từ audio
  useEffect(() => {
    if (audioUrl) {
      getWaveformFromAudio(audioUrl, 36)
        .then((data) => {
          console.log("Waveform result:", data)
          setWaveform(data)
        })
        .catch((e) => {
          console.error("Waveform error:", e)
        })
    }
  }, [audioUrl])

  // format mm:ss
  const format = (s: number) => {
    const mm = Math.floor(s / 60)
      .toString()
      .padStart(2, "0")
    const ss = Math.floor(s % 60)
      .toString()
      .padStart(2, "0")
    return `${mm}:${ss}`
  }

  const onPlay = () => {
    setIsPlaying(true)
    audioRef.current?.play()
  }
  const onPause = () => {
    setIsPlaying(false)
    audioRef.current?.pause()
  }

  // Khi stop thì reset về 0
  useEffect(() => {
    if (!isPlaying) setCurrent(0)
  }, [isPlaying, audioUrl])

  return (
    <div
      className={`
        bg-[#8f62ff] max-w-[370px] rounded-2xl px-4 py-2 flex shadow-lg
        ${isMine ? "ml-auto items-end" : ""}
      `}
      style={{ minWidth: 230 }}
    >
      {/* === CỘT 1: Nút phát/dừng === */}
      <div className="flex items-center justify-center mr-3 shrink-0" style={{ height: 56 }}>
        <button
          className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center"
          onClick={isPlaying ? onPause : onPlay}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="text-white" size={28} />
          ) : (
            <Play className="text-white" size={28} />
          )}
        </button>
      </div>

      {/* === CỘT 2: Nội dung sóng âm & thông tin === */}
      <div className="flex-1 flex flex-col justify-center">
        {/* --- HÀNG 1 --- */}
        <div className="flex items-center mb-1">
          <div className="flex-1 flex items-center h-8 overflow-hidden relative">
            <Waveform
              data={waveform.length ? waveform : Array(36).fill(12)}
              progress={duration > 0 ? current / duration : 0}
              color="#fff"
              progressColor="#f1d0ff"
            />
          </div>
          <button className="ml-2 text-white/70 text-xl w-8 h-8 flex items-center justify-center">
            &rarr;A
          </button>
        </div>
        {/* --- HÀNG 2 --- */}
        <div className="flex items-center justify-between w-full mt-0.5">
          {/* Thời gian hiện tại / tổng thời gian */}
          <span className="text-white text-[15px] flex items-center font-bold">
            {isPlaying ? (
              <>
                <span>{format(current)}</span>
                <span className="mx-1">/</span>
                <span>{format(duration)}</span>
                {/* Chấm đỏ nhấp nháy */}
                <span
                  className={`ml-1 w-2 h-2 rounded-full bg-red-500 inline-block
                    ${isPlaying && blink ? "opacity-100" : "opacity-30"} transition-opacity`}
                ></span>
              </>
            ) : (
              <span>{format(duration)}</span>
            )}
          </span>
          {/* Thời gian gửi và icon */}
          <span className="text-white/80 text-xs flex items-center">
            {sentAt}
            <Check className="w-4 h-4 ml-1" />
          </span>
        </div>
      </div>
      {/* === audio tag ẩn === */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime || 0)}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        hidden
      />
    </div>
  )
}

// Sóng âm dạng cột từ mảng số thật
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
