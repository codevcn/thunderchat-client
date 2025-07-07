import React, { useRef, useState, useEffect } from "react"
import { StepBack, StepForward, Play, Pause, Volume2, X } from "lucide-react"

type VoiceMessagePlayerProps = {
  senderName: string
  audioUrl: string
  sentTime: string // eg: "Today at 10:10"
  onClose?: () => void
  onPrev?: () => void
  onNext?: () => void
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  senderName,
  audioUrl,
  sentTime,
  onClose,
  onPrev,
  onNext,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    audio.addEventListener("loadedmetadata", onLoadedMetadata)
    audio.addEventListener("timeupdate", onTimeUpdate)
    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      audio.removeEventListener("timeupdate", onTimeUpdate)
    }
  }, [audioUrl])

  useEffect(() => {
    setPlaying(false)
    setCurrentTime(0)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [audioUrl])

  const handlePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
    setPlaying(!playing)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const time = Number(e.target.value)
    audio.currentTime = time
    setCurrentTime(time)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setVolume(v)
    if (audioRef.current) {
      audioRef.current.volume = v
    }
  }

  const handlePlaybackRateChange = () => {
    const newRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1
    setPlaybackRate(newRate)
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate
    }
  }

  const handleEnded = () => {
    setPlaying(false)
    setCurrentTime(0)
  }

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60)
      .toString()
      .padStart(2, "0")
    const sec = Math.floor(time % 60)
      .toString()
      .padStart(2, "0")
    return `${min}:${sec}`
  }

  return (
    <div className="bg-[#232328] text-white rounded-lg shadow-lg p-2 flex flex-col w-full max-w-xl">
      <div className="flex items-center">
        {/* Previous button */}
        <button
          className="text-[#766AC8] mr-1 flex items-center justify-center w-8 h-8 hover:bg-[#282837] rounded-full"
          onClick={onPrev}
          disabled={!onPrev}
          aria-label="Previous"
        >
          <StepBack size={20} />
        </button>
        {/* Play/Pause button */}
        <button
          className="text-[#766AC8] mx-1 flex items-center justify-center w-8 h-8 hover:bg-[#282837] rounded-full border-2 border-[#766AC8]"
          onClick={handlePlayPause}
        >
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
        {/* Next button */}
        <button
          className="text-[#766AC8] ml-1 flex items-center justify-center w-8 h-8 hover:bg-[#282837] rounded-full"
          onClick={onNext}
          disabled={!onNext}
          aria-label="Next"
        >
          <StepForward size={20} />
        </button>

        {/* Main Content */}
        <div className="flex-1 flex flex-col ml-2">
          <div className="font-semibold text-[15px]">{senderName}</div>
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span>{formatTime(currentTime)}</span>
            <span className="mx-1">•</span>
            <span>{sentTime}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center mx-2">
          <Volume2 size={18} className="mr-1" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolumeChange}
            className="w-14 accent-[#766AC8]"
          />
        </div>
        {/* Playback speed */}
        <button
          onClick={handlePlaybackRateChange}
          className="text-[#766AC8] mx-1 text-xs w-8 h-8 flex items-center justify-center hover:bg-[#282837] rounded-full"
        >
          {playbackRate}x
        </button>
        {/* Close */}
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-red-400 ml-2 w-8 h-8 flex items-center justify-center"
        >
          <X size={20} />
        </button>
      </div>
      {/* Progress Bar */}
      <input
        type="range"
        min={0}
        max={duration}
        step={0.01}
        value={currentTime}
        onChange={handleSeek}
        className="w-full mt-2 accent-[#766AC8]"
      />
      {/* Ẩn audio element */}
      <audio ref={audioRef} src={audioUrl} onEnded={handleEnded} preload="metadata" />
    </div>
  )
}
