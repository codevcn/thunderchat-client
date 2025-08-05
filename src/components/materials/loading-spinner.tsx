import React from "react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  color?: "white" | "gray" | "purple"
  text?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "white",
  text,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }

  const colorClasses = {
    white: "text-white",
    gray: "text-gray-400",
    purple: "text-purple-400",
  }

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-current ${sizeClasses[size]} ${colorClasses[color]}`}
      />
      {text && <div className={`mt-2 text-sm ${colorClasses[color]}`}>{text}</div>}
    </div>
  )
}

export default LoadingSpinner
