import React from "react"
import dayjs from "dayjs"
import ActionIcons from "@/components/materials/action-icons"
import LoadingSpinner from "@/components/materials/loading-spinner"
import { useUser } from "@/hooks/user"
import { Play } from "lucide-react"
import { useVoicePlayerActions } from "@/contexts/voice-player.context"
import { EMessageMediaTypes, EMessageTypes } from "@/utils/enums"
import { TMediaData } from "@/utils/types/global"
import { TMessageFullInfo } from "@/utils/types/be-api"
import { TUserWithProfileFE } from "@/utils/types/fe-api"
import { EMessageStatus } from "@/utils/socket/enums"

// Helper function to get file icon based on file extension
const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase()
  switch (extension) {
    case "xlsx":
    case "xls":
      return (
        <div className="w-10 h-10 bg-green-600 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">X</span>
        </div>
      )
    case "docx":
    case "doc":
      return (
        <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">W</span>
        </div>
      )
    case "pdf":
      return (
        <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">P</span>
        </div>
      )
    case "ppt":
    case "pptx":
      return (
        <div className="w-10 h-10 bg-orange-600 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">P</span>
        </div>
      )
    case "txt":
      return (
        <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">T</span>
        </div>
      )
    default:
      return (
        <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">F</span>
        </div>
      )
  }
}

// Helper function to format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Thêm hàm handleDownload ở đầu file hoặc đầu component MediaGrid
const handleDownload = async (item: TMessageFullInfo) => {
  if (!item.Media?.url) return
  const url = item.Media?.url
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error("Không thể tải file")
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = blobUrl
    const fileNameWithExt = item.Media?.fileName || "media"
    const hasExtension = fileNameWithExt.includes(".")
    const finalFileName = hasExtension
      ? fileNameWithExt
      : `${fileNameWithExt}.${item.Media?.type || "dat"}`
    link.download = finalFileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  } catch (error) {
    // Fallback: tải trực tiếp từ URL
    const link = document.createElement("a")
    link.href = url
    const fileNameWithExt = item.Media?.fileName || "media"
    const hasExtension = fileNameWithExt.includes(".")
    const finalFileName = hasExtension
      ? fileNameWithExt
      : `${fileNameWithExt}.${item.Media?.type || "dat"}`
    link.download = finalFileName
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Tối ưu MediaGrid với React.memo
export const MediaGrid = React.memo(
  ({
    items,
    mixedMedia,
    setSelectedMediaIndex,
    setIsMediaViewerOpen,
    isFilterOpen = false,
  }: {
    items: TMessageFullInfo[]
    mixedMedia: TMessageFullInfo[]
    setSelectedMediaIndex: (idx: number) => void
    setIsMediaViewerOpen: (open: boolean) => void
    isFilterOpen?: boolean
  }) => {
    const currentUser = useUser()

    // Memoized MediaSkeleton component
    const MediaSkeleton = React.memo(() => (
      <div className="aspect-square bg-gray-700 rounded-lg animate-pulse"></div>
    ))

    // Memoized MediaCell component
    const MediaCell = React.memo(
      ({
        item,
        mixedMedia,
        setSelectedMediaIndex,
        setIsMediaViewerOpen,
        currentUser,
      }: {
        item: TMessageFullInfo
        mixedMedia: TMessageFullInfo[]
        setSelectedMediaIndex: (idx: number) => void
        setIsMediaViewerOpen: (open: boolean) => void
        currentUser: TUserWithProfileFE | null
      }) => {
        const openMediaViewer = React.useCallback(
          (mediaItem: TMessageFullInfo) => {
            const index = mixedMedia.findIndex((item) => item.id === mediaItem.id)
            setSelectedMediaIndex(index >= 0 ? index : 0)
            setIsMediaViewerOpen(true)
          },
          [mixedMedia, setSelectedMediaIndex, setIsMediaViewerOpen]
        )

        return (
          <div
            className="aspect-square bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer group relative"
            onClick={() => openMediaViewer(item)}
          >
            {/* Action icons on hover, top-right */}
            <div className="absolute top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <ActionIcons
                onDownload={() => handleDownload(item)}
                onShare={() => {}}
                onMore={() => {}}
                showDownload={item.Media?.url ? true : false}
                isSender={item.authorId === currentUser?.id}
                onViewOriginalMessage={() => {}}
                onDeleteForMe={() => console.log("Delete for me:", item.id)}
                onDeleteForEveryone={() => console.log("Delete for everyone:", item.id)}
                messageId={item.id}
              />
            </div>

            {/* Media content */}
            {item.type === EMessageTypes.MEDIA && item.Media?.type === EMessageMediaTypes.IMAGE ? (
              <img
                src={item.Media?.url}
                alt={item.Media?.fileName || "Image"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : item.type === EMessageTypes.MEDIA &&
              item.Media?.type === EMessageMediaTypes.VIDEO ? (
              <div className="relative w-full h-full">
                <img
                  src={item.Media?.thumbnailUrl || item.Media?.url}
                  alt={item.Media?.fileName || "Video"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
            ) : (
              <div className="text-white text-center">
                <div className="w-8 h-8 mx-auto mb-2 bg-gray-600 rounded flex items-center justify-center">
                  <span className="text-xs">F</span>
                </div>
                <span className="text-xs">{item.Media?.fileName}</span>
              </div>
            )}
          </div>
        )
      }
    )

    MediaCell.displayName = "MediaCell"

    if (items.length === 0) {
      return (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <MediaSkeleton key={i} />
          ))}
        </div>
      )
    }

    return (
      <div className={`grid grid-cols-3 gap-2 ${isFilterOpen ? "pointer-events-none" : ""}`}>
        {items.map((item) => (
          <MediaCell
            key={item.id}
            item={item}
            mixedMedia={mixedMedia}
            setSelectedMediaIndex={setSelectedMediaIndex}
            setIsMediaViewerOpen={setIsMediaViewerOpen}
            currentUser={currentUser}
          />
        ))}
      </div>
    )
  }
)

MediaGrid.displayName = "MediaGrid"

// Tối ưu FilesList với React.memo
export const FilesList = React.memo(({ items }: { items: TMessageFullInfo[] }) => {
  const currentUser = useUser()

  return (
    <div className="space-y-2">
      {items.map((item: TMessageFullInfo) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3 bg-gray-800 rounded-lg group"
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(item.Media?.fileName || "file")}
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{item.Media?.fileName}</div>
              <div className="text-gray-400 text-xs">
                {formatFileSize(item.Media?.fileSize || 0)}
              </div>
            </div>
          </div>
          {/* Action icons on hover */}
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <ActionIcons
              onDownload={() => handleDownload(item)}
              onShare={() => {}}
              onMore={() => {}}
              showDownload={true}
              isSender={item.authorId === currentUser?.id}
              onViewOriginalMessage={() => {}}
              onDeleteForMe={() => console.log("Delete for me:", item.id)}
              onDeleteForEveryone={() => console.log("Delete for everyone:", item.id)}
              messageId={item.id}
            />
          </div>
        </div>
      ))}
    </div>
  )
})

