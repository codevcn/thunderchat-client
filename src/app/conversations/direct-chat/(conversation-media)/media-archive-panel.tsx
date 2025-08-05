import { useEffect, useRef, useState, useMemo, Dispatch, SetStateAction } from "react"
import dayjs from "dayjs"
import MediaViewerModal from "@/components/chatbox/media-viewer-modal"
import Filters from "./filter"
import { MediaGridContent } from "./media-grid"
import { ChevronLeft } from "lucide-react"
import type { TMediaData, TMediaDataCollection } from "@/utils/types/global"

// Header component
const Header = ({ onClose }: { onClose: () => void }) => (
  <div className="flex items-center justify-between px-4 py-3 bg-[#202124]">
    <button
      onClick={onClose}
      className="text-white hover:text-gray-300 transition-colors duration-200"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
    <span className="text-lg font-semibold text-white">Archive</span>
    <button className="text-white text-sm hover:text-gray-300 transition-colors duration-200">
      Select
    </button>
  </div>
)

// Tabs component
const Tabs = ({
  tab,
  setTab,
}: {
  tab: "Images/Video" | "files" | "voices" | "links"
  setTab: Dispatch<SetStateAction<"Images/Video" | "files" | "voices" | "links">>
}) => (
  <div className="flex px-2 pt-1 pb-1">
    <button
      className={`flex-1 py-2 px-2 text-sm font-medium transition-all duration-200 ${
        tab === "Images/Video" ? "text-purple-400" : "text-gray-400 hover:text-gray-300"
      }`}
      onClick={() => setTab("Images/Video")}
    >
      Images/Video
    </button>
    <button
      className={`flex-1 py-2 px-2 text-sm font-medium transition-all duration-200 ${
        tab === "files" ? "text-purple-400" : "text-gray-400 hover:text-gray-300"
      }`}
      onClick={() => setTab("files")}
    >
      Files
    </button>
    <button
      className={`flex-1 py-2 px-2 text-sm font-medium transition-all duration-200 ${
        tab === "voices" ? "text-purple-400" : "text-gray-400 hover:text-gray-300"
      }`}
      onClick={() => setTab("voices")}
    >
      Voices
    </button>
    <button
      className={`flex-1 py-2 px-2 text-sm font-medium transition-all duration-200 ${
        tab === "links" ? "text-purple-400" : "text-gray-400 hover:text-gray-300"
      }`}
      onClick={() => setTab("links")}
    >
      Links
    </button>
  </div>
)

type TMediaArchivePanelProps = {
  onClose: () => void
  mediaData: TMediaDataCollection
  allMediaItems: any[]
  creator: any
  recipient: any
  initialTab?: "Images/Video" | "files" | "voices" | "links"
}

const MediaArchivePanel = ({
  onClose,
  mediaData,
  creator,
  recipient,
  initialTab = "Images/Video",
}: TMediaArchivePanelProps) => {
  const [tab, setTab] = useState<"Images/Video" | "files" | "voices" | "links">(initialTab)
  const [senderFilter, setSenderFilter] = useState("all")
  const [dateSort, setDateSort] = useState("desc")
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
  const [isDatePopupOpen, setIsDatePopupOpen] = useState(false)
  const datePopupRef = useRef<HTMLDivElement>(null)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [dateFilterApplied, setDateFilterApplied] = useState(false)

  // Reset filter khi chuyển tab
  useEffect(() => {
    setSenderFilter("all")
    setFromDate("")
    setToDate("")
    setDateFilterApplied(false)
  }, [tab])

  function applyDateFilter() {
    setIsDatePopupOpen(false)
    setDateFilterApplied(!!(fromDate && toDate))
  }

  // Lọc dữ liệu theo filter
  const filterItems = (items: any[]) => {
    return items.filter((item) => {
      // Lọc theo người gửi
      if (senderFilter !== "all" && item.authorId !== senderFilter) return false
      // Lọc theo ngày
      if (fromDate && toDate) {
        const created = dayjs(item.createdAt)
        if (created.isBefore(dayjs(fromDate), "day")) return false
        if (created.isAfter(dayjs(toDate), "day")) return false
      }
      return true
    })
  }

  // Nhóm media theo ngày
  const groupByDate = (items: TMediaData[]) => {
    const groups: { [date: string]: TMediaData[] } = {}
    items.forEach((item) => {
      const date =
        item.createdAt && dayjs(item.createdAt).isValid()
          ? dayjs(item.createdAt).format("YYYY-MM-DD")
          : "unknown"
      if (!groups[date]) groups[date] = []
      groups[date].push(item)
    })
    // Sắp xếp ngày giảm dần
    return Object.entries(groups).sort(
      (a, b) => dayjs(b[0], "YYYY-MM-DD").valueOf() - dayjs(a[0], "YYYY-MM-DD").valueOf()
    )
  }

  // Danh sách media đã trộn và sort
  const mixedMedia = useMemo(() => {
    const arr = [...mediaData.images, ...mediaData.videos]
    arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return arr
  }, [mediaData.images, mediaData.videos])

  // Lọc dữ liệu theo tab và filter
  let items: TMediaData[] = []
  if (tab === "Images/Video") {
    items = filterItems(mixedMedia)
  }
  if (tab === "files") items = filterItems(mediaData.files)
  if (tab === "voices") items = filterItems(mediaData.audios)
  if (tab === "links") items = filterItems(mediaData.links)
  const grouped = groupByDate(items)

  return (
    <div className="flex flex-col h-full w-full bg-[#181A1B]">
      {/* Header */}
      <Header onClose={onClose} />
      {/* Tabs */}
      <Tabs tab={tab} setTab={setTab} />
      {/* Filters */}
      <Filters
        senderFilter={senderFilter}
        setSenderFilter={setSenderFilter}
        dateSort={dateSort}
        setDateSort={setDateSort}
        isDatePopupOpen={isDatePopupOpen}
        setIsDatePopupOpen={setIsDatePopupOpen}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        creator={creator}
        recipient={recipient}
        datePopupRef={datePopupRef as unknown as React.RefObject<HTMLDivElement>}
        applyDateFilter={applyDateFilter}
      />
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 STYLE-styled-scrollbar">
        <MediaGridContent
          grouped={grouped}
          tab={tab}
          mixedMedia={mixedMedia}
          setSelectedMediaIndex={setSelectedMediaIndex}
          setIsMediaViewerOpen={setIsMediaViewerOpen}
        />
      </div>

      {/* Media Viewer Modal */}
      <MediaViewerModal
        isOpen={isMediaViewerOpen}
        onClose={() => setIsMediaViewerOpen(false)}
        mediaItems={mixedMedia}
        initialIndex={selectedMediaIndex}
        creator={creator}
        recipient={recipient}
      />
    </div>
  )
}

export default MediaArchivePanel
