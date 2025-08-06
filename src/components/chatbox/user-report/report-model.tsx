import { useState, useEffect, useCallback, useRef } from "react"
import { X, ChevronRight } from "lucide-react"
import { IconButton } from "@/components/materials/icon-button"
import { SelectImageModal } from "./select-image-model"
import { SelectMessageModal } from "./select-message-model"
import { useUserReport } from "@/hooks/use-user-report"
import { EMessageTypes, EMessageMediaTypes, EReportCategory } from "@/utils/enums"
import type { TReportedMessageFE, TReportSession } from "@/utils/types/fe-api"
import type { TStateDirectMessage } from "@/utils/types/global"
import { toast } from "sonner"

type TReportReason = "sensitive" | "annoying" | "scam" | "other"

import type { TProfile, TUserWithProfile } from "@/utils/types/be-api"
import { EMessageStatus } from "@/utils/socket/enums"

type TReportModalProps = {
  isOpen: boolean
  onClose: () => void
  user: TUserWithProfile
  conversationId?: number
  conversationType?: "direct" | "group"
}

export const ReportModal = ({
  isOpen,
  onClose,
  user,
  conversationId,
  conversationType = "direct",
}: TReportModalProps) => {
  const [selectedReason, setSelectedReason] = useState<TReportReason | null>(null)
  const [description, setDescription] = useState("")
  const [showEvidenceSection, setShowEvidenceSection] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState(0)
  const [selectedImages, setSelectedImages] = useState(0)
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([])
  const [showImageModal, setShowImageModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const {
    createViolationReport,
    convertToBackendData,
    isSubmitting,
    error: submitError,
    clearError,
  } = useUserReport()

  // State để lưu TReportSession
  const [reportSession, setReportSession] = useState<TReportSession | null>(null)
  const evidenceSectionRef = useRef<HTMLDivElement>(null)

  // Chuyển đổi TStateDirectMessage thành TReportedMessageFE
  const convertMessageToReported = useCallback(
    (message: TStateDirectMessage): TReportedMessageFE => {
      let messageContent = ""

      // Xác định content dựa trên type
      if (message.type === EMessageTypes.TEXT) {
        messageContent = message.content || ""
      } else if (message.type === EMessageTypes.STICKER) {
        messageContent = message.Sticker?.imageUrl || ""
      } else if (message.type === EMessageTypes.MEDIA) {
        messageContent = message.Media?.url || ""
      }

      return {
        messageId: message.id,
        messageType: message.type,
        messageContent,
        conversationId: conversationId || 0,
        conversationType,
      }
    },
    [conversationId, conversationType]
  )

  // Chuyển đổi TReportedMessageFE thành TStateDirectMessage cho initialMessages
  const convertReportedToStateMessage = useCallback(
    (reportedMessage: TReportedMessageFE): TStateDirectMessage => {
      return {
        id: reportedMessage.messageId,
        content: reportedMessage.messageType === "TEXT" ? reportedMessage.messageContent : "",
        authorId: 0, // Sẽ được set từ session hoặc API
        directChatId: reportedMessage.conversationId,
        groupChatId: undefined,
        status: EMessageStatus.SEEN,
        stickerId: undefined,
        mediaId: undefined,
        type: reportedMessage.messageType as EMessageTypes,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        Author: {} as TUserWithProfile,
        ReplyTo: null,
        Media: ["IMAGE", "VIDEO", "AUDIO", "DOCUMENT"].includes(reportedMessage.messageType)
          ? {
              id: 0,
              type: reportedMessage.messageType as EMessageMediaTypes,
              url: reportedMessage.messageContent,
              fileSize: 0,
              fileName: "",
              thumbnailUrl: "",
              createdAt: new Date(),
            }
          : null,
        Sticker:
          reportedMessage.messageType === "STICKER"
            ? {
                id: 0,
                stickerName: "",
                imageUrl: reportedMessage.messageContent,
                categoryId: 0,
                createdAt: new Date().toISOString(),
              }
            : null,
      }
    },
    []
  )

  // Lấy initial messages từ session
  const getInitialMessages = useCallback((): TStateDirectMessage[] => {
    if (!reportSession?.reportedMessages) return []
    const initialMessages = reportSession.reportedMessages.map(convertReportedToStateMessage)
    return initialMessages
  }, [reportSession, convertReportedToStateMessage])

  // Cập nhật report session khi messages thay đổi
  const updateReportSession = useCallback(
    (messages: TStateDirectMessage[]) => {
      if (!conversationId) return

      // Cập nhật hoặc tạo session mới
      const reportedMessages = messages.map(convertMessageToReported)
      const newSession: TReportSession = {
        conversationId,
        conversationType,
        reportedMessages,
        reason: selectedReason || undefined,
        description: description || undefined,
      }
      setReportSession(newSession)
    },
    [conversationId, conversationType, convertMessageToReported, selectedReason, description]
  )

  // Kiểm tra message đã được chọn chưa
  const isMessageSelected = useCallback(
    (messageId: number): boolean => {
      if (!reportSession) return false
      return reportSession.reportedMessages.some((msg) => msg.messageId === messageId)
    },
    [reportSession]
  )

  // Reset all values when modal is completely closed
  useEffect(() => {
    if (!isOpen && !isClosing) {
      // Only reset if we're not in the process of closing
      setSelectedReason(null)
      setDescription("")
      setShowEvidenceSection(false)
      clearError()
      setSelectedMessages(0)
      setSelectedImages(0)
      setSelectedImageFiles([])
      setReportSession(null) // Clear report session when modal closes
      setShowImageModal(false)
      setShowMessageModal(false)
    }
  }, [isOpen, isClosing, clearError])

  // Load session data when modal opens
  useEffect(() => {
    if (isOpen && conversationId && conversationType) {
      // Kiểm tra xem có session data cho conversation này không
      if (
        reportSession &&
        reportSession.conversationId === conversationId &&
        reportSession.conversationType === conversationType
      ) {
        // Load reason và description từ session
        if (reportSession.reason) {
          setSelectedReason(reportSession.reason as TReportReason)
        }
        if (reportSession.description) {
          setDescription(reportSession.description)
        }
        // Load selected messages count
        setSelectedMessages(reportSession.reportedMessages.length)
      }
    }
  }, [isOpen, conversationId, conversationType, reportSession])

  const handleReasonChange = useCallback(
    (reason: TReportReason) => {
      setSelectedReason(reason)
      if (reason !== "other") {
        setDescription("")
      }
      // Cập nhật hoặc tạo session
      if (conversationId && conversationType) {
        if (reportSession) {
          const updatedSession = {
            ...reportSession,
            reason,
            description: reason !== "other" ? "" : reportSession.description,
          }
          setReportSession(updatedSession)
        } else {
          // Tạo session mới
          const newSession: TReportSession = {
            conversationId,
            conversationType,
            reportedMessages: [],
            reason,
            description: reason !== "other" ? "" : undefined,
          }
          setReportSession(newSession)
        }
      }
    },
    [reportSession, conversationId, conversationType]
  )

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newDescription = e.target.value
      setDescription(newDescription)
      // Cập nhật hoặc tạo session
      if (conversationId && conversationType) {
        if (reportSession) {
          const updatedSession = { ...reportSession, description: newDescription }
          setReportSession(updatedSession)
        } else {
          // Tạo session mới
          const newSession: TReportSession = {
            conversationId,
            conversationType,
            reportedMessages: [],
            reason: selectedReason || undefined,
            description: newDescription,
          }
          setReportSession(newSession)
        }
      }
    },
    [reportSession, conversationId, conversationType, selectedReason]
  )

  const handleEvidenceSectionToggle = useCallback(() => {
    setShowEvidenceSection(!showEvidenceSection)

    // Scroll to evidence section when opening
    if (!showEvidenceSection && evidenceSectionRef.current) {
      setTimeout(() => {
        evidenceSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }, 100)
    }
  }, [showEvidenceSection])

  const handleClose = useCallback(() => {
    // Clear session immediately when user clicks X
    setReportSession(null)
    setSelectedReason(null)
    setDescription("")
    setShowEvidenceSection(false)
    setSelectedMessages(0)
    setSelectedImages(0)
    setSelectedImageFiles([])
    setShowImageModal(false)
    setShowMessageModal(false)
    clearError()

    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }, [onClose, clearError])

  const handleSubmit = useCallback(async () => {
    if (!selectedReason) {
      return
    }

    // Map report reason to backend category
    const getReportCategory = (reason: TReportReason): EReportCategory => {
      switch (reason) {
        case "sensitive":
          return EReportCategory.SENSITIVE_CONTENT
        case "annoying":
          return EReportCategory.BOTHER
        case "scam":
          return EReportCategory.FRAUD
        case "other":
          return EReportCategory.OTHER
        default:
          return EReportCategory.OTHER
      }
    }

    // Prepare report data
    const reportData = {
      reportedUserId: user.id, // user.id là ID của người đối phương (người bị báo cáo)
      reportCategory: getReportCategory(selectedReason),
      reasonText: description.trim() || undefined,
      reportedMessages: reportSession?.reportedMessages || [],
    }

    // Convert to backend format
    const backendData = convertToBackendData(reportData)

    // Submit report
    const result = await createViolationReport(backendData, selectedImageFiles)

    if (result.success) {
      // Success - close modal
      handleClose()
      // You can add a success toast here if needed
      toast.success(result.message || "Report submitted successfully")
    } else {
      toast.error(result.error || "Report failed")
    }
  }, [
    selectedReason,
    description,
    user,
    reportSession,
    selectedImageFiles,
    handleClose,
    convertToBackendData,
    createViolationReport,
  ])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose()
      }
    },
    [handleClose]
  )

  const handleImageClick = useCallback(() => {
    setShowImageModal(true)
  }, [])

  const handleImageModalClose = useCallback(() => {
    onClose() // Chỉ cần thoát ReportModal, modal con sẽ tự động thoát
  }, [onClose])

  const handleImageModalBack = useCallback(() => {
    setShowImageModal(false)
  }, [])

  const handleImagesChange = useCallback((count: number) => {
    setSelectedImages(count)
  }, [])

  const handleImagesUpdate = useCallback((images: File[]) => {
    setSelectedImageFiles(images)
    setSelectedImages(images.length)
  }, [])

  const handleMessageClick = useCallback(() => {
    setShowMessageModal(true)
  }, [])

  const handleMessageModalClose = useCallback(() => {
    onClose() // Chỉ cần thoát ReportModal, modal con sẽ tự động thoát
  }, [onClose])

  const handleMessageModalBack = useCallback(() => {
    setShowMessageModal(false)
  }, [])

  const handleMessagesUpdate = useCallback(
    (messages: TStateDirectMessage[]) => {
      setSelectedMessages(messages.length)
      // Cập nhật report session
      updateReportSession(messages)
    },
    [updateReportSession]
  )

  const handleMessagesChange = useCallback((count: number) => {
    setSelectedMessages(count)
  }, [])

  const isSubmitDisabled = !selectedReason || isSubmitting

  if (!isOpen && !isClosing) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-regular-black-cl rounded-lg w-full max-w-md mx-4 max-h-[95vh] flex flex-col transition-all duration-300 ease-out relative overflow-hidden ${
          isOpen && !isClosing ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-regular-hover-card-cl flex-shrink-0">
          <h2 className="text-regular-white-cl text-lg font-semibold">Report Account</h2>
          <IconButton
            className="text-regular-white-cl hover:text-regular-text-secondary-cl"
            onClick={handleClose}
          >
            <X size={20} />
          </IconButton>
        </div>

        {/* Main Content - Scrollable with fixed height */}
        <div
          className="flex-1 overflow-y-auto STYLE-styled-modal-scrollbar p-6 space-y-6"
          style={{ maxHeight: "calc(95vh - 140px)" }}
        >
          {/* Reason Selection */}
          <div>
            <h3 className="text-regular-white-cl text-base font-medium mb-2">
              Choose reason to report account {user.Profile.fullName || "User"}
            </h3>
            <div className="space-y-2">
              {[
                { value: "sensitive", label: "Sensitive content" },
                { value: "annoying", label: "Harassment" },
                { value: "scam", label: "Scam/Fraud" },
                { value: "other", label: "Other reason" },
              ].map((reason) => (
                <label
                  key={reason.value}
                  className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-regular-hover-card-cl transition-colors"
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={() => handleReasonChange(reason.value as TReportReason)}
                    className="w-4 h-4 text-regular-violet-cl bg-regular-dark-gray-cl border-regular-hover-card-cl focus:ring-regular-violet-cl focus:ring-2"
                  />
                  <span className="text-regular-white-cl text-sm">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-regular-hover-card-cl"></div>

          {/* Description Input - Always visible */}
          <div>
            <label className="block text-regular-white-cl text-sm font-medium mb-2">
              Enter description to continue*
            </label>
            <div className="relative">
              <textarea
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Enter reason for reporting"
                maxLength={1000}
                className="w-full h-24 px-3 py-2 bg-regular-dark-gray-cl border border-regular-hover-card-cl rounded-lg text-regular-white-cl placeholder-regular-placeholder-cl resize-none focus:outline-none focus:ring-2 focus:ring-regular-violet-cl"
              />
              <div className="absolute bottom-2 right-2 text-regular-text-secondary-cl text-xs">
                {description.length}/1000
              </div>
            </div>
          </div>

          {/* Evidence Attachment Section */}
          <div className="border-t border-regular-hover-card-cl pt-2" ref={evidenceSectionRef}>
            <div
              className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-regular-hover-card-cl transition-colors"
              onClick={handleEvidenceSectionToggle}
            >
              <div className="flex-1">
                <h3 className="text-regular-white-cl text-base font-medium mb-1">
                  Attach evidence (Optional)
                </h3>
                <p className="text-regular-text-secondary-cl text-sm leading-relaxed">
                  You can attach messages and upload related photos to clarify the violation.{" "}
                  <span className="text-regular-violet-cl cursor-pointer hover:underline">
                    Learn more
                  </span>
                </p>
              </div>
              <ChevronRight
                size={20}
                className={`text-regular-text-secondary-cl transition-transform flex-shrink-0 ml-4 ${showEvidenceSection ? "rotate-90" : ""}`}
              />
            </div>

            {/* Evidence Selection (Conditional) */}
            {showEvidenceSection && (
              <div className="mt-4 space-y-3">
                <div
                  className="flex items-center justify-between p-3 bg-regular-dark-gray-cl rounded-lg cursor-pointer hover:bg-regular-hover-card-cl transition-colors"
                  onClick={handleMessageClick}
                >
                  <span className="text-regular-white-cl text-sm font-medium">
                    Messages ({selectedMessages}/10)
                  </span>
                  <ChevronRight
                    size={18}
                    className="text-regular-text-secondary-cl flex-shrink-0"
                  />
                </div>
                <div
                  className="flex items-center justify-between p-3 bg-regular-dark-gray-cl rounded-lg cursor-pointer hover:bg-regular-hover-card-cl transition-colors"
                  onClick={handleImageClick}
                >
                  <span className="text-regular-white-cl text-sm font-medium">
                    Images ({selectedImages}/5)
                  </span>
                  <ChevronRight
                    size={18}
                    className="text-regular-text-secondary-cl flex-shrink-0"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {submitError && (
          <div className="px-4 pb-2">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{submitError}</p>
            </div>
          </div>
        )}

        {/* Button Report - Fixed */}
        <div className="p-4 border-t border-regular-hover-card-cl flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`w-full py-3 px-4 rounded-lg font-medium text-base transition-colors ${
              isSubmitDisabled
                ? "bg-regular-dark-gray-cl text-regular-text-secondary-cl cursor-not-allowed"
                : "bg-gradient-to-b from-regular-violet-cl to-regular-violet-cl text-regular-white-cl hover:from-regular-tooltip-bgcl hover:to-regular-tooltip-bgcl"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Report"}
          </button>
        </div>

        {/* Select Image Modal - hiển thị khi showImageModal = true */}
        {showImageModal && (
          <SelectImageModal
            isOpen={showImageModal}
            onClose={handleImageModalClose}
            onBack={handleImageModalBack}
            selectedImages={selectedImages}
            onImagesChange={handleImagesChange}
            onImagesUpdate={handleImagesUpdate}
            initialImages={selectedImageFiles}
            asOverlay={false}
          />
        )}

        {/* Select Message Modal - hiển thị khi showMessageModal = true */}
        {showMessageModal && (
          <SelectMessageModal
            isOpen={showMessageModal}
            onClose={handleMessageModalClose}
            onBack={handleMessageModalBack}
            selectedMessages={selectedMessages}
            onMessagesChange={handleMessagesChange}
            onMessagesUpdate={handleMessagesUpdate}
            initialMessages={getInitialMessages()}
            asOverlay={false}
            conversationId={conversationId}
            conversationType={conversationType}
            isMessageSelected={isMessageSelected}
          />
        )}
      </div>
    </div>
  )
}