FilesList.displayName = "FilesList"

// Tối ưu AudioList với React.memo
export const AudioList = React.memo(({ items }: { items: TMessageFullInfo[] }) => {
  const currentUser = useUser()
  const { playAudio, setShowPlayer } = useVoicePlayerActions()

  // Memoized handleVoiceClick
  const handleVoiceClick = React.useCallback(
    (voiceMessage: TMessageFullInfo) => {
      // Phát audio và hiển thị player
      playAudio({
        id: voiceMessage.id,
        authorId: voiceMessage.authorId,
        createdAt: voiceMessage.createdAt,
        Media: voiceMessage.Media,
        type: EMessageTypes.MEDIA,
        content: "",
        directChatId: voiceMessage.directChatId || 0,
        status: EMessageStatus.SENT,
        isNewMsg: false,
        isDeleted: false,
        Author: voiceMessage.Author || currentUser,
        ReplyTo: voiceMessage.ReplyTo || null,
        Sticker: voiceMessage.Sticker || null,
      })
      setShowPlayer(true)
    },
    [currentUser, playAudio, setShowPlayer]
  )

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3 bg-gray-800 rounded-lg group cursor-pointer"
          onClick={() => handleVoiceClick(item)}
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-purple-600 rounded flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{item.Media?.fileName}</div>
              <div className="text-gray-400 text-xs">
                {formatFileSize(item.Media?.fileSize || 0)}
              </div>
            </div>
          </div>
          {/* Action icons on hover */}
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <ActionIcons
              onDownload={() => handleDownload(item)}
              onShare={() => {}}
              onMore={() => {}}
              showDownload={true}
              isSender={item.authorId === currentUser?.id}
              onViewOriginalMessage={() => {}}
              onDeleteForMe={() => console.log("Delete for me:", item.id)}
              onDeleteForEveryone={() => console.log("Delete for everyone:", item.id)}
              messageId={item.id}
            />
          </div>
        </div>
      ))}
    </div>
  )
})

