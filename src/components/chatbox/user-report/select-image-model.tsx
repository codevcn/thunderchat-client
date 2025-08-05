// ... giữ lại các import cũ
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
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
  matchReportSize?: boolean
  // New props to persist selected images
  initialImages?: File[]
  onImagesUpdate?: (images: File[]) => void
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
  initialImages,
  onImagesUpdate,
}: TSelectImageModalProps) => {
  const [images, setImages] = useState<File[]>([])
  const [isClosing, setIsClosing] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const [showLimitMessage, setShowLimitMessage] = useState(false)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [shouldLoadImages, setShouldLoadImages] = useState(false)
  const closeTimeoutRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initializedRef = useRef(false)
  const imageUrlsRef = useRef<Map<File, string>>(new Map())

  // Handle opening animation and delay image loading
  useEffect(() => {
    if (isOpen && !isOpening) {
      setIsOpening(true)
      // Delay image loading until animation completes
      const timer = setTimeout(() => {
        setShouldLoadImages(true)
      }, 500) // Match animation duration

      return () => clearTimeout(timer)
    } else if (!isOpen) {
      setShouldLoadImages(false)
    }
  }, [isOpen, isOpening])

  // Reset shouldLoadImages when images are added (but respect animation delay)
  useEffect(() => {
    if (images.length > 0 && isOpening) {
      // Only force load if animation is already running
      const timer = setTimeout(() => {
        setShouldLoadImages(true)
      }, 300) // Same delay as animation

      return () => clearTimeout(timer)
    }
  }, [images.length, isOpening])

  // cleanup timeout and object URLs
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, []) // Empty dependency array - only run on unmount

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup all object URLs
      imageUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url)
      })
      imageUrlsRef.current.clear()
    }
  }, []) // Empty dependency array - only run on unmount

  // Initialize images from props when modal opens
  useEffect(() => {
    if (isOpen && initialImages && initialImages.length > 0) {
      setImages(initialImages)
      onImagesChange(initialImages.length)
    }
  }, [isOpen, initialImages, onImagesChange])

  // Memoized function to get or create image URL
  const getImageUrl = useCallback((file: File): string => {
    if (imageUrlsRef.current.has(file)) {
      return imageUrlsRef.current.get(file)!
    }

    const url = URL.createObjectURL(file)
    imageUrlsRef.current.set(file, url)
    return url
  }, [])

  // Memoized image grid to prevent unnecessary re-renders
  const imageGrid = useMemo(() => {
    if (!shouldLoadImages) {
      // Show skeleton loading while animation is running
      return images.map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="relative w-32 h-32 bg-regular-dark-gray-cl rounded-lg flex items-center justify-center overflow-hidden animate-pulse"
        >
          <div className="w-16 h-16 bg-regular-hover-card-cl rounded-full opacity-50"></div>
        </div>
      ))
    }

    return images.map((image, index) => (
      <div
        key={`${image.name}-${image.lastModified}-${index}`}
        className="relative w-32 h-32 bg-regular-dark-gray-cl rounded-lg flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => handleImageClick(index)}
      >
        {/* Lazy loaded image */}
        <img
          src={getImageUrl(image)}
          alt={`Image ${index + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
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
    ))
  }, [images, getImageUrl, shouldLoadImages])

  const handleAddImage = useCallback(() => {
    if (images.length >= MAX_IMAGES) return
    // Trigger file input click
    fileInputRef.current?.click()
  }, [images.length])

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files) return

      // Lọc ra các file là ảnh
      const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"))
      const totalAfterAdd = images.length + imageFiles.length

      if (imageFiles.length === 0) {
        // Không có file hợp lệ
        setShowLimitMessage(true)
        setTimeout(() => setShowLimitMessage(false), 3000)
        event.target.value = ""
        return
      }

      if (totalAfterAdd > MAX_IMAGES) {
        // Vượt quá số lượng cho phép, không thêm ảnh nào
        setShowLimitMessage(true)
        setTimeout(() => setShowLimitMessage(false), 3000)
        event.target.value = ""
        return
      }

      // Hợp lệ, thêm tất cả ảnh
      const updatedImages = [...images, ...imageFiles]
      setImages(updatedImages)
      onImagesChange(updatedImages.length)
      if (onImagesUpdate) {
        onImagesUpdate(updatedImages)
      }
      event.target.value = ""
    },
    [images, onImagesChange, onImagesUpdate]
  )

  const handleContinue = useCallback(() => {
    handleBack()
  }, [])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    closeTimeoutRef.current = window.setTimeout(() => {
      onClose() // Gọi onClose của ReportModal để thoát hoàn toàn
      setIsClosing(false)
    }, 400)
  }, [onClose])

  const handleBack = useCallback(() => {
    setIsClosing(true)
    closeTimeoutRef.current = window.setTimeout(() => {
      onBack()
      setIsClosing(false)
    }, 400)
  }, [onBack])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose()
      }
    },
    [handleClose]
  )

  const handleRemoveImage = useCallback(
    (index: number) => {
      const imageToRemove = images[index]
      const newImages = images.filter((_, i) => i !== index)

      // Cleanup URL for removed image
      if (imageUrlsRef.current.has(imageToRemove)) {
        URL.revokeObjectURL(imageUrlsRef.current.get(imageToRemove)!)
        imageUrlsRef.current.delete(imageToRemove)
      }

      setImages(newImages)
      onImagesChange(newImages.length)
      if (onImagesUpdate) {
        onImagesUpdate(newImages)
      }
    },
    [images, onImagesChange, onImagesUpdate]
  )

  const handleImageClick = useCallback((index: number) => {
    setSelectedImageIndex(index)
    setShowImageViewer(true)
  }, [])

  const handleImageViewerClose = useCallback(() => {
    setShowImageViewer(false)
  }, [])

  // Convert File[] to MediaItem[] for MediaViewerModal - memoized
  const mediaItems = useMemo(() => {
    return images.map((file, index) => ({
      id: index,
      type: "IMAGE",
      mediaUrl: getImageUrl(file),
      fileName: file.name,
      thumbnailUrl: getImageUrl(file),
      createdAt: new Date().toISOString(),
      authorId: 1, // dummy value
    }))
  }, [images, getImageUrl])

  // Dummy user for MediaViewerModal
  const dummyUser = useMemo(
    () =>
      ({
        id: 1,
        email: "dummy@example.com",
        password: "",
        createdAt: new Date(),
        role: "USER",
        Profile: {
          fullName: "User",
          avatar: null,
        },
      }) as any,
    []
  )

  if (!isOpen && !isClosing) return null

  const innerContent = (
    <div className="flex flex-col h-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header - Fixed */}
      <div className="flex items-center justify-between p-4 border-b border-regular-hover-card-cl flex-shrink-0">
        <IconButton
          aria-label="Back"
          className="text-regular-white-cl hover:text-regular-text-secondary-cl"
          onClick={handleBack}
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
                Maximum {MAX_IMAGES} images allowed. Please try again.
              </p>
            </div>
          )}

          {/* Selected Images Grid - 3 columns with Add Photo button integrated */}
          <div className="grid grid-cols-3 gap-4">
            {/* Render all images first */}
            {imageGrid}

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
    </div>
  )

  // Nếu muốn giống ReportModal về diện tích (centered card)
  if (matchReportSize) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]"
        onClick={handleBackdropClick}
      >
        <div
          className={`bg-regular-black-cl rounded-lg w-full max-w-md mx-4 max-h-[95vh] flex flex-col transition-all duration-300 ease-out relative ${
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
          className={`bg-regular-black-cl rounded-l-lg w-full max-w-lg h-full flex flex-col transition-all duration-300 ease-out ${
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
