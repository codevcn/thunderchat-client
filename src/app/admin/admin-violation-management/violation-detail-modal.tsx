"use client"

import { XCircle, CheckCircle, XCircle as XCircleIcon, Ban, AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"
import type { TAdminViolationReport, TViolationReportStatus } from "@/utils/types/be-api"
import { EViolationReportStatus, EBanType, EAppRole } from "@/utils/enums"
import { useViolationReportDetail } from "@/hooks/use-admin-violation-reports"
import { UserReportHistoryModal } from "./user-history-violation-model"
import MediaViewerModal from "@/components/chatbox/media-viewer-modal"
import type { TUserWithProfile } from "@/utils/types/be-api"

// Import các component đã tách
import { ConfirmationModal, WarningUserModal, BanUserModal } from "./components/modals"
import {
  BasicInformationSection,
  UserInformationSection,
  EvidenceSummarySection,
} from "./components/sections"

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
  const [showWarningModal, setShowWarningModal] = useState(false)
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
      setShowWarningModal(false)
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

    return detailedReport.reportImages.map((image, index: number) => ({
      id: image.id,
      type: "IMAGE" as const,
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
    role: EAppRole.USER, // Default role
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
    role: EAppRole.USER, // Default role
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

  const handleWarningClick = () => {
    setShowWarningModal(true)
  }

  const handleWarningConfirm = async (reason: string) => {
    if (onBanUser) {
      await onBanUser(violation.id, EBanType.WARNING, reason)
    }
  }

  const handleWarningModalClose = () => {
    setShowWarningModal(false)
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
              <BasicInformationSection violation={violation} />

              {/* User Information */}
              <UserInformationSection
                violation={violation}
                onUserHistoryClick={handleUserHistoryClick}
              />

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
              <EvidenceSummarySection
                violation={violation}
                detailedReport={detailedReport}
                detailLoading={detailLoading}
                expandedMessages={expandedMessages}
                expandedImages={expandedImages}
                onToggleMessages={() => setExpandedMessages(!expandedMessages)}
                onToggleImages={() => setExpandedImages(!expandedImages)}
                onImageClick={handleImageClick}
              />

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
                  onClick={handleWarningClick}
                  className="bg-yellow-500 text-regular-white-cl py-2 px-4 rounded-lg hover:bg-yellow-600 flex items-center gap-2 transition-colors"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Warning Reported User
                </button>
                <button
                  onClick={handleBanUserClick}
                  className="bg-red-500 text-regular-white-cl py-2 px-4 rounded-lg hover:bg-red-600 flex items-center gap-2 transition-colors"
                >
                  <Ban className="h-4 w-4" />
                  Ban Reported User
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

      {/* Warning User Modal */}
      <WarningUserModal
        isOpen={showWarningModal}
        onClose={handleWarningModalClose}
        onConfirm={handleWarningConfirm}
        reportedUserName={violation.reportedUserName}
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
          currentReportId={violation?.id}
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
