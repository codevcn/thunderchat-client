import React, { useState, useRef, useEffect, useMemo } from "react"
import { X, ChevronLeft } from "lucide-react"
import dayjs from "dayjs"
import MediaViewerModal from "@/components/chatbox/media-viewer-modal"
import LoadingSpinner from "@/components/materials/loading-spinner"
import Filters from "./filter"
import { MediaGridContent } from "./media-grid"
import { EMessageTypes } from "@/utils/enums"
import { useMediaPagination } from "@/hooks/use-media-pagination"
import type { TMediaFilters, TMessageFullInfo } from "@/utils/types/be-api"
import { TUserWithProfileFE } from "@/utils/types/fe-api"

// Header component
const Header = React.memo(({ onClose }: { onClose: () => void }) => (
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
))

Header.displayName = "Header"

// Tabs component
const Tabs = React.memo(
  ({
    tab,
    setTab,
  }: {
    tab: "Images/Video" | "files" | "voices" | "links"
    setTab: (tab: "Images/Video" | "files" | "voices" | "links") => void
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
)

Tabs.displayName = "Tabs"

// Tối ưu MediaArchivePanel với React.memo
const MediaArchivePanel = React.memo(
  ({
    onClose,
    creator,
    recipient,
    initialTab = "Images/Video",
    directChatId,
  }: {
    onClose: () => void
    creator: TUserWithProfileFE
    recipient: TUserWithProfileFE
    initialTab?: "Images/Video" | "files" | "voices" | "links"
    directChatId: number
  }) => {
    const [tab, setTab] = useState<"Images/Video" | "files" | "voices" | "links">(initialTab)
    const [senderFilter, setSenderFilter] = useState<number | "all">("all")
    const [dateSort, setDateSort] = useState("desc")
    const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false)
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
    const [isDatePopupOpen, setIsDatePopupOpen] = useState(false)
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")
    const [dateFilterApplied, setDateFilterApplied] = useState(false)

    // Media pagination hook
    const {
      items: paginatedItems,
      loading,
      error,
      hasMore,
      currentPage,
      loadMore,
      setFilters,
      setSortOrder,
    } = useMediaPagination({
      directChatId,
      initialLimit: 20,
      initialSort: "desc",
      initialFilters: useMemo(() => {
        // Set initial filters based on initialTab
        const filters: TMediaFilters = {}
        if (initialTab === "Images/Video") {
          filters.types = ["image", "video"]
        } else if (initialTab === "files") {
          filters.type = "file"
        } else if (initialTab === "voices") {
          filters.type = "voice"
        }
        // Note: 'links' tab doesn't need initial filter as it filters on frontend
        return filters
      }, [initialTab]),
    })

    // const currentUser = useUser()
    // const { playAudio, setShowPlayer } = useVoicePlayerActions()

    // Update filters when tab, sender, or date filters change
    useEffect(() => {
      // Reset sender and date filters when changing tabs
      if (tab !== initialTab) {
        setSenderFilter("all")
        setFromDate("")
        setToDate("")
        setDateFilterApplied(false)
      }

      const filters: TMediaFilters = {}

      // Type filter based on current tab
      if (tab === "Images/Video") {
        filters.types = ["image", "video"]
      } else if (tab === "files") {
        filters.type = "file"
      } else if (tab === "voices") {
        filters.type = "voice"
      }
      // Note: 'links' tab doesn't need type filter

      // Sender filter
      if (senderFilter !== "all") {
        filters.senderId = senderFilter
      }

      // Date filter
      if (fromDate && toDate) {
        filters.fromDate = fromDate
        filters.toDate = toDate
      }

      setFilters(filters)
    }, [tab, senderFilter, fromDate, toDate, setFilters, initialTab])

    // Update sort order
    useEffect(() => {
      setSortOrder(dateSort as "asc" | "desc")
    }, [dateSort, setSortOrder])

    function applyDateFilter() {
      setIsDatePopupOpen(false)
      setDateFilterApplied(!!(fromDate && toDate))
    }

    // Lọc dữ liệu theo filter (legacy - will be replaced by pagination)
    const filterItems = useMemo(
      () => (items: TMessageFullInfo[]) => {
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
      },
      [senderFilter, fromDate, toDate]
    )

    // Nhóm media theo ngày
    const groupByDate = useMemo(
      () => (items: TMessageFullInfo[]) => {
        const groups: { [date: string]: TMessageFullInfo[] } = {}
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
      },
      [dateSort]
    )

    // Use paginated items instead of legacy mediaData
    let items = paginatedItems

    // Filter items based on current tab
    if (tab === "Images/Video") {
      // Backend already returns only IMAGE and VIDEO types
      items = paginatedItems
    } else if (tab === "files") {
      // Backend already returns only DOCUMENT types
      items = paginatedItems
    } else if (tab === "voices") {
      // Backend already returns only AUDIO types
      items = paginatedItems
    } else if (tab === "links") {
      // For Links tab, filter TEXT messages that contain URLs
      items = paginatedItems.filter(
        (item) =>
          item.type === EMessageTypes.TEXT &&
          item.content &&
          (item.content.includes("http://") || item.content.includes("https://"))
      )
    }

    const grouped = groupByDate(items)

    // Filter items for MediaViewerModal (only items with mediaUrl)
    const mediaItemsForViewer = items
      .filter((item) => item.Media?.url)
      .map((item) => ({
        id: item.id,
        type: item.type,
        mediaUrl: item.Media?.url!,
        fileName: item.Media?.fileName,
        thumbnailUrl: item.Media?.thumbnailUrl,
        createdAt: item.createdAt,
        authorId: item.authorId,
      }))

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
          members={[creator, recipient]}
          applyDateFilter={applyDateFilter}
        />
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 STYLE-styled-scrollbar">
          {loading && currentPage === 1 && (
            <LoadingSpinner size="md" color="gray" text="Loading media..." />
          )}

          {error && (
            <div className="flex justify-center items-center py-8">
              <div className="text-red-400">Error: {error}</div>
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-400">
                {tab === "links" ? "No links found" : "No media found"}
              </div>
            </div>
          )}

          {items.length > 0 && (
            <MediaGridContent
              grouped={grouped}
              tab={tab}
              mixedMedia={items}
              setSelectedMediaIndex={setSelectedMediaIndex}
              setIsMediaViewerOpen={setIsMediaViewerOpen}
              onLoadMore={loadMore}
              hasMore={hasMore}
              loading={loading}
            />
          )}
        </div>

        {/* Media Viewer Modal */}
        <MediaViewerModal
          isOpen={isMediaViewerOpen}
          onClose={() => setIsMediaViewerOpen(false)}
          mediaItems={mediaItemsForViewer}
          initialIndex={selectedMediaIndex}
          creator={creator}
          recipient={recipient}
        />
      </div>
    )
  }
)

MediaArchivePanel.displayName = "MediaArchivePanel"

export default MediaArchivePanel
