"use client"

import {
  XCircle,
  FileText,
  BarChart3,
  CheckCircle,
  XCircle as XCircleIcon,
  Ban,
  MessageSquare,
  Image,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
} from "lucide-react"
import { useState, useEffect } from "react"
import type {
  TAdminViolationReport,
  TViolationReportStatus,
  TViolationReportCategory,
} from "@/utils/types/be-api"
import { EViolationReportStatus, EBanType } from "@/utils/enums"
import { useViolationReportDetail } from "@/hooks/use-admin-violation-reports"
import { toast } from "sonner"
import { UserReportHistoryModal } from "./user-history-violation-model"
import MediaViewerModal from "@/components/chatbox/media-viewer-modal"
import type { TUserWithProfile } from "@/utils/types/be-api"

// Status Badge Component
const StatusBadge = ({ status }: { status: TViolationReportStatus }) => {
  const statusConfig = {
    [EViolationReportStatus.PENDING]: {
      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      icon: "⏰",
    },
    [EViolationReportStatus.RESOLVED]: {
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      icon: "✅",
    },
    [EViolationReportStatus.DISMISSED]: {
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      icon: "❌",
    },
  }

  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${config.color}`}
    >
      <span>{config.icon}</span>
      {status}
    </span>
  )
}

// Category Badge Component
const CategoryBadge = ({ category }: { category: TViolationReportCategory }) => {
  const categoryConfig = {
    SENSITIVE_CONTENT: { color: "bg-red-500/20 text-red-400", label: "Sensitive Content" },
    BOTHER: { color: "bg-yellow-500/20 text-yellow-400", label: "Harassment" },
    FRAUD: { color: "bg-orange-500/20 text-orange-400", label: "Fraud" },
    OTHER: { color: "bg-gray-500/20 text-gray-400", label: "Other" },
  }

  const config = categoryConfig[category]

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
      {config.label}
    </span>
  )
}

// Message Type Badge Component
const MessageTypeBadge = ({ type }: { type: string }) => {
  const typeConfig = {
    TEXT: { color: "bg-blue-500/20 text-blue-400", label: "Text" },
    IMAGE: { color: "bg-green-500/20 text-green-400", label: "Image" },
    VIDEO: { color: "bg-purple-500/20 text-purple-400", label: "Video" },
    AUDIO: { color: "bg-orange-500/20 text-orange-400", label: "Audio" },
    DOCUMENT: { color: "bg-gray-500/20 text-gray-400", label: "Document" },
    STICKER: { color: "bg-pink-500/20 text-pink-400", label: "Sticker" },
  }

  const config = typeConfig[type as keyof typeof typeConfig] || {
    color: "bg-gray-500/20 text-gray-400",
    label: type,
  }

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
      {config.label}
    </span>
  )
}

// Confirmation Modal Component
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText = "Cancel",
  isLoading = false,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText: string
  cancelText?: string
  isLoading?: boolean
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-regular-dark-gray-cl rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-regular-white-cl mb-2">{title}</h3>
        <p className="text-regular-text-secondary-cl mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-regular-text-secondary-cl hover:text-regular-white-cl disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-500 text-regular-white-cl rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Ban User Modal Component
const BanUserModal = ({
  isOpen,
  onClose,
  onConfirm,
  reportedUserName,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: (banType: EBanType, reason: string, banDuration?: number) => void
  reportedUserName: string
}) => {
  const [banType, setBanType] = useState<EBanType>(EBanType.TEMPORARY_BAN)
  const [banDuration, setBanDuration] = useState<number>(7)
  const [useCustomDate, setUseCustomDate] = useState<boolean>(false)
  const [customBanUntil, setCustomBanUntil] = useState<string>("")
  const [reason, setReason] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const durationOptions = [
    { value: 7, label: "7 days" },
    { value: 30, label: "1 month" },
    { value: 90, label: "3 months" },
    { value: 180, label: "6 months" },
    { value: 365, label: "1 year" },
  ]

  // Set default custom date to 7 days from now
  const getDefaultCustomDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
  }

  // Initialize custom date when modal opens
  useEffect(() => {
    if (isOpen && !customBanUntil) {
      setCustomBanUntil(getDefaultCustomDate())
    }
  }, [isOpen])

  const handleConfirm = async () => {
    if (!reason.trim()) return

    setIsLoading(true)
    try {
      let finalBanDuration: number | undefined

      if (banType === EBanType.TEMPORARY_BAN) {
        if (useCustomDate) {
          // Calculate duration in days from custom date
          const customDate = new Date(customBanUntil)
          const now = new Date()
          const diffTime = customDate.getTime() - now.getTime()
          finalBanDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) // Convert to days
        } else {
          finalBanDuration = banDuration
        }
      }

      await onConfirm(banType, reason.trim(), finalBanDuration)
      onClose()
    } catch (error) {
      console.error("Error banning user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-regular-dark-gray-cl rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-regular-white-cl mb-4">Ban User</h3>

        <div className="space-y-4">
          {/* User Info */}
          <div>
            <p className="text-regular-text-secondary-cl text-sm mb-1">User to ban:</p>
            <p className="text-regular-white-cl font-medium">{reportedUserName}</p>
          </div>

          {/* Ban Type */}
          <div>
            <p className="text-regular-text-secondary-cl text-sm mb-2">Ban Type:</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={EBanType.TEMPORARY_BAN}
                  checked={banType === EBanType.TEMPORARY_BAN}
                  onChange={(e) => setBanType(e.target.value as EBanType)}
                  className="text-regular-violet-cl bg-regular-black-cl border-regular-violet-cl rounded focus:ring-regular-violet-cl focus:ring-2"
                />
                <span className="text-regular-white-cl">Temporary Ban</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={EBanType.PERMANENT_BAN}
                  checked={banType === EBanType.PERMANENT_BAN}
                  onChange={(e) => setBanType(e.target.value as EBanType)}
                  className="text-regular-violet-cl bg-regular-black-cl border-regular-violet-cl rounded focus:ring-regular-violet-cl focus:ring-2"
                />
                <span className="text-regular-white-cl">Permanent Ban</span>
              </label>
            </div>
          </div>

          {/* Ban Duration (only for temporary ban) */}
          {banType === EBanType.TEMPORARY_BAN && (
            <div>
              <p className="text-regular-text-secondary-cl text-sm mb-2">Duration:</p>

              {/* Duration Type Selection */}
              <div className="space-y-2 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!useCustomDate}
                    onChange={() => setUseCustomDate(false)}
                    className="text-regular-violet-cl bg-regular-black-cl border-regular-violet-cl rounded focus:ring-regular-violet-cl focus:ring-2"
                  />
                  <span className="text-regular-white-cl text-sm">Use predefined duration</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={useCustomDate}
                    onChange={() => setUseCustomDate(true)}
                    className="text-regular-violet-cl bg-regular-black-cl border-regular-violet-cl rounded focus:ring-regular-violet-cl focus:ring-2"
                  />
                  <span className="text-regular-white-cl text-sm">Set custom date and time</span>
                </label>
              </div>

              {/* Predefined Duration Options */}
              {!useCustomDate && (
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(Number(e.target.value))}
                  className="w-full bg-regular-black-cl border border-regular-hover-card-cl rounded-lg px-3 py-2 text-regular-white-cl focus:border-regular-violet-cl focus:outline-none"
                >
                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {/* Custom Date and Time */}
              {useCustomDate && (
                <div>
                  <input
                    type="datetime-local"
                    value={customBanUntil}
                    onChange={(e) => setCustomBanUntil(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full bg-regular-black-cl border border-regular-hover-card-cl rounded-lg px-3 py-2 text-regular-white-cl focus:border-regular-violet-cl focus:outline-none"
                  />
                  <p className="text-regular-text-secondary-cl text-xs mt-1">
                    Ban will expire at the selected date and time
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <p className="text-regular-text-secondary-cl text-sm mb-2">Reason:</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for banning this user..."
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
            className="px-4 py-2 bg-red-500 text-regular-white-cl rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            Ban User
          </button>
        </div>
      </div>
    </div>
  )
}

interface ViolationDetailModalProps {
  violation: TAdminViolationReport | null
  isOpen: boolean
  onClose: () => void
  onUpdateStatus?: (reportId: number, status: TViolationReportStatus) => Promise<void>
  onBanUser?: (
    reportId: number,
    banType: EBanType,
    reason: string,
    banDuration?: number
  ) => Promise<void>
}

export const ViolationDetailModal = ({
  violation,
  isOpen,
  onClose,
  onUpdateStatus,
  onBanUser,
}: ViolationDetailModalProps) => {
  const [expandedMessages, setExpandedMessages] = useState(false)
  const [expandedImages, setExpandedImages] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [showDismissConfirm, setShowDismissConfirm] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const [showBanModal, setShowBanModal] = useState(false)
  const [showUserHistory, setShowUserHistory] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{
    id: number
    name: string
    email: string
  } | null>(null)

  // Media viewer states
  const [showMediaViewer, setShowMediaViewer] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Reset states when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Reset all states when modal closes
      setHasReviewed(false)
      setExpandedMessages(false)
      setExpandedImages(false)
      setShowDismissConfirm(false)
      setShowBanModal(false)
      setIsDismissing(false)
      setShowUserHistory(false)
      setSelectedUser(null)
      setShowMediaViewer(false)
      setSelectedImageIndex(0)
    }
  }, [isOpen])

  // Fetch detailed report data including messages
  const { report: detailedReport, loading: detailLoading } = useViolationReportDetail(
    violation?.id || null
  )

  if (!isOpen || !violation) return null

  // Handle image click to open media viewer
  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
    setShowMediaViewer(true)
  }

  // Handle media viewer close
  const handleMediaViewerClose = () => {
    setShowMediaViewer(false)
  }

  // Convert report images to MediaViewerModal format
  const getMediaItems = () => {
    if (!detailedReport?.reportImages) return []

    return detailedReport.reportImages.map((image, index) => ({
      id: image.id,
      type: "IMAGE",
      mediaUrl: image.imageUrl,
      fileName: `Report Image ${index + 1}`,
      thumbnailUrl: image.imageUrl,
      createdAt: violation.createdAt,
      authorId: violation.reporterId,
    }))
  }

  // Mock user data for MediaViewerModal (since we don't have actual user data here)
  const mockCreator: TUserWithProfile = {
    id: violation.reporterId,
    email: violation.reporterEmail,
    password: "", // Not used in MediaViewerModal
    createdAt: violation.createdAt,
    role: "USER" as any, // Default role
    Profile: {
      id: 0, // Not used in MediaViewerModal
      createdAt: violation.createdAt,
      fullName: violation.reporterName,
      avatar: undefined,
    },
  }

  const mockRecipient: TUserWithProfile = {
    id: violation.reportedUserId,
    email: violation.reportedUserEmail,
    password: "", // Not used in MediaViewerModal
    createdAt: violation.createdAt,
    role: "USER" as any, // Default role
    Profile: {
      id: 0, // Not used in MediaViewerModal
      createdAt: violation.createdAt,
      fullName: violation.reportedUserName,
      avatar: undefined,
    },
  }

  const handleDismissClick = () => {
    setShowDismissConfirm(true)
  }

  const handleDismissConfirm = async () => {
    if (!onUpdateStatus) return

    try {
      setIsDismissing(true)
      await onUpdateStatus(violation.id, EViolationReportStatus.DISMISSED)
      setShowDismissConfirm(false)
      onClose() // Close the modal after successful dismiss
    } catch (error) {
      console.error("Error dismissing report:", error)
    } finally {
      setIsDismissing(false)
    }
  }

  const handleDismissCancel = () => {
    setShowDismissConfirm(false)
  }

  const handleWarning = async () => {
    if (onBanUser) {
      await onBanUser(
        violation.id,
        EBanType.WARNING,
        "Warning issued for violation of community guidelines"
      )
    }
  }

  const handleBanUserClick = () => {
    setShowBanModal(true)
  }

  const handleBanUserConfirm = async (banType: EBanType, reason: string, banDuration?: number) => {
    if (onBanUser) {
      await onBanUser(violation.id, banType, reason, banDuration)
    }
  }

  const handleBanModalClose = () => {
    setShowBanModal(false)
  }

  const handleUserHistoryClick = (userId: number, userName: string, userEmail: string) => {
    setSelectedUser({ id: userId, name: userName, email: userEmail })
    setShowUserHistory(true)
  }

  const handleUserHistoryClose = () => {
    setShowUserHistory(false)
    setSelectedUser(null)
  }

  const renderMessageContent = (message: any) => {
    switch (message.messageType) {
      case "TEXT":
        return (
          <div className="bg-regular-hover-card-cl p-3 rounded-lg">
            <p className="text-regular-white-cl">{message.messageContent}</p>
          </div>
        )
      case "IMAGE":
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
      case "VIDEO":
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
      case "AUDIO":
        return (
          <div className="bg-regular-hover-card-cl p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-regular-text-secondary-cl text-sm">Audio</span>
            </div>
            <audio src={message.messageContent} controls className="w-full" />
          </div>
        )
      case "DOCUMENT":
        return (
          <div className="bg-regular-hover-card-cl p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-regular-violet-cl" />
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

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-regular-dark-gray-cl rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-regular-hover-card-cl flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-regular-white-cl">
                Violation Report Details
              </h2>
              <button
                onClick={onClose}
                className="text-regular-text-secondary-cl hover:text-regular-white-cl"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content with custom scroll */}
          <div className="flex-1 overflow-y-auto STYLE-styled-modal-scrollbar">
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-regular-white-cl mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-regular-text-secondary-cl text-sm">Report ID</p>
                    <p className="text-regular-white-cl">#{violation.id}</p>
                  </div>
                  <div>
                    <p className="text-regular-text-secondary-cl text-sm">Status</p>
                    <StatusBadge status={violation.status} />
                  </div>
                  <div>
                    <p className="text-regular-text-secondary-cl text-sm">Category</p>
                    <CategoryBadge category={violation.reportCategory} />
                  </div>
                  <div>
                    <p className="text-regular-text-secondary-cl text-sm">Reported Date</p>
                    <p className="text-regular-white-cl">
                      {new Date(violation.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* User Information - 2 columns */}
              <div>
                <h3 className="text-lg font-medium text-regular-white-cl mb-4">User Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Reporter Information */}
                  <div className="bg-regular-hover-card-cl p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-regular-violet-cl font-medium">Reporter</h4>
                      <button
                        onClick={() =>
                          handleUserHistoryClick(
                            violation.reporterId,
                            violation.reporterName,
                            violation.reporterEmail
                          )
                        }
                        className="text-regular-violet-cl hover:text-regular-tooltip-bgcl p-1 rounded hover:bg-regular-black-cl transition-colors"
                        title="View report history"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-regular-white-cl font-medium">{violation.reporterName}</p>
                    <p className="text-regular-text-secondary-cl">{violation.reporterEmail}</p>
                  </div>

                  {/* Reported User Information */}
                  <div className="bg-regular-hover-card-cl p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-regular-violet-cl font-medium">Reported User</h4>
                      <button
                        onClick={() =>
                          handleUserHistoryClick(
                            violation.reportedUserId,
                            violation.reportedUserName,
                            violation.reportedUserEmail
                          )
                        }
                        className="text-regular-violet-cl hover:text-regular-tooltip-bgcl p-1 rounded hover:bg-regular-black-cl transition-colors"
                        title="View report history"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-regular-white-cl font-medium">
                      {violation.reportedUserName}
                    </p>
                    <p className="text-regular-text-secondary-cl">{violation.reportedUserEmail}</p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              {violation.reasonText && (
                <div>
                  <h3 className="text-lg font-medium text-regular-white-cl mb-4">Reason</h3>
                  <div className="bg-regular-hover-card-cl p-4 rounded-lg">
                    <p className="text-regular-white-cl">{violation.reasonText}</p>
                  </div>
                </div>
              )}

              {/* Evidence Summary */}
              <div>
                <h3 className="text-lg font-medium text-regular-white-cl mb-4">Evidence Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Messages Column */}
                  <div className="bg-regular-hover-card-cl rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedMessages(!expandedMessages)}
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
                            <p className="text-regular-text-secondary-cl text-sm mt-2">
                              Loading messages...
                            </p>
                          </div>
                        ) : detailedReport?.reportedMessages &&
                          detailedReport.reportedMessages.length > 0 ? (
                          <div className="space-y-3 max-h-64 overflow-y-auto STYLE-styled-modal-scrollbar">
                            {detailedReport.reportedMessages.map((message, index) => (
                              <div key={message.id} className="bg-regular-black-cl p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-regular-text-secondary-cl text-xs">
                                      #{index + 1}
                                    </span>
                                    <MessageTypeBadge type={message.messageType} />
                                  </div>
                                  <span className="text-regular-text-secondary-cl text-xs">
                                    {new Date(message.createdAt).toLocaleTimeString()}
                                  </span>
                                </div>
                                {renderMessageContent(message)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-regular-text-secondary-cl text-sm">
                              No messages reported
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Images Column */}
                  <div className="bg-regular-hover-card-cl rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedImages(!expandedImages)}
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
                            <p className="text-regular-text-secondary-cl text-sm mt-2">
                              Loading images...
                            </p>
                          </div>
                        ) : detailedReport?.reportImages &&
                          detailedReport.reportImages.length > 0 ? (
                          <div className="grid grid-cols-5 gap-2">
                            {detailedReport.reportImages.slice(0, 5).map((image, index) => (
                              <div
                                key={image.id}
                                className="aspect-square rounded-lg overflow-hidden bg-regular-black-cl cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleImageClick(index)}
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
                            <p className="text-regular-text-secondary-cl text-sm">
                              No images reported
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Review Confirmation - Only show for pending reports */}
              {violation.status === EViolationReportStatus.PENDING && (
                <div className="bg-regular-hover-card-cl p-4 rounded-lg border border-regular-violet-cl/20">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="review-confirmation"
                      checked={hasReviewed}
                      onChange={(e) => setHasReviewed(e.target.checked)}
                      className="mt-1 w-4 h-4 text-regular-violet-cl bg-regular-black-cl border-regular-violet-cl rounded focus:ring-regular-violet-cl focus:ring-2"
                    />
                    <div>
                      <label
                        htmlFor="review-confirmation"
                        className="text-regular-white-cl font-medium cursor-pointer"
                      >
                        Review Confirmation
                      </label>
                      <p className="text-regular-text-secondary-cl text-sm mt-1">
                        I have carefully reviewed this violation report and all associated evidence.
                        I understand the implications of my decision and confirm that I am ready to
                        take appropriate action.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Resolution Information - Show for resolved/dismissed reports */}
              {(violation.status === EViolationReportStatus.RESOLVED ||
                violation.status === EViolationReportStatus.DISMISSED) && (
                <div className="bg-regular-hover-card-cl p-4 rounded-lg border border-green-500/20">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {violation.status === EViolationReportStatus.RESOLVED ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-regular-white-cl font-medium">
                        {violation.status === EViolationReportStatus.RESOLVED
                          ? "Report Resolved"
                          : "Report Dismissed"}
                      </h4>
                      <p className="text-regular-text-secondary-cl text-sm mt-1">
                        This violation report has been processed and no further action is required.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Only show for pending reports */}
          {violation.status === EViolationReportStatus.PENDING && hasReviewed && (
            <div className="p-6 border-t border-regular-hover-card-cl flex-shrink-0">
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDismissClick}
                  className="bg-gray-500 text-regular-white-cl py-2 px-4 rounded-lg hover:bg-gray-600 flex items-center gap-2 transition-colors"
                >
                  <XCircleIcon className="h-4 w-4" />
                  Dismiss Report
                </button>
                <button
                  onClick={handleWarning}
                  className="bg-yellow-500 text-regular-white-cl py-2 px-4 rounded-lg hover:bg-yellow-600 flex items-center gap-2 transition-colors"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Warning User
                </button>
                <button
                  onClick={handleBanUserClick}
                  className="bg-red-500 text-regular-white-cl py-2 px-4 rounded-lg hover:bg-red-600 flex items-center gap-2 transition-colors"
                >
                  <Ban className="h-4 w-4" />
                  Ban User
                </button>
              </div>
            </div>
          )}

          {/* View Only Footer - Show for resolved/dismissed reports */}
          {(violation.status === EViolationReportStatus.RESOLVED ||
            violation.status === EViolationReportStatus.DISMISSED) && (
            <div className="p-6 border-t border-regular-hover-card-cl flex-shrink-0">
              <div className="flex justify-end">
                <div className="flex items-center gap-2 text-regular-text-secondary-cl">
                  <span className="text-sm">
                    {violation.status === EViolationReportStatus.RESOLVED
                      ? "Report has been resolved"
                      : "Report has been dismissed"}
                  </span>
                  {violation.status === EViolationReportStatus.RESOLVED ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-red-400" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDismissConfirm}
        onClose={handleDismissCancel}
        onConfirm={handleDismissConfirm}
        title="Dismiss Violation Report"
        message={`Are you sure you want to dismiss this violation report (#${violation.id})? This action will mark the report as dismissed and cannot be undone.`}
        confirmText="Dismiss Report"
        isLoading={isDismissing}
      />

      {/* Ban User Modal */}
      <BanUserModal
        isOpen={showBanModal}
        onClose={handleBanModalClose}
        onConfirm={handleBanUserConfirm}
        reportedUserName={violation.reportedUserName}
      />

      {/* User Report History Modal */}
      {selectedUser && (
        <UserReportHistoryModal
          isOpen={showUserHistory}
          onClose={handleUserHistoryClose}
          userId={selectedUser.id}
          userName={selectedUser.name}
          userEmail={selectedUser.email}
        />
      )}

      {/* Media Viewer Modal */}
      <MediaViewerModal
        isOpen={showMediaViewer}
        onClose={handleMediaViewerClose}
        mediaItems={getMediaItems()}
        initialIndex={selectedImageIndex}
        creator={mockCreator}
        recipient={mockRecipient}
        showUserInfo={false}
        showActionButtons={false}
        showZoomControls={true}
      />
    </>
  )
}
