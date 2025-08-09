import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { X, ChevronLeft } from "lucide-react"
import { IconButton } from "@/components/materials/icon-button"
import { SelectMessageContent } from "@/components/chatbox/user-report/select-message-content"
import type { TStateMessage } from "@/utils/types/global"

type TSelectMessageModalProps = {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  selectedMessages: number
  onMessagesChange: (count: number) => void
  asOverlay?: boolean
  matchReportSize?: boolean
  // New props to persist selected messages
  initialMessages?: TStateMessage[]
  onMessagesUpdate?: (messages: TStateMessage[]) => void
  // New props for conversation data
  conversationId?: number
  conversationType?: "direct" | "group"
  // New prop to check if message is already selected
  isMessageSelected?: (messageId: number) => boolean
}

const MAX_MESSAGES = 10

export const SelectMessageModal = ({
  isOpen,
  onClose,
  onBack,
  selectedMessages,
  onMessagesChange,
  asOverlay = true,
  matchReportSize = false,
  initialMessages,
  onMessagesUpdate,
  conversationId,
  conversationType = "direct",
  isMessageSelected,
}: TSelectMessageModalProps) => {
  const [messages, setMessages] = useState<TStateMessage[]>([])
  const [isClosing, setIsClosing] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [shouldLoadContent, setShouldLoadContent] = useState(false)
  const closeTimeoutRef = useRef<number | null>(null)
  const initializedRef = useRef(false)

  // Handle opening animation and delay content loading
  useEffect(() => {
    if (isOpen && !isOpening) {
      setIsOpening(true)
      // Load content immediately for testing
      setShouldLoadContent(true)

      // Uncomment below for animation delay if needed
      const timer = setTimeout(() => {
        setShouldLoadContent(true)
      }, 500)
      return () => clearTimeout(timer)
    } else if (!isOpen) {
      setShouldLoadContent(false)
    }
  }, [isOpen, isOpening])

  // cleanup timeout
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, []) // Empty dependency array - only run on unmount

  // Initialize messages from props when modal opens
  useEffect(() => {
    if (isOpen && initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages)
      onMessagesChange(initialMessages.length)
    }
  }, [isOpen, initialMessages, onMessagesChange])

  const handleContinue = useCallback(() => {
    handleBack()
  }, [])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    closeTimeoutRef.current = window.setTimeout(() => {
      onClose() // Gọi onClose của ReportModal để thoát hoàn toàn
      setIsClosing(false)
    }, 500)
  }, [onClose])

  const handleBack = useCallback(() => {
    setIsClosing(true)
    closeTimeoutRef.current = window.setTimeout(() => {
      onBack()
      setIsClosing(false)
    }, 500)
  }, [onBack])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose()
      }
    },
    [handleClose]
  )

  const handleToggleDetails = useCallback(() => {
    setShowDetails(!showDetails)
  }, [showDetails])

  const handleOverlayClick = useCallback(() => {
    setShowDetails(false)
  }, [])

  const handleSelectedMessagesChange = useCallback(
    (selectedMessages: TStateMessage[]) => {
      setMessages(selectedMessages)
      onMessagesChange(selectedMessages.length)
      // Luôn gọi onMessagesUpdate để cập nhật session
      if (onMessagesUpdate) {
        onMessagesUpdate(selectedMessages)
      }
    },
    [onMessagesChange, onMessagesUpdate]
  )

  const handleCancelSelection = useCallback(() => {
    setMessages([])
    onMessagesChange(0)
    // Gọi onMessagesUpdate với empty array để xóa session
    if (onMessagesUpdate) {
      onMessagesUpdate([])
    }
  }, [onMessagesChange, onMessagesUpdate])

  if (!isOpen && !isClosing) return null

  const innerContent = (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between p-4 border-b border-regular-hover-card-cl flex-shrink-0">
        <IconButton
          aria-label="Back"
          className="text-regular-white-cl hover:text-regular-text-secondary-cl"
          onClick={handleBack}
        >
          <ChevronLeft size={20} />
        </IconButton>
        <h2 className="text-regular-white-cl text-base font-medium">Select Messages</h2>
        <IconButton
          aria-label="Close"
          className="text-regular-white-cl hover:text-regular-text-secondary-cl"
          onClick={handleClose}
        >
          <X size={20} />
        </IconButton>
      </div>

      {/* Information Banner - Fixed */}
      <div className="bg-regular-dark-gray-cl p-4 border-b border-regular-hover-card-cl flex-shrink-0 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">!</span>
            </div>
            <span className="text-regular-white-cl text-sm">
              You can attach messages from the other person in this conversation.
            </span>
          </div>
          <button
            onClick={handleToggleDetails}
            className="text-regular-violet-cl hover:text-regular-tooltip-bgcl text-sm underline cursor-pointer"
          >
            {showDetails ? "Collapse" : "Details"}
          </button>
        </div>

        {/* Expandable Details - Dropdown Overlay */}
        {showDetails && (
          <div className="absolute top-full left-0 right-0 bg-regular-dark-gray-cl border border-regular-hover-card-cl rounded-b-lg shadow-lg z-20 mt-1">
            <div className="p-4">
              <p className="text-regular-white-cl text-sm mb-3">
                You can attach messages from the other person, including:
              </p>
              <ul className="space-y-2 text-regular-white-cl text-sm">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Text messages</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Images and videos</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Voice messages</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Documents and files</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-hidden relative">
        {/* Overlay mờ chỉ phủ phần content khi showDetails = true */}
        {showDetails && (
          <div
            className="absolute inset-0 bg-black bg-opacity-50 z-10"
            onClick={handleOverlayClick}
          />
        )}

        {(() => {
          if (shouldLoadContent && conversationId) {
            return (
              <SelectMessageContent
                conversationId={conversationId}
                conversationType={conversationType}
                selectedMessages={messages}
                onSelectedMessagesChange={handleSelectedMessagesChange}
                maxMessages={MAX_MESSAGES}
                isMessageSelected={isMessageSelected}
              />
            )
          } else {
            return (
              <div className="flex items-center justify-center h-full">
                <div className="text-regular-white-cl">
                  Loading messages... (shouldLoadContent: {String(shouldLoadContent)},
                  conversationId: {conversationId})
                </div>
              </div>
            )
          }
        })()}
      </div>

      {/* Bottom Selection Bar - Fixed */}
      <div className="p-4 border-t border-regular-hover-card-cl flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-regular-white-cl text-sm">
            Selected: {messages.length}/{MAX_MESSAGES}
          </span>
          {messages.length > 0 && (
            <button
              onClick={handleCancelSelection}
              className="text-regular-violet-cl hover:text-regular-tooltip-bgcl text-sm underline"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={messages.length === 0}
          className={`w-full py-3 px-4 rounded-lg font-medium text-base transition-colors ${
            messages.length === 0
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-regular-violet-cl text-regular-white-cl hover:bg-regular-tooltip-bgcl"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  )

  // embedded (như trước)
  return (
    <div
      className={`absolute inset-0 bg-regular-black-cl rounded-lg transition-all duration-400 ease-out ${
        isOpen && isOpening && !isClosing ? "translate-x-0" : "translate-x-full"
      }`}
      style={{
        minHeight: "100%",
        transform: isOpen && isOpening && !isClosing ? "translateX(0)" : "translateX(100%)",
        transition: "transform 400ms ease-out",
      }}
    >
      {innerContent}
    </div>
  )
}
