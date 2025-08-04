import { useState } from "react"
import { X, ChevronRight } from "lucide-react"
import { IconButton } from "@/components/materials/icon-button"
import { SelectImageModal } from "./select-image-model"

type TReportReason = "sensitive" | "annoying" | "scam" | "other"

import type { TUserWithProfile } from "@/utils/types/be-api"

type TReportModalProps = {
  isOpen: boolean
  onClose: () => void
  user: TUserWithProfile
}

export const ReportModal = ({ isOpen, onClose, user }: TReportModalProps) => {
  const [selectedReason, setSelectedReason] = useState<TReportReason | null>(null)
  const [description, setDescription] = useState("")
  const [showEvidenceSection, setShowEvidenceSection] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState(0)
  const [selectedImages, setSelectedImages] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const handleReasonChange = (reason: TReportReason) => {
    setSelectedReason(reason)
    if (reason !== "other") {
      setDescription("")
    }
  }

  const handleSubmit = () => {
    // TODO: Implement report submission
    console.log("Report submitted:", {
      selectedReason,
      description,
      selectedMessages,
      selectedImages,
      user,
    })
    handleClose()
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleImageClick = () => {
    setShowImageModal(true)
  }

  const handleImageModalClose = () => {
    setShowImageModal(false)
  }

  const handleImageModalBack = () => {
    setShowImageModal(false)
  }

  const handleImagesChange = (count: number) => {
    setSelectedImages(count)
  }

  const isSubmitDisabled = !selectedReason || (selectedReason === "other" && !description.trim())

  if (!isOpen && !isClosing) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-regular-black-cl rounded-lg w-full max-w-md mx-4 max-h-[95vh] flex flex-col border-2 border-regular-white-cl transition-all duration-300 ease-out relative overflow-hidden ${
          isOpen && !isClosing ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Report Modal Content - luôn hiển thị */}
        <div className="w-full h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-regular-hover-card-cl">
            <h2 className="text-regular-white-cl text-lg font-semibold">Report Account</h2>
            <IconButton
              className="text-regular-white-cl hover:text-regular-text-secondary-cl"
              onClick={handleClose}
            >
              <X size={20} />
            </IconButton>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto STYLE-styled-modal-scrollbar p-6 space-y-6">
            {/* Reason Selection */}
            <div>
              <h3 className="text-regular-white-cl text-base font-medium mb-4">
                Choose reason to report account {user.Profile.fullName || "User"}
              </h3>
              <div className="space-y-3">
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

            {/* Description Input (Conditional) */}
            {selectedReason === "other" && (
              <div className="mt-4">
                <label className="block text-regular-white-cl text-sm font-medium mb-2">
                  Enter description to continue*
                </label>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter reason for reporting"
                    maxLength={1000}
                    className="w-full h-24 px-3 py-2 bg-regular-dark-gray-cl border border-regular-hover-card-cl rounded-lg text-regular-white-cl placeholder-regular-placeholder-cl resize-none focus:outline-none focus:ring-2 focus:ring-regular-violet-cl"
                  />
                  <div className="absolute bottom-2 right-2 text-regular-text-secondary-cl text-xs">
                    {description.length}/1000
                  </div>
                </div>
              </div>
            )}

            {/* Evidence Attachment Section */}
            <div className="border-t border-regular-hover-card-cl pt-4">
              <div
                className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-regular-hover-card-cl transition-colors"
                onClick={() => setShowEvidenceSection(!showEvidenceSection)}
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

          {/* Action Button */}
          <div className="p-4 border-t border-regular-hover-card-cl">
            <button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className={`w-full py-3 px-4 rounded-lg font-medium text-base transition-colors ${
                isSubmitDisabled
                  ? "bg-regular-dark-gray-cl text-regular-text-secondary-cl cursor-not-allowed"
                  : "bg-gradient-to-b from-regular-violet-cl to-regular-violet-cl text-regular-white-cl hover:from-regular-tooltip-bgcl hover:to-regular-tooltip-bgcl"
              }`}
            >
              Report
            </button>
          </div>
        </div>

        {/* Select Image Modal - hiển thị khi showImageModal = true */}
        {showImageModal && (
          <SelectImageModal
            isOpen={showImageModal}
            onClose={handleImageModalClose}
            onBack={handleImageModalBack}
            selectedImages={selectedImages}
            onImagesChange={handleImagesChange}
            asOverlay={false}
          />
        )}
      </div>
    </div>
  )
}