AudioList.displayName = "AudioList"

// Tối ưu LinksList với React.memo
export const LinksList = React.memo(({ items }: { items: TMessageFullInfo[] }) => {
  const currentUser = useUser()

  // Memoized formatUrl function
  const formatUrl = React.useCallback((url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname + urlObj.pathname
    } catch {
      return url
    }
  }, [])

  return (
    <div className="space-y-2">
      {items.map((item: TMessageFullInfo) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3 bg-gray-800 rounded-lg group"
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">
                {formatUrl(item.Media?.url || "")}
              </div>
              <div className="text-gray-400 text-xs">
                {dayjs(item.Media?.createdAt).format("MMM DD, YYYY")}
              </div>
            </div>
          </div>
          {/* Action icons on hover */}
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <ActionIcons
              onDownload={() => {}}
              onShare={() => {}}
              onMore={() => {}}
              showDownload={false}
              isSender={item.authorId === currentUser?.id}
              onViewOriginalMessage={() => {}}
              onDeleteForMe={() => console.log("Delete for me:", item.id)}
              onDeleteForEveryone={() => console.log("Delete for everyone:", item.id)}
              messageId={item.id}
            />
          </div>
        </div>
      ))}
    </div>
  )
})

LinksList.displayName = "LinksList"

type TMediaGridContentProps = {
  grouped: [string, TMessageFullInfo[]][]
  tab: "Images/Video" | "files" | "voices" | "links"
  mixedMedia: TMessageFullInfo[]
  setSelectedMediaIndex: (idx: number) => void
  setIsMediaViewerOpen: (open: boolean) => void
  onLoadMore?: () => Promise<void>
  hasMore?: boolean
  loading?: boolean
  isFilterOpen?: boolean
}

// Tối ưu MediaGridContent với React.memo
export const MediaGridContent = React.memo(
  ({
    grouped,
    tab,
    mixedMedia,
    setSelectedMediaIndex,
    setIsMediaViewerOpen,
    onLoadMore,
    hasMore,
    loading,
    isFilterOpen = false,
  }: TMediaGridContentProps) => {
    // Infinite scroll observer
    const observerRef = React.useRef<IntersectionObserver | null>(null)
    const loadMoreRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (!onLoadMore || !hasMore) return

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loading && onLoadMore) {
            onLoadMore()
          }
        },
        { threshold: 0.1 }
      )

      observerRef.current = observer

      if (loadMoreRef.current) {
        observer.observe(loadMoreRef.current)
      }

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect()
        }
      }
    }, [onLoadMore, hasMore, loading])

    return (
      <div className="space-y-3">
        {grouped.map(([date, items]) => (
          <div key={date}>
            <h3 className="text-lg font-semibold text-white mb-2">
              {dayjs(date).format("MMMM DD, YYYY")}
            </h3>
            {tab === "Images/Video" ? (
              <MediaGrid
                items={items}
                mixedMedia={mixedMedia}
                setSelectedMediaIndex={setSelectedMediaIndex}
                setIsMediaViewerOpen={setIsMediaViewerOpen}
                isFilterOpen={isFilterOpen}
              />
            ) : tab === "files" ? (
              <FilesList items={items} />
            ) : tab === "voices" ? (
              <AudioList items={items} />
            ) : (
              <LinksList items={items} />
            )}
          </div>
        ))}

        {/* Infinite scroll trigger */}
        {onLoadMore && hasMore && (
          <div ref={loadMoreRef} className="py-4">
            {loading ? (
              <LoadingSpinner size="sm" color="gray" text="Loading more..." />
            ) : (
              <div className="flex justify-center items-center">
                <div className="text-gray-400">Scroll to load more</div>
              </div>
            )}
          </div>
        )}

        {/* End of content */}
        {!hasMore && grouped.length > 0 && (
          <div className="py-4 text-center">
            <div className="text-gray-400">No more media to load</div>
          </div>
        )}
      </div>
    )
  }
)

MediaGridContent.displayName = "MediaGridContent"
