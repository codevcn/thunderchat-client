import { useState } from "react"
import { X, ChevronLeft, Plus } from "lucide-react"
import { IconButton } from "@/components/materials/icon-button"

type TSelectImageModalProps = {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  selectedImages: number
  onImagesChange: (count: number) => void
}

export const SelectImageModal = ({
  isOpen,
  onClose,
  onBack,
  selectedImages,
  onImagesChange,
}: TSelectImageModalProps) => {
  const [images, setImages] = useState<File[]>([])
  const [isClosing, setIsClosing] = useState(false)

  const handleAddImage = () => {
    // TODO: Implement file picker
    console.log("Add image clicked")
    // Simulate adding an image
    if (images.length < 5) {
      const newImage = new File([""], "image.jpg", { type: "image/jpeg" })
      setImages([...images, newImage])
      onImagesChange(images.length + 1)
    }
  }

  const handleContinue = () => {
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

  if (!isOpen && !isClosing) return null

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
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-regular-hover-card-cl">
          <IconButton
            className="text-regular-white-cl hover:text-regular-text-secondary-cl"
            onClick={onBack}
          >
            <ChevronLeft size={20} />
          </IconButton>
          <h2 className="text-regular-white-cl text-base font-medium">Attach Photos</h2>
          <IconButton
            className="text-regular-white-cl hover:text-regular-text-secondary-cl"
            onClick={handleClose}
          >
            <X size={20} />
          </IconButton>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto STYLE-styled-modal-scrollbar p-6 space-y-6">
          {/* Image List Label */}
          <div>
            <h3 className="text-regular-white-cl text-base font-medium mb-4">
              Image list ({selectedImages}/5)
            </h3>
          </div>

          {/* Add Image Button */}
          <div className="flex justify-center">
            <button
              onClick={handleAddImage}
              disabled={selectedImages >= 5}
              className={`w-32 h-32 bg-regular-dark-gray-cl border-2 border-dashed border-regular-hover-card-cl rounded-lg flex flex-col items-center justify-center transition-colors ${
                selectedImages >= 5
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-regular-hover-card-cl cursor-pointer"
              }`}
            >
              <Plus size={32} className="text-regular-white-cl mb-2" />
              <span className="text-regular-white-cl text-sm">Add Photo</span>
            </button>
          </div>

          {/* Selected Images Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="aspect-square bg-regular-dark-gray-cl rounded-lg flex items-center justify-center"
                >
                  <span className="text-regular-text-secondary-cl text-sm">Image {index + 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="p-4 border-t border-regular-hover-card-cl">
          <button
            onClick={handleContinue}
            className="w-full py-3 px-4 rounded-lg font-medium text-base transition-colors bg-regular-violet-cl text-regular-white-cl hover:bg-regular-tooltip-bgcl"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
