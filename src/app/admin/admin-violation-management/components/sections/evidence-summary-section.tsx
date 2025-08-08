import { MessageSquare, Image, ChevronDown, ChevronUp } from "lucide-react"
import { MessageTypeBadge } from "../badges"
import { santizeMsgContent } from "@/utils/helpers"
import { EMessageTypes, EMessageMediaTypes } from "@/utils/enums"
import type { TReportedMessageFE } from "@/utils/types/fe-api"
import type { TAdminViolationReport, TAdminViolationReportDetail } from "@/utils/types/be-api"

interface EvidenceSummarySectionProps {
  violation: TAdminViolationReport
  detailedReport: TAdminViolationReportDetail | null
  detailLoading: boolean
  expandedMessages: boolean
  expandedImages: boolean
  onToggleMessages: () => void
  onToggleImages: () => void
  onImageClick: (index: number) => void
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
            className="max-w-full h-auto rounded-lg max-h-48 object-cover"
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
            className="max-w-full h-auto rounded-lg max-h-48"
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

export const EvidenceSummarySection = ({
  violation,
  detailedReport,
  detailLoading,
  expandedMessages,
  expandedImages,
  onToggleMessages,
  onToggleImages,
  onImageClick,
}: EvidenceSummarySectionProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-regular-white-cl mb-4">Evidence Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Messages Column */}
        <div className="bg-regular-hover-card-cl rounded-lg overflow-hidden">
          <button
            onClick={onToggleMessages}
            className="w-full p-4 text-center hover:bg-regular-black-cl transition-colors"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <MessageSquare className="h-8 w-8 text-regular-violet-cl" />
              <span className="text-regular-white-cl font-medium">
                {violation.evidenceCount.messages}
              </span>
              <span className="text-regular-text-secondary-cl text-sm">Messages</span>
              {expandedMessages ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </button>

          {/* Expanded Messages Content */}
          {expandedMessages && (
            <div className="border-t border-regular-black-cl p-4">
              {detailLoading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-regular-violet-cl mx-auto"></div>
                  <p className="text-regular-text-secondary-cl text-sm mt-2">Loading messages...</p>
                </div>
              ) : detailedReport?.reportedMessages && detailedReport.reportedMessages.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto STYLE-styled-modal-scrollbar">
                  {detailedReport.reportedMessages.map(
                    (message: TReportedMessageFE, index: number) => (
                      <div key={message.messageId} className="bg-regular-black-cl p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-regular-text-secondary-cl text-xs">
                              #{index + 1}
                            </span>
                            <MessageTypeBadge type={message.messageType} />
                            <span className="text-regular-text-secondary-cl text-xs">
                              from {message.senderName}
                            </span>
                          </div>
                        </div>
                        {renderMessageContent(message)}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-regular-text-secondary-cl text-sm">No messages reported</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Images Column */}
        <div className="bg-regular-hover-card-cl rounded-lg overflow-hidden">
          <button
            onClick={onToggleImages}
            className="w-full p-4 text-center hover:bg-regular-black-cl transition-colors"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Image className="h-8 w-8 text-regular-violet-cl" />
              <span className="text-regular-white-cl font-medium">
                {violation.evidenceCount.images}
              </span>
              <span className="text-regular-text-secondary-cl text-sm">Images</span>
              {expandedImages ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </button>

          {/* Expanded Images Content */}
          {expandedImages && (
            <div className="border-t border-regular-black-cl p-4">
              {detailLoading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-regular-violet-cl mx-auto"></div>
                  <p className="text-regular-text-secondary-cl text-sm mt-2">Loading images...</p>
                </div>
              ) : detailedReport?.reportImages && detailedReport.reportImages.length > 0 ? (
                <div className="grid grid-cols-5 gap-2">
                  {detailedReport.reportImages.slice(0, 5).map((image, index: number) => (
                    <div
                      key={image.id}
                      className="aspect-square rounded-lg overflow-hidden bg-regular-black-cl cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => onImageClick(index)}
                    >
                      <img
                        src={image.imageUrl}
                        alt={`Report image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-regular-text-secondary-cl text-sm">No images reported</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
