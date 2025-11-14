// smart-search.tsx
import { useState, useRef, useEffect } from "react"
import {
  Search,
  X,
  ArrowRight,
  Filter,
  Calendar,
  User,
  Check,
  ChevronDown,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react"
import { TSmartSearchResponse } from "@/utils/types/be-api"
import { toaster } from "@/utils/toaster"
import { searchService } from "@/services/search.service"
import { EChatType } from "@/utils/enums"

// --- TYPES ---
// Type này sẽ được nhận từ InfoBar
export type TMember = {
  id: number
  email: string
  Profile: {
    id: number
    fullName: string
    avatar?: string | null
  }
}

type SearchFilters = {
  startDate: string
  endDate: string
  authorId: string | null
}

type SmartSearchProps = {
  onMessageClick?: (messageId: number, chatId: number, chatType: EChatType) => void
}

export default function SmartSearch({ onMessageClick }: SmartSearchProps) {
  // --- BỎ STATE isExpanded ---
  const [query, setQuery] = useState("")
  const [showFilter, setShowFilter] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<TSmartSearchResponse | null>(null)
  const formatDate = (date: Date) => date.toISOString().split("T")[0]

  const [filters, setFilters] = useState<SearchFilters>(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)
    return {
      startDate: formatDate(thirtyDaysAgo),
      endDate: formatDate(today),
      authorId: null,
    }
  })

  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isSearching) return
    setIsSearching(true)
    setResults(null)
    try {
      const endDateForApi = new Date(filters.endDate)
      endDateForApi.setDate(endDateForApi.getDate() + 1)
      const formattedEndDate = formatDate(endDateForApi)
      const payload = {
        query,
        startDate: filters.startDate,
        endDate: formattedEndDate,
        authorId: filters.authorId ? Number(filters.authorId) : undefined,
      }
      const data = await searchService.search(payload)
      setResults(data)
      console.log("data", data)
    } catch (error: any) {
      console.error("Search error:", error)
      toaster.error(error.message || "Failed to search messages")
    } finally {
      setIsSearching(false)
    }
  }

  const toggleFilter = () => setShowFilter(!showFilter)

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleSelectUser = (userId: string | number | null) => {
    const newAuthorId = userId ? userId.toString() : null
    setFilters((prev) => ({ ...prev, authorId: newAuthorId }))
    setShowUserDropdown(false)
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900/95">
      <div className="p-2 border-b border-white/5">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-grow">
            {isSearching ? (
              <Loader2
                className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 animate-spin"
                size={16}
              />
            ) : (
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500"
                size={16}
              />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything..."
              className="w-full pl-9 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {query ? (
                <button
                  type="submit"
                  className="p-1 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors flex items-center justify-center"
                >
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={toggleFilter}
            className={`p-2 rounded-lg border transition-all ${
              showFilter
                ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
            title="Toggle filters"
          >
            <Filter size={18} />
          </button>
        </form>
      </div>

      {showFilter && (
        <div className="px-3 pb-3 pt-2 border-b border-white/5 bg-black/20">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-semibold mb-1.5 flex items-center gap-1">
                <Calendar size={12} /> Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleDateChange("startDate", e.target.value)}
                  className="w-1/2 bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleDateChange("endDate", e.target.value)}
                  className="w-1/2 bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Kết quả (Results) - Co giãn và tự cuộn */}
      <div className="flex-1 overflow-y-auto STYLE-styled-scrollbar p-3">
        {isSearching ? (
          <div className="flex justify-center items-center pt-10">
            <Loader2 className="text-purple-500 animate-spin" size={24} />
          </div>
        ) : results ? (
          <div>
            {/* AI Answer Card */}
            {results.answer && (
              <div className="mb-4 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3.5">
                <div className="flex items-center gap-2 text-purple-400 mb-2 font-bold text-xs uppercase tracking-wider">
                  <Sparkles size={14} /> AI Summary
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">{results.answer}</p>
              </div>
            )}

            {/* Source Messages List */}
            {results.sources?.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                    Related Messages ({results.sources.length})
                  </span>
                  <span className="text-[10px] text-gray-600 italic">Sorted by relevance</span>
                </div>

                <div className="flex flex-col gap-2">
                  {results.sources.map((source) => (
                    <div
                      key={source.messageId}
                      onClick={() =>
                        onMessageClick?.(source.messageId, source.chatId, source.chatType)
                      }
                      className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/20 rounded-lg p-3 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[9px] font-bold text-white uppercase">
                            {source.author?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span className="font-medium text-sm text-purple-300 group-hover:text-purple-200 transition-colors">
                            {source.author}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Clock size={10} />
                          {/* Dùng source.date từ API */}
                          <span>{source.date}</span>
                        </div>
                      </div>

                      <div
                        className="text-sm text-gray-300 line-clamp-3 leading-snug [&>span]:font-medium [&>span]:text-white [&>span]:px-1 [&>span]:py-0.5 [&>span]:rounded-[4px] [&>span]:box-decoration-clone"
                        // Dùng source.content từ API
                        dangerouslySetInnerHTML={{ __html: source.content }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 flex flex-col items-center justify-center text-gray-500">
                <Search size={32} className="mb-2 opacity-20" />
                <p className="text-sm">No relevant messages found.</p>
                <p className="text-xs mt-1 opacity-60">Try adjusting your filters or query.</p>
              </div>
            )}
          </div>
        ) : (
          /* Trạng thái ban đầu: chưa search */
          <div className="text-center py-8 flex flex-col items-center justify-center text-gray-600 h-full">
            <Sparkles size={32} className="mb-2 opacity-30" />
            <p className="text-sm font-medium">Ask AI or search messages</p>
            <p className="text-xs mt-1 opacity-60">Find messages or get summaries.</p>
          </div>
        )}
      </div>
    </div>
  )
}
