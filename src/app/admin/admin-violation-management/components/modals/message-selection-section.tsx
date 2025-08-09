import { useState, useEffect } from "react"
import { MessageSquare, Image, X, Check } from "lucide-react"
import { MessageTypeBadge } from "../badges"
import { santizeMsgContent } from "@/utils/helpers"
import { EMessageTypes, EMessageMediaTypes } from "@/utils/enums"
import type { TReportedMessageFE } from "@/utils/types/fe-api"

interface MessageSelectionModalProps {
  reportedMessages: TReportedMessageFE[]
  onSelectionChange: (selectedMessageIds: number[]) => void
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
}

export const MessageSelectionModal = ({
  reportedMessages,
  onSelectionChange,
  isOpen,
  onClose,
  onConfirm,
}: MessageSelectionModalProps) => {
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  // Update parent when selection changes
  useEffect(() => {
    onSelectionChange(Array.from(selectedMessages))
  }, [selectedMessages, onSelectionChange])

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMessages(new Set())
      setSelectAll(false)
    }
  }, [isOpen])

  // Handle select all toggle
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      const allMessageIds = reportedMessages.map((msg) => msg.messageId)
      setSelectedMessages(new Set(allMessageIds))
    } else {
      setSelectedMessages(new Set())
    }
  }

  // Handle individual message selection
  const handleMessageSelect = (messageId: number, checked: boolean) => {
    const newSelection = new Set(selectedMessages)
    if (checked) {
      newSelection.add(messageId)
    } else {
      newSelection.delete(messageId)
    }
    setSelectedMessages(newSelection)

    // Update select all state
    setSelectAll(newSelection.size === reportedMessages.length)
  }

  const renderMessageContent = (message: TReportedMessageFE) => {
    switch (message.messageType) {
      case EMessageTypes.TEXT:
        return (
          <div className="bg-regular-hover-card-cl p-3 rounded-lg">
            <div
              className="text-regular-white-cl text-xs whitespace-pre-wrap break-words [&_.STYLE-emoji-img]:w-3 [&_.STYLE-emoji-img]:h-3 [&_.STYLE-emoji-img]:inline-block [&_.STYLE-emoji-img]:align-text-bottom"
              dangerouslySetInnerHTML={{ __html: santizeMsgContent(message.messageContent) }}
            />
          </div>
        )
      case EMessageMediaTypes.IMAGE:
        return (
          <div className="bg-regular-hover-card-cl p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Image className="h-4 w-4 text-regular-violet-cl" />
              <span className="text-regular-text-secondary-cl text-sm">Image</span>
            </div>
            <img
              src={message.messageContent}
              alt="Reported image"
              className="max-w-full h-auto rounded-lg max-h-32 object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          </div>
        )
      case EMessageMediaTypes.VIDEO:
        return (
          <div className="bg-regular-hover-card-cl p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-regular-text-secondary-cl text-sm">Video</span>
            </div>
            <video
              src={message.messageContent}
              controls
              className="max-w-full h-auto rounded-lg max-h-32"
            />
          </div>
        )
      case EMessageMediaTypes.AUDIO:
        return (
          <div className="bg-regular-hover-card-cl p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-regular-text-secondary-cl text-sm">Audio</span>
            </div>
            <audio src={message.messageContent} controls className="w-full" />
          </div>
        )
      case EMessageMediaTypes.DOCUMENT:
        return (
          <div className="bg-regular-hover-card-cl p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-regular-text-secondary-cl text-sm">Document</span>
            </div>
            <a
              href={message.messageContent}
              target="_blank"
              rel="noopener noreferrer"
              className="text-regular-violet-cl hover:text-regular-tooltip-bgcl underline"
            >
              View Document
            </a>
          </div>
        )
      default:
        return (
          <div className="bg-regular-hover-card-cl p-3 rounded-lg">
            <p className="text-regular-white-cl">{message.messageContent}</p>
          </div>
        )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-regular-dark-gray-cl rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] min-h-[60vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-regular-black-cl">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-regular-violet-cl" />
            <div>
              <h3 className="text-lg font-semibold text-regular-white-cl">
                Select Messages to Delete
              </h3>
              <p className="text-sm text-regular-text-secondary-cl">
                {reportedMessages.length} messages available • {selectedMessages.size} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-regular-black-cl rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-regular-text-secondary-cl" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6 min-h-0">
          {reportedMessages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-regular-text-secondary-cl">No messages to select</p>
            </div>
          ) : (
            <>
              {/* Select All Option */}
              <div className="mb-4 p-4 bg-regular-black-cl rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-5 h-5 text-regular-violet-cl bg-regular-black-cl border-regular-violet-cl rounded focus:ring-regular-violet-cl focus:ring-2"
                  />
                  <span className="text-regular-white-cl font-medium">Select All Messages</span>
                  {selectAll && <Check className="h-4 w-4 text-regular-violet-cl" />}
                </label>
              </div>

              {/* Messages List */}
              <div className="space-y-3 max-h-80 overflow-y-auto STYLE-styled-modal-scrollbar">
                {reportedMessages.map((message: TReportedMessageFE, index: number) => (
                  <div
                    key={message.messageId}
                    className="bg-regular-black-cl p-4 rounded-lg border border-regular-hover-card-cl"
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedMessages.has(message.messageId)}
                        onChange={(e) => handleMessageSelect(message.messageId, e.target.checked)}
                        className="mt-1 w-5 h-5 text-regular-violet-cl bg-regular-black-cl border-regular-violet-cl rounded focus:ring-regular-violet-cl focus:ring-2"
                      />

                      {/* Message Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-regular-text-secondary-cl text-sm font-medium">
                            #{index + 1}
                          </span>
                          <MessageTypeBadge type={message.messageType} />
                          <span className="text-regular-text-secondary-cl text-sm">
                            from{" "}
                            <span className="text-regular-white-cl font-medium">
                              {message.senderName}
                            </span>
                          </span>
                        </div>
                        {renderMessageContent(message)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-regular-black-cl">
          <div className="text-sm text-regular-text-secondary-cl">
            {selectedMessages.size > 0 ? (
              <span className="text-regular-violet-cl font-medium">
                {selectedMessages.size} message{selectedMessages.size > 1 ? "s" : ""} selected
              </span>
            ) : (
              "No messages selected"
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectedMessages(new Set())
                setSelectAll(false)
                onClose()
              }}
              className="px-4 py-2 text-regular-text-secondary-cl hover:text-regular-white-cl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (onConfirm) {
                  onConfirm()
                }
                onClose()
              }}
              className="px-4 py-2 bg-regular-violet-cl hover:bg-regular-violet-cl/80 text-regular-white-cl rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedMessages.size === 0}
            >
              Confirm Selection ({selectedMessages.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
