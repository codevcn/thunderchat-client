import { useState, useRef, useEffect } from "react"
import dayjs from "dayjs"
import { ChevronDown, ChevronRight, X } from "lucide-react"
import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react-dom"
import ReactDOM from "react-dom"
import { TUserWithProfileFE } from "@/utils/types/fe-api"

// Type cho user trong filter
type FilterUser = {
  id: number
  name: string
  avatar?: string | null
}

// Function tách riêng để filter users theo tên
const filterUsersByName = (users: FilterUser[], searchTerm: string): FilterUser[] => {
  return users.filter((user) => {
    const search = searchTerm.toLowerCase().trim()
    const userName = user.name.toLowerCase()

    // Nếu không có search term, hiển thị tất cả
    if (!search) return true

    // Tìm kiếm chính xác
    if (userName.includes(search)) return true

    // Tìm kiếm theo từng từ
    const searchWords = search.split(" ").filter((word) => word.length > 0)
    const userNameWords = userName.split(" ")

    // Kiểm tra xem tất cả từ tìm kiếm có xuất hiện trong tên không
    return searchWords.every((searchWord) =>
      userNameWords.some((nameWord: string) => nameWord.includes(searchWord))
    )
  })
}

// Component tách riêng để render danh sách users
const UserList = ({
  users,
  senderSearch,
  senderFilter,
  setSenderFilter,
  setIsSenderPopupOpen,
}: {
  users: TUserWithProfileFE[]
  senderSearch: string
  senderFilter: number | "all"
  setSenderFilter: (senderFilter: number | "all") => void
  setIsSenderPopupOpen: (isOpen: boolean) => void
}) => {
  const allUsers = users.map((user) => ({
    id: user.id,
    name: user.Profile.fullName,
    avatar: user.Profile.avatar,
  }))

  const filteredUsers = filterUsersByName(allUsers, senderSearch)

  return (
    <>
      {filteredUsers.map((user) => (
        <button
          key={user.id}
          className={`w-full text-left px-3 py-2 rounded hover:bg-[#232526] text-white text-sm flex items-center gap-3 ${senderFilter === user.id ? "bg-[#232526]" : ""}`}
          onClick={() => {
            setSenderFilter(senderFilter === user.id ? "all" : user.id)
            setIsSenderPopupOpen(false)
          }}
        >
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xs font-semibold">{user.name[0]}</span>
            )}
          </div>
          <span>{user.name}</span>
        </button>
      ))}
    </>
  )
}

type TFilterUser = {
  senderFilter: number | "all"
  setSenderFilter: (senderFilter: number | "all") => void
  dateSort: string
  setDateSort: (dateSort: string) => void
  isDatePopupOpen: boolean
  setIsDatePopupOpen: (v: boolean) => void
  fromDate: string
  setFromDate: (v: string) => void
  toDate: string
  setToDate: (v: string) => void
  members: TUserWithProfileFE[]
  applyDateFilter: () => void
}

