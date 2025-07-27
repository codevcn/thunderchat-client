import React from "react"
import { StepBack, StepForward, Play, Pause, Volume2, VolumeX, X } from "lucide-react"
import { useVoicePlayer } from "@/contexts/voice-player.context"
import { useUser } from "@/hooks/user"
import dayjs from "dayjs"

export const VoiceMessagePlayer: React.FC = () => {
  const {
    isPlaying,
    currentTime,
    duration,
    currentMessage,
    showPlayer,
    playbackRate,
    volume,
    audioMessages,
    currentAudioIndex,
    playAudio,
    pauseAudio,
    seekAudio,
    stopAudio,
    setPlaybackRate,
    setVolume,
    playNext,
    playPrevious,
    setShowPlayer,
  } = useVoicePlayer()

  const currentUser = useUser()

  if (!showPlayer || !currentMessage) return null

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseAudio()
    } else {
      playAudio(currentMessage)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value)
    seekAudio(time)
  }

  const handleClose = () => {
    stopAudio()
    setShowPlayer(false)
  }

  const handlePlaybackRateChange = () => {
    const newRate =
      playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : playbackRate === 2 ? 0.5 : 1
    setPlaybackRate(newRate)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value)
    setVolume(newVolume)
  }

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time) || time < 0) return "00:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Đảm bảo max value cho progress bar luôn hợp lệ
  const progressMax = isFinite(duration) && duration > 0 ? duration : 1
  const progressValue = Math.min(currentTime, progressMax)

  // Xác định người gửi
  const isCurrentUser = currentMessage.authorId === currentUser?.id
  let senderName = "Bạn"
  if (!isCurrentUser) {
    senderName = currentMessage.Author?.Profile?.fullName || "Người dùng"
  }
  const sentTime = dayjs(currentMessage.createdAt).format("MMM D [at] HH:mm")

  // Kiểm tra có thể next/previous không
  const canGoNext = currentAudioIndex < audioMessages.length - 1
  const canGoPrevious = currentAudioIndex > 0

  return (
    <div className="bg-[#232328] text-white rounded-lg shadow-lg p-2 flex flex-col w-full max-w-xl">
      <div className="flex items-center">
        {/* Previous button */}
        <button
          className="text-[#766AC8] mr-1 flex items-center justify-center w-8 h-8 hover:bg-[#282837] rounded-full"
          disabled={!canGoPrevious}
          onClick={playPrevious}
          aria-label="Previous"
        >
          <StepBack size={20} />
        </button>

        {/* Play/Pause button */}
        <button
          className="text-[#766AC8] mx-1 flex items-center justify-center w-8 h-8 hover:bg-[#282837] rounded-full border-2 border-[#766AC8]"
          onClick={handlePlayPause}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        {/* Next button */}
        <button
          className="text-[#766AC8] ml-1 flex items-center justify-center w-8 h-8 hover:bg-[#282837] rounded-full"
          disabled={!canGoNext}
          onClick={playNext}
          aria-label="Next"
        >
          <StepForward size={20} />
        </button>

        {/* Main Content */}
        <div className="flex-1 flex flex-col ml-2">
          <div className="font-semibold text-[15px]">
            <span className="truncate block max-w-[120px]" title={senderName}>
              {senderName}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span>{formatTime(currentTime)}</span>
            <span className="mx-1">•</span>
            <span>{sentTime}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center mx-2">
          {volume === 0 ? (
            <VolumeX size={18} className="mr-1" />
          ) : (
            <Volume2 size={18} className="mr-1" />
          )}
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
          className="text-[#766AC8] mx-1 text-xs w-8 h-8 flex items-center justify-center hover:bg-[#282837] rounded-full"
          onClick={handlePlaybackRateChange}
        >
          {playbackRate === 1
            ? "1x"
            : playbackRate === 1.5
              ? "1.5x"
              : playbackRate === 2
                ? "2x"
                : "0.5x"}
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-red-400 ml-2 w-8 h-8 flex items-center justify-center"
        >
          <X size={20} />
        </button>
      </div>

      {/* Progress Bar */}
      <input
        type="range"
        min={0}
        max={progressMax}
        step={0.01}
        value={progressValue}
        onChange={handleSeek}
        className="w-full mt-2 accent-[#766AC8]"
        style={{
          // Đảm bảo progress bar hiển thị đúng
          background: `linear-gradient(to right, #766AC8 0%, #766AC8 ${(progressValue / progressMax) * 100}%, #444 0%)`,
        }}
      />
    </div>
  )
}
