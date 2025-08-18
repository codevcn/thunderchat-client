import React, { useEffect, useState, useMemo } from "react"
import { CustomAvatar, DefaultAvatar } from "@/components/materials"
import { useAppSelector } from "@/hooks/redux"
import { sortDirectChatsByPinned } from "@/redux/conversations/conversations.selectors"
import { useUser } from "@/hooks/user"
import { searchConversations } from "@/services/search.service"
import { directChatService } from "@/services/direct-chat.service"
import { groupChatService } from "@/services/group-chat.service"
import { chattingService } from "@/services/chatting.service"
import { toast } from "sonner"
import type {
  TStateMessage,
  TConversationSearchResult,
  TConversationCard,
} from "@/utils/types/global"
import { EChatType, EMessageTypes } from "@/utils/enums"
import { converToMessageTypeAllTypes } from "@/utils/helpers"
import { TChattingPayload, TChattingPayloadForGroup } from "@/utils/types/socket"

interface ShareMessageModalProps {
  open: boolean
  onClose: () => void
  messageToShare?: TStateMessage
}

const CONVERSATIONS_LIMIT = 10

export const ShareMessageModal: React.FC<ShareMessageModalProps> = ({
  open,
  onClose,
  messageToShare,
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
      return searchResults.slice(0, CONVERSATIONS_LIMIT)
    }
    return []
  }, [search, searchResults])

  const conversationsFromRedux = useMemo(() => {
    if (search.trim() === "" && allConversations) {
      return allConversations.slice(0, CONVERSATIONS_LIMIT)
    }
    return []
  }, [allConversations, search])

  const shareToConversation = async (type: EChatType, conversationId: number) => {
    if (!messageToShare) {
      toast.error("No message to share!")
      return
    }

    try {
      // Close modal
      onClose()

      if (type === EChatType.DIRECT) {
        // Xử lý direct chat
        try {
          // Lấy thông tin đầy đủ về direct chat để có recipientId và creatorId
          const directChatData = await directChatService.fetchDirectChat(conversationId)

          // Xác định receiverId dựa trên user hiện tại
          const receiverId =
            user?.id === directChatData.recipientId
              ? directChatData.creatorId
              : directChatData.recipientId

          // Tạo payload theo đúng cấu trúc TChattingPayload["msgPayload"]
          let payload: TChattingPayload["msgPayload"] = {
            receiverId: receiverId, // ID của người nhận đúng
            token: chattingService.getMessageToken(),
            timestamp: new Date(),
            content: "",
          }

          // Xử lý payload theo loại tin nhắn
          if (messageToShare.type === EMessageTypes.STICKER) {
            // Tin nhắn sticker - sử dụng stickerUrl
            payload = {
              ...payload,
              content: `${messageToShare.Sticker?.id || ""}`,
            }
          } else if (messageToShare.type === EMessageTypes.TEXT) {
            payload = {
              ...payload,
              content: messageToShare.content,
            }
          } else if (messageToShare.type !== EMessageTypes.PIN_NOTICE) {
            // Các loại tin nhắn khác (IMAGE, VIDEO, AUDIO, DOCUMENT)
            payload = {
              ...payload,
              content: `${messageToShare.Media?.id || ""}`,
            }
          }

          // Gửi tin nhắn sử dụng chattingService như trong codebase
          chattingService.sendMessage(
            converToMessageTypeAllTypes(messageToShare.type, messageToShare.Media?.type),
            payload,
            (res) => {
              if (res && typeof res === "object" && Object.keys(res).length > 0) {
                if ("success" in res && res.success) {
                  chattingService.recursiveSendingQueueMessages()
                  toast.success("Message shared successfully!")
                } else if ("isError" in res && res.isError) {
                  toast.error(res?.message || "Share failed!")
                }
              } else {
                // Case of empty or invalid response
                toast.error("No response received from server")
              }
            }
          )
        } catch (error) {
          toast.error("Unable to get conversation information")
        }
      } else if (type === EChatType.GROUP) {
        // Xử lý group chat
        try {
          // Tạo payload theo đúng cấu trúc TChattingPayloadForGroup["msgPayload"]
          let payload: TChattingPayloadForGroup["msgPayload"] = {
            groupChatId: conversationId,
            token: chattingService.getMessageToken(),
            timestamp: new Date(),
            content: "",
          }

          // Xử lý payload theo loại tin nhắn
          if (messageToShare.type === EMessageTypes.STICKER) {
            // Tin nhắn sticker - sử dụng stickerUrl
            payload = {
              ...payload,
              content: `${messageToShare.Sticker?.id || ""}`,
            }
          } else if (messageToShare.type === EMessageTypes.TEXT) {
            payload = {
              ...payload,
              content: messageToShare.content,
            }
          } else if (messageToShare.type !== EMessageTypes.PIN_NOTICE) {
            // Các loại tin nhắn khác (IMAGE, VIDEO, AUDIO, DOCUMENT)
            payload = {
              ...payload,
              content: `${messageToShare.Media?.id || ""}`,
            }
          }

          // Gửi tin nhắn sử dụng chattingService.sendGroupMessage
          chattingService.sendGroupMessage(
            converToMessageTypeAllTypes(messageToShare.type, messageToShare.Media?.type),
            payload,
            (res) => {
              if (res && typeof res === "object" && Object.keys(res).length > 0) {
                if ("success" in res && res.success) {
                  chattingService.recursiveSendingQueueMessages()
                  toast.success("Message shared successfully!")
                } else if ("isError" in res && res.isError) {
                  toast.error(res?.message || "Share failed!")
                }
              } else {
                // Case of empty or invalid response
                toast.error("No response received from server")
              }
            }
          )
        } catch (error) {
          toast.error("Unable to get group chat information")
        }
      }
    } catch (error) {
      toast.error("Unable to share message!")
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[9998]" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2 bg-[#18181c] rounded-xl shadow-lg w-full max-w-md p-6 border border-[#23232a]">
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
        <h2 className="text-lg font-bold text-white mb-4">Share message to conversation</h2>
        {/* Search input */}
        <input
          type="text"
          className="w-full p-2 mb-4 rounded bg-[#23232a] text-white placeholder-gray-400 outline-none"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {/* Danh sách conversations */}
        <div className="max-h-72 overflow-y-auto space-y-2 STYLE-styled-scrollbar pr-1">
          {isSearching ? (
            <div className="text-gray-400 text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
              Searching...
            </div>
          ) : searchResultsFiltered.length === 0 && conversationsFromRedux.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              {search.trim() !== "" ? "No conversations found." : "No conversations available."}
            </div>
          ) : (
            <>
              {/* Hiển thị search results */}
              {searchResultsFiltered.map((conversation) => {
                const { id, avatar = null, title = "", type, email } = conversation
                return (
                  <button
                    key={`search-${type}-${id}`}
                    className="flex items-center w-full gap-3 p-2 rounded-lg bg-[#23232a] hover:bg-[#35363a] transition-colors text-left"
                    onClick={() => shareToConversation(conversation.type, conversation.id)}
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

              {/* Display conversations from Redux */}
              {conversationsFromRedux.map((conversation) => {
                const { id, avatar = null, title = "", type, email } = conversation
                return (
                  <button
                    key={`redux-${type}-${id}`}
                    className="flex items-center w-full gap-3 p-2 rounded-lg bg-[#23232a] hover:bg-[#35363a] transition-colors text-left"
                    onClick={() => shareToConversation(conversation.type, conversation.id)}
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
    </>
  )
}
