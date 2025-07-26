import { useState, useRef, useEffect } from "react"
import dayjs from "dayjs"
import { ChevronDown, ChevronRight, X } from "lucide-react"

const Filters = ({
  senderFilter,
  setSenderFilter,
  isDatePopupOpen,
  setIsDatePopupOpen,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  creator,
  recipient,
  datePopupRef,
  applyDateFilter,
}: {
  senderFilter: string
  setSenderFilter: (senderFilter: string) => void
  dateSort: string
  setDateSort: (dateSort: string) => void
  isDatePopupOpen: boolean
  setIsDatePopupOpen: (v: boolean) => void
  fromDate: string
  setFromDate: (v: string) => void
  toDate: string
  setToDate: (v: string) => void
  creator: any
  recipient: any
  datePopupRef: React.RefObject<HTMLDivElement>
  applyDateFilter: () => void
}) => {
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false)
  const [isSenderPopupOpen, setIsSenderPopupOpen] = useState(false)
  const [senderSearch, setSenderSearch] = useState("")
  const [dateFilterApplied, setDateFilterApplied] = useState(false)
  const suggestionRef = useRef<HTMLDivElement>(null)
  const dateButtonRef = useRef<HTMLButtonElement>(null)
  const senderPopupRef = useRef<HTMLDivElement>(null)

  // Đóng date popup khi click ra ngoài
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (datePopupRef.current && !datePopupRef.current.contains(e.target as Node)) {
        setIsDatePopupOpen(false)
        setIsSuggestionOpen(false)
      }
    }
    if (isDatePopupOpen) document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [isDatePopupOpen])

  // Đóng sender popup khi click ra ngoài
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (senderPopupRef.current && !senderPopupRef.current.contains(e.target as Node)) {
        setIsSenderPopupOpen(false)
      }
    }
    if (isSenderPopupOpen) document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [isSenderPopupOpen])

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
    if (!dateFilterApplied || !fromDate || !toDate) return "Ngày gửi"

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
    const allUsers = [
      { id: creator.id, name: creator.Profile.fullName },
      { id: recipient.id, name: recipient.Profile.fullName },
    ]
    return allUsers.find((user) => user.id === senderFilter)?.name
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
          className="w-full bg-[#232526] text-white rounded-lg px-3 py-2 flex items-center justify-between hover:bg-[#2C2E31] transition-colors duration-200"
          onClick={() => setIsSenderPopupOpen(!isSenderPopupOpen)}
          type="button"
        >
          <span className="font-medium truncate text-xs">
            {getSelectedUserName() || "Người gửi"}
          </span>
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
            ref={senderPopupRef}
            className="absolute left-0 top-[110%] z-20 bg-[#202124] min-w-[280px] rounded-xl shadow-lg border border-[#222] p-2 animate-fade-in"
          >
            <div className="px-2 py-2">
              <div className="font-semibold text-white mb-2 text-[15px]">Tìm kiếm</div>
              <input
                type="text"
                placeholder="Tìm kiếm"
                className="w-full bg-[#232526] text-white rounded px-3 py-2 outline-none border border-[#333] text-sm"
                value={senderSearch}
                onChange={(e) => setSenderSearch(e.target.value)}
              />
            </div>
            <div className="border-t border-[#333] my-2"></div>
            <div className="px-2 py-2 max-h-[200px] overflow-y-auto">
              {(() => {
                const allUsers = [
                  {
                    id: creator.id,
                    name: creator.Profile.fullName,
                    avatar: creator.Profile.avatar,
                  },
                  {
                    id: recipient.id,
                    name: recipient.Profile.fullName,
                    avatar: recipient.Profile.avatar,
                  },
                ]

                const filteredUsers = allUsers.filter((user) => {
                  const searchTerm = senderSearch.toLowerCase().trim()
                  const userName = user.name.toLowerCase()

                  // Nếu không có search term, hiển thị tất cả
                  if (!searchTerm) return true

                  // Tìm kiếm chính xác
                  if (userName.includes(searchTerm)) return true

                  // Tìm kiếm theo từng từ
                  const searchWords = searchTerm.split(" ").filter((word) => word.length > 0)
                  const userNameWords = userName.split(" ")

                  // Kiểm tra xem tất cả từ tìm kiếm có xuất hiện trong tên không
                  return searchWords.every((searchWord) =>
                    userNameWords.some((nameWord: string) => nameWord.includes(searchWord))
                  )
                })

                return filteredUsers.map((user) => (
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
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-xs font-semibold">{user.name[0]}</span>
                      )}
                    </div>
                    <span>{user.name}</span>
                  </button>
                ))
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Ngày gửi - button mở popup */}
      <div className="relative flex-1">
        <button
          ref={dateButtonRef}
          className="w-full bg-[#232526] text-white rounded-lg px-3 py-2 flex items-center justify-between hover:bg-[#2C2E31] transition-colors duration-200"
          onClick={() => setIsDatePopupOpen(!isDatePopupOpen)}
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
            ref={datePopupRef}
            className="fixed z-[9999] bg-[#202124] min-w-[350px] rounded-xl shadow-lg border border-[#222] p-0 animate-fade-in"
            style={{
              minWidth: 350,
              left: dateButtonRef.current
                ? dateButtonRef.current.getBoundingClientRect().right - 350
                : 0,
              top: dateButtonRef.current
                ? dateButtonRef.current.getBoundingClientRect().bottom + 10
                : 0,
            }}
          >
            {/* Gợi ý thời gian */}
            <div className="px-5 pt-5 pb-1 relative" ref={suggestionRef}>
              <button
                className="flex items-center justify-between w-full text-sm text-white font-medium py-2 px-2 rounded hover:bg-[#232526] transition"
                onMouseEnter={() => setIsSuggestionOpen(true)}
                onMouseLeave={() => setIsSuggestionOpen(false)}
                type="button"
              >
                <span>Gợi ý thời gian</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              {isSuggestionOpen && (
                <div
                  className="fixed z-[9999] min-w-[150px] rounded-md bg-[#232526] shadow-lg border border-[#222]"
                  style={{
                    left: datePopupRef.current
                      ? datePopupRef.current.getBoundingClientRect().left -
                        datePopupRef.current.offsetWidth * 0.81
                      : 0,
                    top: suggestionRef.current
                      ? suggestionRef.current.getBoundingClientRect().top +
                        suggestionRef.current.offsetHeight * 0.35
                      : 0,
                  }}
                  onMouseEnter={() => setIsSuggestionOpen(true)}
                  onMouseLeave={() => setIsSuggestionOpen(false)}
                >
                  <button
                    className="w-full px-3 py-2 text-left text-white hover:bg-[#313438] text-sm"
                    onClick={() => handleSuggestion(7)}
                  >
                    7 ngày trước
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-white hover:bg-[#313438] text-sm"
                    onClick={() => handleSuggestion(30)}
                  >
                    30 ngày trước
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-white hover:bg-[#313438] text-sm"
                    onClick={() => handleSuggestion(90)}
                  >
                    3 tháng trước
                  </button>
                </div>
              )}
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
    </div>
  )
}

export default Filters
