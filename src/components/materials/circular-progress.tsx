import { Check } from "lucide-react"
import React from "react"

type TCircularProgressProps = {
  progress: number // từ 0 → 100
} & Partial<{
  size: number
  strokeWidth: number
  progressColor: string
  trackColor: string
}>

export const CircularProgress = ({
  progress,
  size = 60,
  strokeWidth = 4,
  progressColor = "#ffffff",
  trackColor = "#ffffff55",
}: TCircularProgressProps) => {
  const clamped = Math.min(100, Math.max(0, progress))

  // Tính toán bán kính và chu vi dựa theo stroke width
  const radius = 50 - strokeWidth / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (clamped / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          transform: "rotate(-90deg)",
        }}
      >
        {/* Track - viền nền */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress - viền chính */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.2s linear",
          }}
        />
      </svg>
      <span
        style={{ color: progressColor }}
        className="text-xs font-semibold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        {clamped >= 100 ? <Check size={20} strokeWidth={3} /> : `${clamped}%`}
      </span>
    </div>
  )
}
