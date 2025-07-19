import React, { useRef, useState, useEffect } from "react"

interface AvatarCropperModalProps {
  open: boolean
  image: string | null // base64 hoặc url
  onCancel: () => void
  onConfirm: (croppedDataUrl: string) => void
  uploading?: boolean
}

const MIN_RADIUS = 40
const MAX_RADIUS = 200

export const AvatarCropperModal: React.FC<AvatarCropperModalProps> = ({
  open,
  image,
  onCancel,
  onConfirm,
  uploading = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [circle, setCircle] = useState({ x: 150, y: 100, r: 80 })
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // Reset khi mở modal mới
  useEffect(() => {
    if (open && imgRef.current) {
      setCircle({ x: 150, y: 100, r: 80 })
    }
  }, [open, image])

  // Kéo hình tròn
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    setOffset({
      x: e.clientX - circle.x,
      y: e.clientY - circle.y,
    })
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    let newX = e.clientX - offset.x
    let newY = e.clientY - offset.y
    // Giới hạn không ra ngoài ảnh
    newX = Math.max(circle.r, Math.min(rect.width - circle.r, newX))
    newY = Math.max(circle.r, Math.min(rect.height - circle.r, newY))
    setCircle((c) => ({ ...c, x: newX, y: newY }))
  }
  const handleMouseUp = () => setDragging(false)

  // Phóng to/thu nhỏ hình tròn bằng wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    let newR = circle.r - e.deltaY / 10
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    newR = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, newR))
    // Không vượt quá biên ảnh
    newR = Math.min(newR, circle.x, rect.width - circle.x, circle.y, rect.height - circle.y)
    setCircle((c) => ({ ...c, r: newR }))
  }

  // Xử lý crop khi xác nhận
  const handleConfirm = () => {
    if (!imgRef.current || !containerRef.current) return
    const img = imgRef.current
    const container = containerRef.current

    // Kích thước container
    const cW = container.offsetWidth
    const cH = container.offsetHeight

    // Kích thước ảnh thực tế hiển thị trong container (object-fit: contain)
    const imgAR = img.naturalWidth / img.naturalHeight
    const containerAR = cW / cH
    let drawW = cW,
      drawH = cH,
      offsetX = 0,
      offsetY = 0
    if (imgAR > containerAR) {
      // Ảnh rộng hơn, fit theo width
      drawW = cW
      drawH = cW / imgAR
      offsetY = (cH - drawH) / 2
    } else {
      // Ảnh cao hơn, fit theo height
      drawH = cH
      drawW = cH * imgAR
      offsetX = (cW - drawW) / 2
    }

    // Tính scale giữa ảnh hiển thị và ảnh gốc
    const scale = img.naturalWidth / drawW

    // Tọa độ crop trên ảnh gốc
    const cropX = (circle.x - circle.r - offsetX) * scale
    const cropY = (circle.y - circle.r - offsetY) * scale
    const cropSize = circle.r * 2 * scale

    const canvas = document.createElement("canvas")
    canvas.width = cropSize
    canvas.height = cropSize
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.save()
    ctx.beginPath()
    ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, cropSize, cropSize)
    ctx.restore()
    const dataUrl = canvas.toDataURL("image/png")
    onConfirm(dataUrl)
  }

  if (!open || !image) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="bg-[#232526] rounded-xl shadow-2xl p-6 relative flex flex-col items-center">
        <div className="text-white text-lg font-semibold mb-2">Drag to Reposition</div>
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-lg"
          style={{ width: 400, height: 220, background: "#18191A" }}
          onWheel={handleWheel}
        >
          <img
            ref={imgRef}
            src={image}
            alt="avatar-crop"
            className="w-full h-full object-contain select-none pointer-events-none"
            draggable={false}
          />
          {/* Overlay vùng crop tròn */}
          <svg className="absolute left-0 top-0 w-full h-full" width={400} height={220}>
            <defs>
              <mask id="mask">
                <rect width="100%" height="100%" fill="white" />
                <circle cx={circle.x} cy={circle.y} r={circle.r} fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="#000" fillOpacity={0.6} mask="url(#mask)" />
            {/* Vùng crop tròn: cho phép kéo ở bất cứ vị trí nào bên trong */}
            <circle
              cx={circle.x}
              cy={circle.y}
              r={circle.r}
              fill="transparent"
              style={{ pointerEvents: "auto" }}
              className="cursor-move"
              onMouseDown={handleMouseDown}
            />
            {/* Viền trắng */}
            <circle
              cx={circle.x}
              cy={circle.y}
              r={circle.r}
              fill="none"
              stroke="#fff"
              strokeWidth={3}
              style={{ pointerEvents: "none" }}
            />
          </svg>
        </div>
        {/* Nút xác nhận và huỷ */}
        <div className="flex gap-6 mt-6">
          <button
            onClick={onCancel}
            disabled={uploading}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-[#2C2E31] hover:bg-red-500 transition text-white text-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="Huỷ"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={handleConfirm}
            disabled={uploading}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-violet-600 hover:bg-violet-700 transition text-white text-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="Xác nhận"
          >
            {uploading ? (
              <div className="animate-spin w-7 h-7 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Kéo để di chuyển, cuộn để phóng to/thu nhỏ vùng chọn
        </div>
      </div>
    </div>
  )
}

export default AvatarCropperModal
