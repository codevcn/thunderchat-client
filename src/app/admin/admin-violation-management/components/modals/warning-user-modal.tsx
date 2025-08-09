import { useState } from "react"
import { MessageSquare } from "lucide-react"
import { MessageSelectionModal } from "./message-selection-section"
import type { TReportedMessageFE } from "@/utils/types/fe-api"

interface WarningUserModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, messageIds?: number[]) => void
  reportedUserName: string
  reportedMessages?: TReportedMessageFE[] // Messages to select from
}

export const WarningUserModal = ({
  isOpen,
  onClose,
  onConfirm,
  reportedUserName,
  reportedMessages = [],
}: WarningUserModalProps) => {
  const [reason, setReason] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMessageIds, setSelectedMessageIds] = useState<number[]>([])
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)

  const handleConfirm = async () => {
    if (!reason.trim()) return

    setIsLoading(true)
    try {
      await onConfirm(reason.trim(), selectedMessageIds)
      onClose()
    } catch (error) {
      console.error("Error warning user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-regular-dark-gray-cl rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-regular-white-cl mb-4">Warning User</h3>

        <div className="space-y-4">
          {/* User Info */}
          <div>
            <p className="text-regular-text-secondary-cl text-sm mb-1">User to warn:</p>
            <p className="text-regular-white-cl font-medium">{reportedUserName}</p>
          </div>

          {/* Message Selection */}
          {reportedMessages.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-regular-text-secondary-cl text-sm">Select Messages to Delete:</p>
                <button
                  type="button"
                  onClick={() => setIsMessageModalOpen(true)}
                  className="px-3 py-1.5 bg-regular-violet-cl hover:bg-regular-violet-cl/80 text-regular-white-cl text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Select Messages ({selectedMessageIds.length})
                </button>
              </div>
              {selectedMessageIds.length > 0 && (
                <p className="text-regular-text-secondary-cl text-xs">
                  {selectedMessageIds.length} message{selectedMessageIds.length > 1 ? "s" : ""}{" "}
                  selected for deletion
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <p className="text-regular-text-secondary-cl text-sm mb-2">Reason:</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for warning this user..."
              className="w-full bg-regular-black-cl border border-regular-hover-card-cl rounded-lg px-3 py-2 text-regular-white-cl focus:border-regular-violet-cl focus:outline-none resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-regular-text-secondary-cl hover:text-regular-white-cl disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !reason.trim()}
            className="px-4 py-2 bg-yellow-500 text-regular-white-cl rounded-lg hover:bg-yellow-600 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            Warning User
          </button>
        </div>
      </div>

      {/* Message Selection Modal */}
      <MessageSelectionModal
        reportedMessages={reportedMessages}
        onSelectionChange={setSelectedMessageIds}
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        onConfirm={() => {
          // Selection is already updated via onSelectionChange
          // Just close the modal
        }}
      />
    </div>
  )
}
