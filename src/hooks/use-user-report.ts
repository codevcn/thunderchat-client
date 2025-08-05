import { useState, useCallback } from "react"
import { UserReportService } from "@/services/user-report.service"
import type {
  TCreateViolationReportData,
  TCreateViolationReportResponse,
} from "@/utils/types/be-api"
import type { TReportedMessageFE } from "@/utils/types/fe-api"
import type { EReportCategory } from "@/utils/enums"

export const useUserReport = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const createViolationReport = useCallback(
    async (data: TCreateViolationReportData, reportImages?: File[]) => {
      setIsSubmitting(true)
      setError(null)
      setSuccess(null)

      try {
        // Validate data
        const validation = UserReportService.validateReportData(data, reportImages)
        if (!validation.isValid) {
          setError(validation.errors.join(", "))
          return { success: false, error: validation.errors.join(", ") }
        }

        // Submit report
        const response = await UserReportService.createViolationReport(data, reportImages)
        const result = UserReportService.handleResponse(response)

        if (result.success) {
          setSuccess(result.message)
          return { success: true, message: result.message }
        } else {
          setError(result.message)
          return { success: false, error: result.message }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsSubmitting(false)
      }
    },
    []
  )

  const convertToBackendData = useCallback(
    (feData: {
      reportedUserId: number
      reportCategory: EReportCategory
      reasonText?: string
      reportedMessages?: TReportedMessageFE[]
    }) => {
      return UserReportService.convertToBackendData(feData)
    },
    []
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearSuccess = useCallback(() => {
    setSuccess(null)
  }, [])

  const clearAll = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  return {
    createViolationReport,
    convertToBackendData,
    isSubmitting,
    error,
    success,
    clearError,
    clearSuccess,
    clearAll,
  }
}
