interface MessageTypeBadgeProps {
  type: string
}

export const MessageTypeBadge = ({ type }: MessageTypeBadgeProps) => {
  const typeConfig = {
    TEXT: { color: "bg-blue-500/20 text-blue-400", label: "Text" },
    IMAGE: { color: "bg-green-500/20 text-green-400", label: "Image" },
    VIDEO: { color: "bg-purple-500/20 text-purple-400", label: "Video" },
    AUDIO: { color: "bg-orange-500/20 text-orange-400", label: "Audio" },
    DOCUMENT: { color: "bg-gray-500/20 text-gray-400", label: "Document" },
    STICKER: { color: "bg-pink-500/20 text-pink-400", label: "Sticker" },
  }

  const config = typeConfig[type as keyof typeof typeConfig] || {
    color: "bg-gray-500/20 text-gray-400",
    label: type,
  }

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
      {config.label}
    </span>
  )
}
