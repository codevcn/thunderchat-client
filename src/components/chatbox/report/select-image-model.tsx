// ... giữ lại các import cũ
import { useState, useEffect, useRef, useCallback } from "react"
import { X, ChevronLeft, Plus, Trash2 } from "lucide-react"
import { IconButton } from "@/components/materials/icon-button"
import MediaViewerModal from "@/components/chatbox/media-viewer-modal"
import { createPortal } from "react-dom"

type TSelectImageModalProps = {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  selectedImages: number
  onImagesChange: (count: number) => void
  asOverlay?: boolean
  // new prop: nếu true thì modal sẽ có kích thước/ style giống ReportModal (centered, card)
  matchReportSize?: boolean
}

const MAX_IMAGES = 5

export const SelectImageModal = ({
  isOpen,
  onClose,
  onBack,
  selectedImages,
  onImagesChange,
  asOverlay = true,
  matchReportSize = false,
}: TSelectImageModalProps) => {
  const [images, setImages] = useState<File[]>([])
  const [isClosing, setIsClosing] = useState(false)
  const [showLimitMessage, setShowLimitMessage] = useState(false)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const closeTimeoutRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // sync count upward
  useEffect(() => {
    onImagesChange(images.length)
  }, [images, onImagesChange])

  // cleanup timeout and object URLs
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
      // Cleanup object URLs to prevent memory leaks
      images.forEach((image) => {
        URL.revokeObjectURL(URL.createObjectURL(image))
      })
    }
  }, [images])

  const handleAddImage = () => {
    if (images.length >= MAX_IMAGES) return
    // Trigger file input click
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newImages: File[] = []
    const totalSelected = files.length
    let addedCount = 0
    let skippedCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      // Check if file is an image
      if (file.type.startsWith("image/")) {
        if (images.length + newImages.length < MAX_IMAGES) {
          newImages.push(file)
          addedCount++
        } else {
          skippedCount++
        }
      } else {
        skippedCount++
      }
    }

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages])
    }

    // Show message if some files were skipped
    if (skippedCount > 0 || addedCount < totalSelected) {
      setShowLimitMessage(true)
      setTimeout(() => setShowLimitMessage(false), 3000) // Hide after 3 seconds
    }

    // Reset file input
    event.target.value = ""
  }

  const handleContinue = () => {
    handleClose()
  }

  const handleClose = () => {
    setIsClosing(true)
    closeTimeoutRef.current = window.setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
    setShowImageViewer(true)
  }

  const handleImageViewerClose = () => {
    setShowImageViewer(false)
  }

  // Convert File[] to MediaItem[] for MediaViewerModal
  const mediaItems = images.map((file, index) => ({
    id: index,
    type: "IMAGE",
    mediaUrl: URL.createObjectURL(file),
    fileName: file.name,
    thumbnailUrl: URL.createObjectURL(file),
    createdAt: new Date().toISOString(),
    authorId: 1, // dummy value
  }))

  // Dummy user for MediaViewerModal
  const dummyUser = {
    id: 1,
    Profile: {
      fullName: "User",
      avatar: null,
    },
  } as any

  if (!isOpen && !isClosing) return null

  const innerContent = (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-regular-hover-card-cl">
        <IconButton
          aria-label="Back"
          className="text-regular-white-cl hover:text-regular-text-secondary-cl"
          onClick={onBack}
        >
          <ChevronLeft size={20} />
        </IconButton>
        <h2 className="text-regular-white-cl text-base font-medium">Attach Photos</h2>
        <IconButton
          aria-label="Close"
          className="text-regular-white-cl hover:text-regular-text-secondary-cl"
          onClick={handleClose}
        >
          <X size={20} />
        </IconButton>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto STYLE-styled-modal-scrollbar p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-regular-white-cl text-base font-medium mb-4">
              Image list ({images.length}/{MAX_IMAGES})
            </h3>
          </div>

          {/* Limit Message */}
          {showLimitMessage && (
            <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg p-3">
              <p className="text-yellow-300 text-sm">
                Maximum {MAX_IMAGES} images allowed. Some files were not added.
              </p>
            </div>
          )}

          {/* Selected Images Grid - 3 columns with Add Photo button integrated */}
          <div className="grid grid-cols-3 gap-4">
            {/* Render all images first */}
            {images.map((image, index) => (
              <div
                key={index}
                className="relative w-32 h-32 bg-regular-dark-gray-cl rounded-lg flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => handleImageClick(index)}
              >
                {/* Image Preview */}
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveImage(index)
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <Trash2 size={12} className="text-white" />
                </button>
              </div>
            ))}

            {/* Add Photo Button - always at the end of the grid */}
            {images.length < MAX_IMAGES && (
              <button
                onClick={handleAddImage}
                className="w-32 h-32 bg-regular-dark-gray-cl border-2 border-dashed border-regular-hover-card-cl rounded-lg flex flex-col items-center justify-center transition-colors hover:bg-regular-hover-card-cl cursor-pointer"
              >
                <Plus size={32} className="text-regular-white-cl mb-2" />
                <span className="text-regular-white-cl text-sm">Add Photo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Button - Fixed at bottom */}
      <div className="p-4 border-t border-regular-hover-card-cl flex-shrink-0">
        <button
          onClick={handleContinue}
          className="w-full py-3 px-4 rounded-lg font-medium text-base transition-colors bg-regular-violet-cl text-regular-white-cl hover:bg-regular-tooltip-bgcl"
        >
          Continue
        </button>
      </div>
    </>
  )

  // Nếu muốn giống ReportModal về diện tích (centered card)
  if (matchReportSize) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]"
        onClick={handleBackdropClick}
      >
        <div
          className={`bg-regular-black-cl rounded-lg w-full max-w-md mx-4 max-h-[95vh] flex flex-col border-2 border-regular-white-cl transition-all duration-300 ease-out relative ${
            isOpen && !isClosing ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          {innerContent}
        </div>
      </div>
    )
  }

  // slide-in overlay (hiện tại)
  if (asOverlay) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-end z-[60]"
        onClick={handleBackdropClick}
      >
        <div
          className={`bg-regular-black-cl rounded-l-lg w-full max-w-lg h-full flex flex-col border-2 border-regular-white-cl transition-all duration-300 ease-out ${
            isOpen && !isClosing ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
          }`}
          style={{
            transform: isOpen && !isClosing ? "translateX(0)" : "translateX(100%)",
            transition: "transform 300ms ease-out, opacity 300ms ease-out",
          }}
        >
          {innerContent}
        </div>
      </div>
    )
  }

  // embedded (như trước)
  return (
    <>
      <div
        className={`absolute inset-0 bg-regular-black-cl rounded-lg border-2 border-regular-white-cl transition-all duration-300 ease-out ${
          isOpen && !isClosing ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ minHeight: "100%" }}
      >
        {innerContent}
      </div>

      {/* Media Viewer Modal - rendered via Portal */}
      {showImageViewer &&
        createPortal(
          <MediaViewerModal
            isOpen={showImageViewer}
            onClose={handleImageViewerClose}
            mediaItems={mediaItems}
            initialIndex={selectedImageIndex}
            creator={dummyUser}
            recipient={dummyUser}
            showUserInfo={false}
            showActionButtons={false}
            showZoomControls={true}
          />,
          document.body
        )}
    </>
  )
}
