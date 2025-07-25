import React, { useEffect, useState, useRef } from "react"
import { friendService } from "@/services/friend.service"
import { CustomAvatar, DefaultAvatar } from "@/components/materials"
import { Spinner } from "@/components/materials/spinner"
import type { TGetFriendsData } from "@/utils/types/be-api"
import { useUser } from "@/hooks/user"

interface ShareMessageModalProps {
  open: boolean
  onClose: () => void
  onSelectFriend: (friend: TGetFriendsData) => void
}

const DEFAULT_LIMIT = 5
const SEARCH_LIMIT = 30

export const ShareMessageModal: React.FC<ShareMessageModalProps> = ({
  open,
  onClose,
  onSelectFriend,
}) => {
  const user = useUser()
  const [friends, setFriends] = useState<TGetFriendsData[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastFriendId, setLastFriendId] = useState<number | undefined>(undefined)
  const [search, setSearch] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // Hàm lấy bạn bè (phân trang hoặc search)
  const fetchFriends = async (opts: {
    reset?: boolean
    search?: string
    lastFriendId?: number
  }) => {
    if (!user || loading) return
    setLoading(true)
    const params: any = { userId: user.id }
    if (opts.search && opts.search.trim() !== "") {
      params.search = opts.search.trim()
      params.limit = SEARCH_LIMIT
      if (opts.lastFriendId) params.lastFriendId = opts.lastFriendId
    } else {
      params.limit = DEFAULT_LIMIT
      if (opts.lastFriendId) params.lastFriendId = opts.lastFriendId
    }
    const newFriends = await friendService.getFriends(params)
    if (opts.reset) {
      setFriends(newFriends)
    } else {
      setFriends((prev) => [...prev, ...newFriends])
    }
    setHasMore(newFriends.length === (params.limit || DEFAULT_LIMIT))
    if (newFriends.length > 0) setLastFriendId(newFriends[newFriends.length - 1].id)
    setLoading(false)
  }

  // Reset khi mở modal hoặc xóa search
  useEffect(() => {
    if (!user || !open) return
    setFriends([])
    setLastFriendId(undefined)
    setHasMore(true)
    setIsSearching(false)
    if (search.trim() === "") {
      fetchFriends({ reset: true })
    } else {
      fetchFriends({ reset: true, search })
      setIsSearching(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, search])

  // Xác định đúng đối tượng là bạn bè
  const getFriendUser = (friend: TGetFriendsData, userId: number) => {
    if (friend.senderId === userId) return friend.Recipient
    return (friend as any).Sender
  }

  // Lọc theo search (chỉ cần khi search, còn lại đã phân trang)
  const filteredFriends = !user
    ? []
    : friends
        .map((f) => ({ ...f, FriendUser: getFriendUser(f, user.id) }))
        .filter((f) => f.FriendUser && f.FriendUser.id !== user.id)

  // Xử lý scroll để load thêm (phân trang hoặc search tiếp)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore || loading) return
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      if (search.trim() === "") {
        fetchFriends({ lastFriendId })
      } else {
        fetchFriends({ search, lastFriendId })
      }
    }
  }

  if (!open) return null

  return (
    <div className="fixed left-1/2 top-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2 bg-[#18181c] rounded-xl shadow-lg w-full max-w-md p-6 border border-[#23232a]">
      {/* Nút đóng */}
      <button className="absolute top-3 right-3 text-gray-400 hover:text-white" onClick={onClose}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <h2 className="text-lg font-bold text-white mb-4">Chia sẻ tin nhắn cho bạn bè</h2>
      {/* Ô tìm kiếm */}
      <input
        type="text"
        className="w-full p-2 mb-4 rounded bg-[#23232a] text-white placeholder-gray-400 outline-none"
        placeholder="Tìm kiếm bạn bè..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {/* Danh sách bạn bè */}
      <div className="max-h-72 overflow-y-auto space-y-2" ref={listRef} onScroll={handleScroll}>
        {filteredFriends.length === 0 && !loading ? (
          <div className="text-gray-400 text-center py-8">Không tìm thấy bạn bè nào.</div>
        ) : (
          filteredFriends.map((friend) => {
            const { FriendUser } = friend
            const { Profile, email } = FriendUser
            return (
              <button
                key={FriendUser.id}
                className="flex items-center w-full gap-3 p-2 rounded-lg bg-[#23232a] hover:bg-[#35363a] transition-colors text-left"
                onClick={() => onSelectFriend(friend)}
              >
                <CustomAvatar
                  fallback={<DefaultAvatar size={40} />}
                  src={Profile.avatar || undefined}
                  imgSize={40}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{Profile.fullName}</div>
                  <div className="text-xs text-gray-400 truncate">{email}</div>
                </div>
              </button>
            )
          })
        )}
        {loading && (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        )}
      </div>
    </div>
  )
}
