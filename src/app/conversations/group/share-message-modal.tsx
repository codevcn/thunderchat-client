import React, { useEffect, useState, useMemo } from "react"
import { CustomAvatar, DefaultAvatar } from "@/components/materials"
import { useAppSelector } from "@/hooks/redux"
import { sortDirectChatsByPinned } from "@/redux/conversations/conversations.selectors"
import { useUser } from "@/hooks/user"
import { searchConversations } from "@/services/search.service"
import { directChatService } from "@/services/direct-chat.service"
import { chattingService } from "@/services/chatting.service"
import { toast } from "sonner"
import type {
  TStateMessage,
  TConversationCard,
  TConversationSearchResult,
} from "@/utils/types/global"
import { EMessageTypes } from "@/utils/enums"
import { converToMessageTypeAllTypes } from "@/utils/helpers"

interface ShareMessageModalProps {
  open: boolean
  onClose: () => void
  messageToShare?: TStateMessage
  onSelectConversation?: (conversation: TConversationCard) => void
}

const CONVERSATIONS_LIMIT = 10

export const ShareMessageModal: React.FC<ShareMessageModalProps> = ({
  open,
  onClose,
  messageToShare,
  onSelectConversation,
}) => {
  const user = useUser()
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<TConversationSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Lấy danh sách conversations từ Redux (cho trường hợp không tìm kiếm)
  const allConversations = useAppSelector(sortDirectChatsByPinned)

  // Tìm kiếm conversations khi có từ khóa
  useEffect(() => {
    const performSearch = async () => {
      if (search.trim() === "") {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const results = await searchConversations(search)
        setSearchResults(results)
      } catch (error) {
        console.error("Error searching conversations:", error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    performSearch()
  }, [search])

  // Tách riêng search results và conversations từ Redux
  const searchResultsFiltered = useMemo(() => {
    if (search.trim() !== "") {
      return searchResults
        .filter((conversation) => conversation.type === "DIRECT")
        .slice(0, CONVERSATIONS_LIMIT)
    }
    return []
  }, [search, searchResults])

  const conversationsFromRedux = useMemo(() => {
    if (search.trim() === "" && allConversations) {
      return allConversations.slice(0, CONVERSATIONS_LIMIT)
    }
    return []
  }, [allConversations, search])

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
      <h2 className="text-lg font-bold text-white mb-4">Chia sẻ tin nhắn cho cuộc trò chuyện</h2>
      {/* Ô tìm kiếm */}
      <input
        type="text"
        className="w-full p-2 mb-4 rounded bg-[#23232a] text-white placeholder-gray-400 outline-none"
        placeholder="Tìm kiếm cuộc trò chuyện..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {/* Danh sách conversations */}
      <div className="max-h-72 overflow-y-auto space-y-2 STYLE-styled-scrollbar pr-1">
        {isSearching ? (
          <div className="text-gray-400 text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
            Đang tìm kiếm...
          </div>
        ) : searchResultsFiltered.length === 0 && conversationsFromRedux.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            {search.trim() !== ""
              ? "Không tìm thấy cuộc trò chuyện nào."
              : "Không có cuộc trò chuyện nào."}
          </div>
        ) : (
          <>
            {/* Hiển thị search results */}
            {searchResultsFiltered.map((conversation) => {
              const { id, avatar = null, title = "", type = "DIRECT", email } = conversation
              return (
                <button
                  key={`search-${type}-${id}`}
                  className="flex items-center w-full gap-3 p-2 rounded-lg bg-[#23232a] hover:bg-[#35363a] transition-colors text-left"
                  onClick={async () => {
                    if (!messageToShare) {
                      toast.error("Không có tin nhắn để chia sẻ!")
                      return
                    }

                    try {
                      // Đóng modal
                      onClose()

                      // Chỉ xử lý direct chat
                      if (conversation.type === "DIRECT") {
                        try {
                          // Lấy thông tin đầy đủ về direct chat để có recipientId và creatorId
                          const directChatData = await directChatService.fetchDirectChat(
                            conversation.id
                          )

                          // Xác định receiverId dựa trên user hiện tại
                          const receiverId =
                            user?.id === directChatData.recipientId
                              ? directChatData.creatorId
                              : directChatData.recipientId

                          // Tạo payload theo đúng cấu trúc TChattingPayload["msgPayload"]
                          let payload: any = {
                            receiverId: receiverId, // ID của người nhận đúng
                            token: chattingService.getMessageToken(),
                            timestamp: new Date(),
                          }

                          // Xử lý payload theo loại tin nhắn
                          if (messageToShare.type === EMessageTypes.STICKER) {
                            // Tin nhắn sticker - sử dụng stickerUrl
                            payload = {
                              ...payload,
                              content: messageToShare.Sticker?.imageUrl || "",
                            }
                          } else if (messageToShare.type === EMessageTypes.TEXT) {
                            // Kiểm tra xem có phải tin nhắn emoji không
                            const hasEmojiImage =
                              messageToShare.content?.includes("<img") ||
                              messageToShare.content?.includes("emoji")

                            if (hasEmojiImage) {
                              // Tin nhắn emoji - chuyển thành TEXT với content HTML
                              payload = {
                                ...payload,
                                content: messageToShare.content || "",
                              }
                            } else {
                              // Tin nhắn text thường
                              payload = {
                                ...payload,
                                content: messageToShare.content || "",
                              }
                            }
                          } else {
                            // Các loại tin nhắn khác (IMAGE, VIDEO, AUDIO, DOCUMENT)
                            payload = {
                              ...payload,
                              content: messageToShare.content || "",
                              mediaUrl: messageToShare.Media?.url || "",
                              fileName: messageToShare.Media?.fileName || "",
                              fileType: messageToShare.Media?.type || "",
                            }
                          }

                          // Gửi tin nhắn sử dụng chattingService như trong codebase
                          chattingService.sendMessage(
                            converToMessageTypeAllTypes(
                              messageToShare.type,
                              messageToShare.Media?.type
                            ),
                            payload,
                            (res) => {
                              if (res && typeof res === "object" && Object.keys(res).length > 0) {
                                if ("success" in res && res.success) {
                                  chattingService.setAcknowledgmentFlag(true)
                                  chattingService.recursiveSendingQueueMessages()
                                  toast.success("Đã chia sẻ tin nhắn!")
                                } else if ("isError" in res && res.isError) {
                                  toast.error(res?.message || "Chia sẻ thất bại!")
                                }
                              } else {
                                // Trường hợp response rỗng hoặc không hợp lệ
                                toast.error("Không nhận được phản hồi từ server")
                              }
                            }
                          )
                        } catch (error) {
                          toast.error("Không thể lấy thông tin cuộc trò chuyện")
                        }
                      }

                      // Gọi callback nếu có
                      onSelectConversation?.(conversation as TConversationCard)
                    } catch (error) {
                      toast.error("Không thể chia sẻ tin nhắn!")
                    }
                  }}
                >
                  <CustomAvatar
                    fallback={<DefaultAvatar size={40} />}
                    src={avatar?.src || undefined}
                    imgSize={40}
                    fallbackClassName="bg-regular-violet-cl text-2xl"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{title}</div>
                    {email && <div className="text-sm text-gray-400 truncate">{email}</div>}
                  </div>
                </button>
              )
            })}

            {/* Hiển thị conversations từ Redux */}
            {conversationsFromRedux.map((conversation) => {
              const { id, avatar = null, title = "", type = "DIRECT", email } = conversation
              return (
                <button
                  key={`redux-${type}-${id}`}
                  className="flex items-center w-full gap-3 p-2 rounded-lg bg-[#23232a] hover:bg-[#35363a] transition-colors text-left"
                  onClick={async () => {
                    if (!messageToShare) {
                      toast.error("Không có tin nhắn để chia sẻ!")
                      return
                    }

                    try {
                      // Đóng modal
                      onClose()

                      // Chỉ xử lý direct chat
                      if (conversation.type === "DIRECT") {
                        try {
                          // Lấy thông tin đầy đủ về direct chat để có recipientId và creatorId
                          const directChatData = await directChatService.fetchDirectChat(
                            conversation.id
                          )

                          // Xác định receiverId dựa trên user hiện tại
                          const receiverId =
                            user?.id === directChatData.recipientId
                              ? directChatData.creatorId
                              : directChatData.recipientId

                          // Tạo payload theo đúng cấu trúc TChattingPayload["msgPayload"]
                          let payload: any = {
                            receiverId: receiverId, // ID của người nhận đúng
                            token: chattingService.getMessageToken(),
                            timestamp: new Date(),
                          }

                          // Xử lý payload theo loại tin nhắn
                          if (messageToShare.type === EMessageTypes.STICKER) {
                            // Tin nhắn sticker - sử dụng stickerUrl
                            payload = {
                              ...payload,
                              content: messageToShare.Sticker?.imageUrl || "",
                            }
                          } else if (messageToShare.type === EMessageTypes.TEXT) {
                            // Kiểm tra xem có phải tin nhắn emoji không
                            const hasEmojiImage =
                              messageToShare.content?.includes("<img") ||
                              messageToShare.content?.includes("emoji")

                            if (hasEmojiImage) {
                              // Tin nhắn emoji - chuyển thành TEXT với content HTML
                              payload = {
                                ...payload,
                                content: messageToShare.content || "",
                              }
                            } else {
                              // Tin nhắn text thường
                              payload = {
                                ...payload,
                                content: messageToShare.content || "",
                              }
                            }
                          } else {
                            // Các loại tin nhắn khác (IMAGE, VIDEO, AUDIO, DOCUMENT)
                            payload = {
                              ...payload,
                              content: messageToShare.content || "",
                              mediaUrl: messageToShare.Media?.url || "",
                              fileName: messageToShare.Media?.fileName || "",
                              fileType: messageToShare.Media?.type || "",
                            }
                          }

                          // Gửi tin nhắn sử dụng chattingService như trong codebase
                          chattingService.sendMessage(
                            converToMessageTypeAllTypes(
                              messageToShare.type,
                              messageToShare.Media?.type
                            ),
                            payload,
                            (res) => {
                              if (res && typeof res === "object" && Object.keys(res).length > 0) {
                                if ("success" in res && res.success) {
                                  chattingService.setAcknowledgmentFlag(true)
                                  chattingService.recursiveSendingQueueMessages()
                                  toast.success("Đã chia sẻ tin nhắn!")
                                } else if ("isError" in res && res.isError) {
                                  toast.error(res?.message || "Chia sẻ thất bại!")
                                }
                              } else {
                                // Trường hợp response rỗng hoặc không hợp lệ
                                toast.error("Không nhận được phản hồi từ server")
                              }
                            }
                          )
                        } catch (error) {
                          toast.error("Không thể lấy thông tin cuộc trò chuyện")
                        }
                      }

                      // Gọi callback nếu có
                      onSelectConversation?.(conversation)
                    } catch (error) {
                      toast.error("Không thể chia sẻ tin nhắn!")
                    }
                  }}
                >
                  <CustomAvatar
                    fallback={<DefaultAvatar size={40} />}
                    src={avatar?.src || undefined}
                    imgSize={40}
                    fallbackClassName="bg-regular-violet-cl text-2xl"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{title}</div>
                    {email && <div className="text-sm text-gray-400 truncate">{email}</div>}
                  </div>
                </button>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
