import { useState, useEffect } from "react"
import { EBanType } from "@/utils/enums"

interface BanUserModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (banType: EBanType, reason: string, banDuration?: number) => void
  reportedUserName: string
}

export const BanUserModal = ({
  isOpen,
  onClose,
  onConfirm,
  reportedUserName,
}: BanUserModalProps) => {
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
