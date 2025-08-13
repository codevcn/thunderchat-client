import { clientAxios } from "@/configs/axios"
import { requestConfig } from "@/configs/axios"
import type {
  TCreateViolationReportData,
  TCreateViolationReportResponse,
  TReportedMessage,
} from "@/utils/types/be-api"

// Re-export types for convenience
export type {
  TCreateViolationReportData as CreateViolationReportData,
  TCreateViolationReportResponse as CreateViolationReportResponse,
  TReportedMessage as ReportedMessage,
}

// API Functions
export const userReportAPI = {
  /**
   * Create a violation report
   * @param data - Report data
   * @param reportImages - Optional array of image files
   * @returns Promise<CreateViolationReportResponse>
   */
  createViolationReport: async (
    data: TCreateViolationReportData,
    reportImages?: File[]
  ): Promise<TCreateViolationReportResponse> => {
    try {
      const formData = new FormData()

      // Add text data
      formData.append("reportedUserId", data.reportedUserId.toString())
      formData.append("reportCategory", data.reportCategory)

      if (data.reasonText) {
        formData.append("reasonText", data.reasonText)
      }

      if (data.reportedMessages && data.reportedMessages.length > 0) {
        // Gửi từng message như một field riêng biệt
        data.reportedMessages.forEach((message, index) => {
          formData.append(`reportedMessages[${index}][messageId]`, message.messageId.toString())
          formData.append(`reportedMessages[${index}][messageType]`, message.messageType)
          formData.append(`reportedMessages[${index}][messageContent]`, message.messageContent)
        })
      }

      // Add image files
      if (reportImages && reportImages.length > 0) {
        reportImages.forEach((image) => {
          formData.append("reportImages", image)
        })
      }

      const response = await clientAxios.post<TCreateViolationReportResponse>(
        "/user-report/create-violation-report",
        formData,
        requestConfig
      )

      return response.data
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data) {
        return error.response.data
      }

      // Handle network or other errors
      return {
        success: false,
        error: error.message || "Failed to create violation report",
        code: "NETWORK_ERROR",
        details: { originalError: error.message },
      }
    }
  },
}
