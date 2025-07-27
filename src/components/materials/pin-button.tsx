import React from "react"
import { Pin, PinOff } from "lucide-react"
import { IconButton } from "./icon-button"
import { CustomTooltip } from "./tooltip"

interface PinButtonProps {
  isPinned: boolean
  onToggle: () => void
  loading?: boolean
  disabled?: boolean
  size?: number
  className?: string
  tooltipText?: string
}

export const PinButton: React.FC<PinButtonProps> = ({
  isPinned,
  onToggle,
  loading = false,
  disabled = false,
  size = 20,
  className = "",
  tooltipText,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!loading && !disabled) {
      onToggle()
    }
  }

  const buttonContent = (
    <div
      className={`transition-all duration-200 hover:scale-110 ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {isPinned ? (
        <Pin size={size} className="text-regular-violet-cl " />
      ) : (
        <PinOff size={size} className="text-gray-400 transition-colors" />
      )}
    </div>
  )

  if (tooltipText) {
    return (
      <CustomTooltip title={tooltipText} placement="top">
        <div
          className={`p-1.5 transition duration-200 hover:bg-regular-icon-btn-cl cursor-pointer rounded-full ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={handleClick}
        >
          {buttonContent}
        </div>
      </CustomTooltip>
    )
  }

  return (
    <div
      className={`p-1.5 transition duration-200 hover:bg-regular-icon-btn-cl cursor-pointer rounded-full ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={handleClick}
    >
      {buttonContent}
    </div>
  )
}
