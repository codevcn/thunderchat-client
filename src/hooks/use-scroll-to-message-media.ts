import { useCallback } from "react"
import { useAppDispatch } from "./redux"
import { fetchDirectMessagesThunk } from "@/redux/messages/messages.thunk"
import { EPaginations, ESortTypes } from "@/utils/enums"
import { toast } from "sonner"
import axiosErrorHandler from "@/utils/axios-error-handler"

interface UseScrollToMessageMediaProps {
  directChatId: number
  messages: any[]
  hasMoreMessages: React.MutableRefObject<boolean>
  msgOffset: React.MutableRefObject<number>
  setLoading: (loading: "loading-messages" | undefined) => void
  messagesContainer: React.RefObject<HTMLDivElement | null>
}

export const useScrollToMessage = ({
  directChatId,
  messages,
  hasMoreMessages,
  msgOffset,
  setLoading,
  messagesContainer,
}: UseScrollToMessageMediaProps) => {
  const dispatch = useAppDispatch()

  // Hàm fetch messages đặc biệt cho scroll to message media
  const fetchMessagesForScrollToMessageMedia = useCallback(
    async (targetMessageId: number) => {
      const msgsContainerEle = messagesContainer.current
      if (!msgsContainerEle) return

      // Kiểm tra xem target message có quá cũ không
      const oldestMessageId = messages?.[0]?.id || 0
      const newestMessageId = messages?.[messages.length - 1]?.id || 0

      // Nếu target message quá cũ (cách xa hơn 1000 tin nhắn), không nên fetch
      if (targetMessageId < oldestMessageId - 1000) {
        toast.error("Tin nhắn này quá cũ, không thể cuộn đến. Vui lòng tải thêm tin nhắn cũ trước.")
        return
      }

      setLoading("loading-messages")

      try {
        // Fetch messages cho đến khi tìm thấy target message hoặc hết messages
        let found = false
        let attempts = 0
        const maxAttempts = 5
        let totalFetched = 0

        while (!found && attempts < maxAttempts && hasMoreMessages.current) {
          const result = await dispatch(
            fetchDirectMessagesThunk({
              directChatId,
              msgOffset: msgOffset.current,
              limit: EPaginations.DIRECT_MESSAGES_PAGE_SIZE,
              sortType: ESortTypes.ASC,
              isFirstTime: false,
            })
          ).unwrap()

          if (result) {
            hasMoreMessages.current = result.hasMoreMessages
            totalFetched += EPaginations.DIRECT_MESSAGES_PAGE_SIZE

            // Kiểm tra xem target message đã được tải chưa
            found = messages?.some((msg) => msg.id === targetMessageId) || false
          }

          attempts++
        }
      } catch (error) {
        toast.error(axiosErrorHandler.handleHttpError(error).message)
      } finally {
        setLoading(undefined)
      }
    },
    [directChatId, messages, hasMoreMessages, msgOffset, setLoading, dispatch]
  )

  // Hàm highlight message riêng biệt cho media
  const highlightMessageMedia = useCallback((messageElement: HTMLElement) => {
    messageElement.style.backgroundColor = "rgba(139, 92, 246, 0.2)"
    messageElement.style.borderRadius = "8px"
    messageElement.style.transition = "background-color 0.3s ease"

    setTimeout(() => {
      messageElement.style.backgroundColor = ""
      messageElement.style.borderRadius = ""
    }, 2000)
  }, [])

  // Cuộn đến message cụ thể theo ID với animation mượt (dành cho media)
  const handleScrollToMessage = useCallback(
    async (messageId: number) => {
      const msgsContainerEle = messagesContainer.current
      if (!msgsContainerEle) return

      // Tìm message element theo ID
      let messageElement = msgsContainerEle.querySelector(
        `[data-msg-id="${messageId}"]`
      ) as HTMLElement

      // Nếu không tìm thấy message, có thể chưa được tải
      if (!messageElement) {
        // Kiểm tra xem messageId có trong danh sách messages hiện tại không
        const messageExists = messages?.some((msg) => msg.id === messageId)

        if (!messageExists && hasMoreMessages.current) {
          // Message chưa được tải, cần fetch thêm
          await fetchMessagesForScrollToMessageMedia(messageId)

          // Đợi một chút để messages được render
          await new Promise((resolve) => setTimeout(resolve, 100))

          // Tìm lại message element sau khi đã tải
          messageElement = msgsContainerEle.querySelector(
            `[data-msg-id="${messageId}"]`
          ) as HTMLElement

          // Nếu vẫn không tìm thấy sau khi fetch, có thể message quá cũ
          if (!messageElement) {
            return
          }
        } else if (!messageExists && !hasMoreMessages.current) {
          // Không còn tin nhắn để tải và message không tồn tại
          toast.error("Tin nhắn này không tồn tại hoặc đã bị xóa.")
          return
        }
      }

      if (messageElement) {
        // Tính toán vị trí đích
        const containerHeight = msgsContainerEle.clientHeight
        const messageTop = messageElement.offsetTop
        const messageHeight = messageElement.offsetHeight
        const targetScrollTop = messageTop - containerHeight / 2 + messageHeight / 2

        // Vị trí hiện tại
        const startScrollTop = msgsContainerEle.scrollTop
        const distance = targetScrollTop - startScrollTop

        // Nếu khoảng cách quá nhỏ, không cần cuộn
        if (Math.abs(distance) < 10) {
          highlightMessageMedia(messageElement)
          return
        }

        // Nếu khoảng cách lớn (>500px), cuộn nhanh trước, sau đó mượt
        if (Math.abs(distance) > 500) {
          // Cuộn nhanh đến gần vị trí đích
          msgsContainerEle.scrollTo({
            top: targetScrollTop - (distance > 0 ? 100 : -100),
            behavior: "instant",
          })

          // Đợi render xong, sau đó cuộn mượt đến vị trí chính xác
          requestAnimationFrame(() => {
            const remainingDistance = targetScrollTop - msgsContainerEle.scrollTop

            if (Math.abs(remainingDistance) > 10) {
              msgsContainerEle.scrollTo({
                top: targetScrollTop,
                behavior: "smooth",
              })
            }

            // Highlight sau khi hoàn thành
            setTimeout(() => highlightMessageMedia(messageElement), 300)
          })

          return
        }

        // Khoảng cách vừa phải, cuộn mượt trực tiếp
        msgsContainerEle.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        })

        // Highlight sau khi hoàn thành
        setTimeout(() => highlightMessageMedia(messageElement), 500)
      }
    },
    [messages, hasMoreMessages, fetchMessagesForScrollToMessageMedia, highlightMessageMedia]
  )

  return {
    handleScrollToMessage,
    highlightMessageMedia,
  }
}
