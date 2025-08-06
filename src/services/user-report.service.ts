import { userReportAPI } from "@/apis/user-report"
import { EMessageTypes, EReportCategory } from "@/utils/enums"
import type {
  TCreateViolationReportData,
  TCreateViolationReportResponse,
  TReportedMessage,
} from "@/utils/types/be-api"
import type { TReportedMessageFE } from "@/utils/types/fe-api"

export class UserReportService {
  /**
   * Create a violation report
   * @param data - Report data
   * @param reportImages - Optional array of image files
   * @returns Promise<TCreateViolationReportResponse>
   */
  static async createViolationReport(
    data: TCreateViolationReportData,
    reportImages?: File[]
  ): Promise<TCreateViolationReportResponse> {
    return await userReportAPI.createViolationReport(data, reportImages)
  }

  /**
   * Convert frontend reported message to backend format
   * @param feMessage - Frontend reported message
   * @returns TReportedMessage
   */
  static convertToBackendMessage(feMessage: TReportedMessageFE): TReportedMessage {
    return {
      messageId: feMessage.messageId,
      messageType: feMessage.messageType as EMessageTypes,
      messageContent: feMessage.messageContent,
    }
  }

  /**
   * Convert frontend report data to backend format
   * @param feData - Frontend report data
   * @returns TCreateViolationReportData
   */
  static convertToBackendData(feData: {
    reportedUserId: number
    reportCategory: EReportCategory
    reasonText?: string
    reportedMessages?: TReportedMessageFE[]
  }): TCreateViolationReportData {
    // Sort reported messages by messageId (ascending) to ensure chronological order
    const sortedMessages = feData.reportedMessages?.sort((a, b) => a.messageId - b.messageId) || []

    return {
      reportedUserId: feData.reportedUserId,
      reportCategory: feData.reportCategory,
      reasonText: feData.reasonText,
      reportedMessages: sortedMessages.map((msg) => this.convertToBackendMessage(msg)),
    }
  }

  /**
   * Validate report data before submission
   * @param data - Report data to validate
   * @param reportImages - Optional image files
   * @returns { isValid: boolean, errors: string[] }
   */
  static validateReportData(
    data: TCreateViolationReportData,
    reportImages?: File[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate reported user ID
    if (!data.reportedUserId || data.reportedUserId <= 0) {
      errors.push("Invalid reported user ID")
    }

    // Validate report category
    if (!data.reportCategory) {
      errors.push("Report category is required")
    }

    // Validate reason text length
    if (data.reasonText && data.reasonText.length > 1000) {
      errors.push("Reason text must be less than 1000 characters")
    }

    // Validate reported messages count
    if (data.reportedMessages && data.reportedMessages.length > 10) {
      errors.push("Maximum 10 reported messages allowed")
    }

    // Validate reported messages content
    if (data.reportedMessages) {
      data.reportedMessages.forEach((msg, index) => {
        if (!msg.messageId || msg.messageId <= 0) {
          errors.push(`Message ${index + 1}: Invalid message ID`)
        }
        if (!msg.messageType) {
          errors.push(`Message ${index + 1}: Message type is required`)
        }
        if (!msg.messageContent) {
          errors.push(`Message ${index + 1}: Message content is required`)
        }
        if (msg.messageContent.length > 10000) {
          errors.push(`Message ${index + 1}: Message content must be less than 10000 characters`)
        }
      })
    }

    // Validate report images count
    if (reportImages && reportImages.length > 5) {
      errors.push("Maximum 5 report images allowed")
    }

    // Validate report images
    if (reportImages) {
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
      const maxSize = 10 * 1024 * 1024 // 10MB

      reportImages.forEach((image, index) => {
        if (!allowedMimeTypes.includes(image.type)) {
          errors.push(
            `Image ${index + 1}: Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed`
          )
        }
        if (image.size > maxSize) {
          errors.push(`Image ${index + 1}: File is too large. Maximum size is 10MB`)
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Handle API response and show appropriate messages
   * @param response - API response
   * @returns { success: boolean, message: string }
   */
  static handleResponse(response: TCreateViolationReportResponse): {
    success: boolean
    message: string
  } {
    if (response.success) {
      return {
        success: true,
        message: response.message || "Violation report created successfully",
      }
    } else {
      let errorMessage = response.error || "Failed to create violation report"

      // Handle specific error codes
      switch (response.code) {
        case "VALIDATION_ERROR":
          errorMessage = errorMessage || "Please check your input and try again"
          break
        case "MAX_IMAGES_EXCEEDED":
          errorMessage = errorMessage || "Maximum 5 report images allowed"
          break
        case "MAX_MESSAGES_EXCEEDED":
          errorMessage = errorMessage || "Maximum 10 reported messages allowed"
          break
        case "DUPLICATE_REPORT":
          errorMessage =
            errorMessage || "You have already reported this user within the last 24 hours"
          break
        case "INVALID_FILE_TYPE":
          errorMessage =
            errorMessage || "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed"
          break
        case "FILE_TOO_LARGE":
          errorMessage = errorMessage || "File is too large. Maximum size is 10MB"
          break
        case "FILE_NOT_FOUND":
          errorMessage = errorMessage || "File not found"
          break
        case "UPLOAD_FAILED":
          errorMessage = errorMessage || "Failed to upload file"
          break
        case "TRANSACTION_FAILED":
          errorMessage =
            errorMessage || "Failed to create violation report due to database transaction error"
          break
        case "NETWORK_ERROR":
          errorMessage = errorMessage || "Network error. Please check your connection and try again"
          break
        default:
          errorMessage = errorMessage || "An unexpected error occurred"
      }

      return {
        success: false,
        message: errorMessage,
      }
    }
  }
}
