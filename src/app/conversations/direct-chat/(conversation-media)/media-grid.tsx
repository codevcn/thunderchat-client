import React from "react"
import dayjs from "dayjs"
import ActionIcons from "@/components/materials/action-icons"
import { useUser } from "@/hooks/user"
import { Play } from "lucide-react"
import { FixedSizeGrid as Grid } from "react-window"

import { useVoicePlayer } from "@/contexts/voice-player.context"
import { EMessageTypes } from "@/utils/enums"
import { TMediaData } from "@/utils/types/global"

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
const handleDownload = async (item: any) => {
  if (!item.mediaUrl && !item.fileUrl) return
  const url = item.mediaUrl || item.fileUrl
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error("Không thể tải file")
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = blobUrl
    const fileNameWithExt = item.fileName || "media"
    const hasExtension = fileNameWithExt.includes(".")
    const finalFileName = hasExtension
      ? fileNameWithExt
      : `${fileNameWithExt}.${item.fileType || "dat"}`
    link.download = finalFileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  } catch (error) {
    // Fallback: tải trực tiếp từ URL
    const link = document.createElement("a")
    link.href = url
    const fileNameWithExt = item.fileName || "media"
    const hasExtension = fileNameWithExt.includes(".")
    const finalFileName = hasExtension
      ? fileNameWithExt
      : `${fileNameWithExt}.${item.fileType || "dat"}`
    link.download = finalFileName
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Media Grid Component
export const MediaGrid = ({
  items,
  mixedMedia,
  setSelectedMediaIndex,
  setIsMediaViewerOpen,
}: {
  items: any[]
  mixedMedia: any[]
  setSelectedMediaIndex: (idx: number) => void
  setIsMediaViewerOpen: (open: boolean) => void
}) => {
  const currentUser = useUser()
  // Virtualization config
  const columnCount = 3
  const rowCount = Math.ceil(items.length / columnCount)
  const cellSize = 110 // Giảm size để tránh overflow
  const gap = 8 // Gap giữa các cells

  // Skeleton component
  const MediaSkeleton = () => (
    <div className="w-full h-full bg-gray-600 animate-pulse rounded-lg flex items-center justify-center">
      <div className="w-8 h-8 bg-gray-500 rounded-full animate-pulse"></div>
    </div>
  )

  // MediaCell component
  const MediaCell = ({
    item,
    mixedMedia,
    setSelectedMediaIndex,
    setIsMediaViewerOpen,
    currentUser,
  }: any) => {
    const [imageLoaded, setImageLoaded] = React.useState(false)
    const [imageError, setImageError] = React.useState(false)
    return (
      <div
        className="aspect-square bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer group relative w-full h-full"
        onClick={() => {
          const idx = mixedMedia.findIndex((m: any) => m.id === item.id)
          setSelectedMediaIndex(idx)
          setIsMediaViewerOpen(true)
        }}
      >
        {/* Action icons on hover, top-right */}
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionIcons
            onDownload={() => handleDownload(item)}
            onShare={() => {}}
            onMore={() => {}}
            showDownload={item.mediaUrl ? true : false}
            isSender={item.authorId === currentUser?.id}
            onViewOriginalMessage={() => {}} // Sẽ được xử lý tự động bởi ActionIcons
            onDeleteForMe={() => console.log("Delete for me:", item.id)}
            onDeleteForEveryone={() => console.log("Delete for everyone:", item.id)}
            messageId={item.id}
          />
        </div>
        {/* Skeleton loading */}
        {!imageLoaded && !imageError && <MediaSkeleton />}
        {item.mediaUrl &&
          (item.type === "IMAGE" ? (
            <img
              src={item.mediaUrl}
              alt={item.fileName || "media"}
              className={`object-cover w-full h-full transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : item.type === "VIDEO" ? (
            <div className="relative w-full h-full">
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.fileName || "video"}
                  className={`object-cover w-full h-full transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full text-white opacity-70">
                  <Play className="w-8 h-8" />
                  <span className="text-xs mt-1">Video</span>
                </div>
              )}
              {/* Video play icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ) : null)}
      </div>
    )
  }

  // Cell renderer cho react-window
  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const idx = rowIndex * columnCount + columnIndex
    if (idx >= items.length) return null
    const item = items[idx]
    return (
      <div
        style={{
          ...style,
          padding: `${gap / 2}px`,
          boxSizing: "border-box",
        }}
      >
        <MediaCell
          item={item}
          mixedMedia={mixedMedia}
          setSelectedMediaIndex={setSelectedMediaIndex}
          setIsMediaViewerOpen={setIsMediaViewerOpen}
          currentUser={currentUser}
        />
      </div>
    )
  }

  // Nếu ít item thì không cần virtualization
  if (items.length <= 12) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {items.map((item: any) => (
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

  // Virtualized grid
  return (
    <div className="w-full">
      <Grid
        columnCount={columnCount}
        rowCount={rowCount}
        columnWidth={cellSize}
        rowHeight={cellSize}
        width={cellSize * columnCount}
        height={Math.min(600, Math.max(300, rowCount * cellSize))}
        itemData={items}
        overscanRowCount={2}
        overscanColumnCount={1}
      >
        {Cell}
      </Grid>
    </div>
  )
}

// Files List Component
export const FilesList = ({ items }: { items: any[] }) => {
  const currentUser = useUser()

  return (
    <div className="space-y-2">
      {items.map((item: any) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3 bg-gray-800 rounded-lg group"
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(item.fileName)}
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{item.fileName}</div>
              <div className="text-gray-400 text-xs">{formatFileSize(item.fileSize || 0)}</div>
            </div>
          </div>
          {/* Action icons on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionIcons
              onDownload={() => handleDownload(item)}
              onShare={() => {}}
              onMore={() => {}}
              showDownload={true}
              isSender={item.authorId === currentUser?.id}
              onViewOriginalMessage={() => {}} // Sẽ được xử lý tự động bởi ActionIcons
              onDeleteForMe={() => console.log("Delete for me:", item.id)}
              onDeleteForEveryone={() => console.log("Delete for everyone:", item.id)}
              messageId={item.id}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

type TAudioListProps = {
  items: TMediaData[]
}

// Audio List Component
export const AudioList = ({ items }: TAudioListProps) => {
  const currentUser = useUser()
  const { playAudio, setShowPlayer } = useVoicePlayer()

  // Hàm xử lý click vào voice message
  const handleVoiceClick = (voiceMessage: any) => {
    // Phát audio và hiển thị player
    playAudio({
      id: voiceMessage.id,
      authorId: voiceMessage.authorId,
      createdAt: voiceMessage.createdAt,
      Media: voiceMessage.Media,
      Sticker: voiceMessage.Sticker,
      type: EMessageTypes.MEDIA,
      content: "",
      directChatId: voiceMessage.directChatId || 0,
      status: "SENT" as any,
      isNewMsg: false,
      isDeleted: false, // Thêm property thiếu
      Author: voiceMessage.Author || currentUser, // BẮT BUỘC PHẢI CÓ
      ReplyTo: voiceMessage.ReplyTo || null, // Nếu có ReplyTo thì truyền vào, không thì null
    })
    setShowPlayer(true)
  }

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
              <div className="text-white text-sm font-medium truncate">{item.fileName}</div>
              <div className="text-gray-400 text-xs">{formatFileSize(item.fileSize || 0)}</div>
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
              onViewOriginalMessage={() => {}} // Sẽ được xử lý tự động bởi ActionIcons
              onDeleteForMe={() => console.log("Delete for me:", item.id)}
              onDeleteForEveryone={() => console.log("Delete for everyone:", item.id)}
              messageId={item.id}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Links List Component
export const LinksList = ({ items }: { items: any[] }) => {
  const currentUser = useUser()

  return (
    <div className="space-y-2">
      {items.map((item: any) => (
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
              <div className="text-blue-400 text-sm font-medium truncate underline">
                {item.content}
              </div>
              <div className="text-gray-400 text-xs">Link</div>
            </div>
          </div>
          {/* Action icons on hover, no download */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionIcons
              showDownload={false}
              onShare={() => {}}
              onMore={() => {}}
              isSender={item.authorId === currentUser?.id}
              onViewOriginalMessage={() => {}} // Sẽ được xử lý tự động bởi ActionIcons
              onDeleteForMe={() => console.log("Delete for me:", item.id)}
              onDeleteForEveryone={() => console.log("Delete for everyone:", item.id)}
              messageId={item.id}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Main Content Component
export const MediaGridContent = ({
  grouped,
  tab,
  mixedMedia,
  setSelectedMediaIndex,
  setIsMediaViewerOpen,
}: {
  grouped: [string, TMediaData[]][]
  tab: "Images/Video" | "files" | "voices" | "links"
  mixedMedia: any[]
  setSelectedMediaIndex: (idx: number) => void
  setIsMediaViewerOpen: (open: boolean) => void
}) => (
  <>
    {grouped.length === 0 && <div className="text-gray-400 text-center py-8">Không có dữ liệu</div>}
    {grouped.map(([date, items]) => (
      <div key={date} className="mb-6">
        <div className="text-base font-semibold text-white mb-2">
          {date === "unknown" ? "Unknown date" : `${dayjs(date, "YYYY-MM-DD").format("MMM DD")}`}
        </div>
        {tab === "Images/Video" && (
          <MediaGrid
            items={items}
            mixedMedia={mixedMedia}
            setSelectedMediaIndex={setSelectedMediaIndex}
            setIsMediaViewerOpen={setIsMediaViewerOpen}
          />
        )}
        {tab === "files" && <FilesList items={items} />}
        {tab === "voices" && <AudioList items={items} />}
        {tab === "links" && <LinksList items={items} />}
      </div>
    ))}
  </>
)