const Filters = ({
  senderFilter,
  setSenderFilter,
  isDatePopupOpen,
  setIsDatePopupOpen,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  members,
  applyDateFilter,
}: TFilterUser) => {
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false)
  const [isSenderPopupOpen, setIsSenderPopupOpen] = useState(false)
  const [senderSearch, setSenderSearch] = useState("")
  const [dateFilterApplied, setDateFilterApplied] = useState(false)
  const suggestionRef = useRef<HTMLDivElement>(null)

  // Floating UI cho sender popup
  const {
    refs: senderRefs,
    floatingStyles: senderFloatingStyles,
    update: updateSender,
  } = useFloating({
    placement: "bottom-start",
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  // Floating UI cho date popup
  const {
    refs: dateRefs,
    floatingStyles: dateFloatingStyles,
    update: updateDate,
  } = useFloating({
    placement: "bottom-end",
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  // Floating UI cho suggestion popup
  const {
    refs: suggestionRefs,
    floatingStyles: suggestionFloatingStyles,
    update: updateSuggestion,
  } = useFloating({
    placement: "right-start",
    middleware: [
      offset(4),
      flip({
        fallbackPlacements: ["left-start", "right-end", "left-end"],
      }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  })

  // Đóng date popup khi click ra ngoài
  useEffect(() => {
    function handle(e: MouseEvent) {
      const floatingEl = dateRefs.floating.current
      const referenceEl = dateRefs.reference.current
      const isRefEl = referenceEl instanceof HTMLElement
      if (
        floatingEl &&
        !floatingEl.contains(e.target as Node) &&
        (!isRefEl || !referenceEl.contains(e.target as Node))
      ) {
        setIsDatePopupOpen(false)
        setIsSuggestionOpen(false)
      }
    }
    if (isDatePopupOpen) document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [isDatePopupOpen, dateRefs])

  // Đóng sender popup khi click ra ngoài
  useEffect(() => {
    function handle(e: MouseEvent) {
      const floatingEl = senderRefs.floating.current
      const referenceEl = senderRefs.reference.current
      const isRefEl = referenceEl instanceof HTMLElement
      if (
        floatingEl &&
        !floatingEl.contains(e.target as Node) &&
        (!isRefEl || !referenceEl.contains(e.target as Node))
      ) {
        setIsSenderPopupOpen(false)
      }
    }
    if (isSenderPopupOpen) document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [isSenderPopupOpen, senderRefs])

  // Hàm chọn gợi ý thời gian
  const handleSuggestion = (days: number) => {
    setFromDate(dayjs().subtract(days, "day").format("YYYY-MM-DD"))
    setToDate(dayjs().format("YYYY-MM-DD"))
    setDateFilterApplied(true)
    setIsSuggestionOpen(false)
    setIsDatePopupOpen(false)
    applyDateFilter()
  }

  // Hàm format ngày hiển thị
  const getDateDisplayText = () => {
    if (!dateFilterApplied || !fromDate || !toDate) return "Send date"

    const from = dayjs(fromDate)
    const to = dayjs(toDate)
    const currentYear = dayjs().year()

    const fromFormatted =
      from.year() === currentYear ? from.format("DD/MM") : from.format("DD/MM/YYYY")
    const toFormatted = to.year() === currentYear ? to.format("DD/MM") : to.format("DD/MM/YYYY")

    return `${fromFormatted} - ${toFormatted}`
  }

  // Hàm xóa filter ngày
  const clearDateFilter = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFromDate("")
    setToDate("")
    setDateFilterApplied(false)
  }

  // Hàm xử lý thay đổi ngày
  const handleFromDateChange = (value: string) => {
    setFromDate(value)
    // Nếu toDate đã chọn và nhỏ hơn fromDate, reset toDate
    if (toDate && value && dayjs(value).isAfter(dayjs(toDate))) {
      setToDate("")
    }
  }

  const handleToDateChange = (value: string) => {
    setToDate(value)
    // Nếu fromDate đã chọn và lớn hơn toDate, reset fromDate
    if (fromDate && value && dayjs(value).isBefore(dayjs(fromDate))) {
      setFromDate("")
    }
  }

  // Hàm lấy tên người dùng theo ID
  const getSelectedUserName = () => {
    if (senderFilter === "all") return null
    return members.find((user) => user.id === senderFilter)?.Profile.fullName
  }

  // Hàm xóa filter người gửi
  const clearSenderFilter = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSenderFilter("all")
  }

  return (
    <div className="flex gap-4 px-4 py-3 relative z-10">
      {/* Người gửi */}
      <div className="relative flex-1">
        <button
          ref={senderRefs.setReference}
          className="w-full bg-[#232526] text-white rounded-lg px-3 py-2 flex items-center justify-between hover:bg-[#2C2E31] transition-colors duration-200"
          onClick={() => {
            setIsSenderPopupOpen(!isSenderPopupOpen)
            if (!isSenderPopupOpen) {
              setTimeout(updateSender, 0)
            }
          }}
          type="button"
        >
          <span className="font-medium truncate text-xs">{getSelectedUserName() || "Sender"}</span>
          {senderFilter !== "all" ? (
            <X
              className="w-4 h-4 text-gray-400 hover:text-white transition-colors"
              onClick={clearSenderFilter}
            />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Popup filter người gửi */}
        {isSenderPopupOpen && (
          <div
            ref={senderRefs.setFloating}
            style={senderFloatingStyles}
            className="absolute z-20 bg-[#202124] min-w-[280px] rounded-xl shadow-lg border border-[#222] p-2 animate-fade-in"
          >
            <div className="px-2 py-2">
              <div className="font-semibold text-white mb-2 text-[15px]">Search</div>
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-[#232526] text-white rounded px-3 py-2 outline-none border border-[#333] text-sm"
                value={senderSearch}
                onChange={(e) => setSenderSearch(e.target.value)}
              />
            </div>
            <div className="border-t border-[#333] my-2"></div>
            <div className="px-2 py-2 max-h-[200px] overflow-y-auto">
              <UserList
                users={members}
                senderSearch={senderSearch}
                senderFilter={senderFilter}
                setSenderFilter={setSenderFilter}
                setIsSenderPopupOpen={setIsSenderPopupOpen}
              />
            </div>
          </div>
        )}
      </div>

      {/* Ngày gửi - button mở popup */}
      <div className="relative flex-1">
        <button
          ref={dateRefs.setReference}
          className="w-full bg-[#232526] text-white rounded-lg px-3 py-2 flex items-center justify-between hover:bg-[#2C2E31] transition-colors duration-200"
          onClick={() => {
            setIsDatePopupOpen(!isDatePopupOpen)
            if (!isDatePopupOpen) {
              setTimeout(updateDate, 0)
            }
          }}
          type="button"
        >
          <span className="text-xs font-medium truncate">{getDateDisplayText()}</span>
          {dateFilterApplied ? (
            <X
              className="w-4 h-4 text-gray-400 hover:text-white transition-colors"
              onClick={clearDateFilter}
            />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Popup filter ngày */}
        {isDatePopupOpen && (
          <div
            ref={dateRefs.setFloating}
            style={dateFloatingStyles}
            className="fixed z-[9999] bg-[#202124] min-w-[350px] rounded-xl shadow-lg border border-[#222] p-0 animate-fade-in"
          >
            {/* Gợi ý thời gian */}
            <div className="px-5 pt-5 pb-1 relative" ref={suggestionRef}>
              <button
                ref={suggestionRefs.setReference}
                className="flex items-center justify-between w-full text-sm text-white font-medium py-2 px-2 rounded hover:bg-[#232526] transition"
                onMouseEnter={() => {
                  setIsSuggestionOpen(true)
                  setTimeout(updateSuggestion, 0)
                }}
                onMouseLeave={() => setIsSuggestionOpen(false)}
                type="button"
              >
                <span>Time suggestions</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="border-t border-[#313438] mx-4 my-1"></div>

            {/* Chọn khoảng thời gian */}
            <div className="px-5 pt-2 pb-5">
              <div className="text-white text-[15px] mb-2 font-medium">Chọn khoảng thời gian</div>
              <div className="flex gap-3">
                {/* Từ ngày */}
                <div className="flex-1">
                  <div className="text-white text-xs mb-1">Từ ngày</div>
                  <input
                    type="date"
                    className="w-full px-4 py-2 rounded border focus:border-blue-500 border-[#333] bg-[#181A1B] text-white placeholder-gray-400 text-sm outline-none transition"
                    value={fromDate}
                    onChange={(e) => handleFromDateChange(e.target.value)}
                    max={dayjs().format("YYYY-MM-DD")}
                  />
                </div>
                {/* Đến ngày */}
                <div className="flex-1">
                  <div className="text-white text-xs mb-1">Đến ngày</div>
                  <input
                    type="date"
                    className="w-full px-4 py-2 rounded border focus:border-blue-500 border-[#333] bg-[#181A1B] text-white placeholder-gray-400 text-sm outline-none transition"
                    value={toDate}
                    onChange={(e) => handleToDateChange(e.target.value)}
                    min={fromDate || undefined}
                    max={dayjs().format("YYYY-MM-DD")}
                  />
                </div>
              </div>
            </div>
            {/* Nút */}
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[#333]">
              <button
                className="bg-[#313438] hover:bg-gray-700 text-white px-4 py-2 rounded"
                onClick={() => setIsDatePopupOpen(false)}
              >
                Hủy
              </button>
              <button
                className={`px-4 py-2 rounded transition-colors ${
                  fromDate && toDate
                    ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
                onClick={() => {
                  if (fromDate && toDate) {
                    setDateFilterApplied(true)
                    setIsDatePopupOpen(false)
                    applyDateFilter()
                  }
                }}
                disabled={!fromDate || !toDate}
              >
                Xác nhận
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion popup - render bằng portal để tránh nested positioning */}
      {isSuggestionOpen &&
        ReactDOM.createPortal(
          <div
            ref={suggestionRefs.setFloating}
            style={suggestionFloatingStyles}
            className="fixed z-[10000] min-w-[150px] rounded-md bg-[#232526] shadow-lg border border-[#222]"
            onMouseEnter={() => setIsSuggestionOpen(true)}
            onMouseLeave={() => setIsSuggestionOpen(false)}
          >
            <button
              className="w-full px-3 py-2 text-left text-white hover:bg-[#313438] text-sm"
              onClick={(e) => {
                e.stopPropagation()
                handleSuggestion(7)
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              7 days ago
            </button>
            <button
              className="w-full px-3 py-2 text-left text-white hover:bg-[#313438] text-sm"
              onClick={(e) => {
                e.stopPropagation()
                handleSuggestion(30)
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              30 days ago
            </button>
            <button
              className="w-full px-3 py-2 text-left text-white hover:bg-[#313438] text-sm"
              onClick={(e) => {
                e.stopPropagation()
                handleSuggestion(90)
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              3 months ago
            </button>
          </div>,
          document.body
        )}
    </div>
  )
}

export default Filters
