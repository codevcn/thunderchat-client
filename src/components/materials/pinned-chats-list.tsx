import React from "react"
import { CustomAvatar } from "./avatar"
import { PinButton } from "./pin-button"
import { CustomTooltip } from "./tooltip"
import { Pin, MessageCircle } from "lucide-react"
import type { TPinnedDirectChat } from "@/apis/pin"
import { useUser } from "@/hooks/user"
import dayjs from "dayjs"

interface PinnedChatsListProps {
  pinnedChats: TPinnedDirectChat[]
  onUnpin: (directChatId: number) => void
  onChatClick: (directChatId: number) => void
  loading?: boolean
  maxDisplay?: number
}

export const PinnedChatsList: React.FC<PinnedChatsListProps> = ({
  pinnedChats,
  onUnpin,
  onChatClick,
  loading = false,
  maxDisplay = 5,
}) => {
  const user = useUser()
  const displayChats = pinnedChats.slice(0, maxDisplay)

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
          <Pin size={16} />
          <span>Cuộc trò chuyện đã ghim</span>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-100 animate-pulse"
            >
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (pinnedChats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
        <Pin size={24} className="text-gray-400" />
        <p className="text-sm text-gray-500">Chưa có cuộc trò chuyện nào được ghim</p>
        <p className="text-xs text-gray-400">Ghim cuộc trò chuyện để truy cập nhanh</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
        <Pin size={16} className="text-blue-500" />
        <span>Cuộc trò chuyện đã ghim ({pinnedChats.length})</span>
      </div>

      <div className="space-y-1">
        {displayChats.map((pinnedChat) => {
          const directChat = pinnedChat.DirectChat
          const isCreator = directChat.creatorId === user?.id
          const otherUser = isCreator ? directChat.Recipient : directChat.Creator
          const otherUserProfile = otherUser.Profile

          return (
            <div
              key={pinnedChat.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
              onClick={() => onChatClick(directChat.id)}
            >
              <div className="relative">
                <CustomAvatar
                  src={otherUserProfile.avatar}
                  imgSize={40}
                  fallback={otherUserProfile.fullName[0]}
                  fallbackClassName="bg-blue-100 text-blue-600"
                />
                <div className="absolute -top-1 -right-1">
                  <Pin size={12} className="text-blue-500 fill-current" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{otherUserProfile.fullName}</p>
                  <span className="text-xs text-gray-400">
                    {dayjs(pinnedChat.pinnedAt).format("MMM D")}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  Ghim bởi {pinnedChat.pinnedBy === user?.id ? "bạn" : "người khác"}
                </p>
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <PinButton
                  isPinned={true}
                  onToggle={() => onUnpin(directChat.id)}
                  size={16}
                  tooltipText="Bỏ ghim"
                />
              </div>
            </div>
          )
        })}
      </div>

      {pinnedChats.length > maxDisplay && (
        <div className="text-center pt-2 border-t">
          <p className="text-xs text-gray-400">
            Và {pinnedChats.length - maxDisplay} cuộc trò chuyện khác
          </p>
        </div>
      )}
    </div>
  )
}
