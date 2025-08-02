import { EAdminMessages } from "./enums"

export class AdminErrorHandler {
  static handleAdminError(errorMessage: string): string {
    // Xử lý các trường hợp lỗi admin cụ thể
    if (errorMessage.includes(EAdminMessages.ADMIN_ACCESS_REQUIRED)) {
      return "Access denied. This account does not have admin privileges."
    } else if (errorMessage.includes(EAdminMessages.INVALID_ADMIN_CREDENTIALS)) {
      return "Invalid admin credentials. Please check your email and password."
    } else if (errorMessage.includes(EAdminMessages.ADMIN_NOT_FOUND)) {
      return "Admin account not found. Please contact system administrator."
    } else if (errorMessage.includes(EAdminMessages.USER_NOT_AUTHENTICATED)) {
      return "Authentication failed. Please try logging in again."
    } else {
      return errorMessage
    }
  }

  static handleEmailCheckError(errorMessage: string): string {
    // Xử lý lỗi khi kiểm tra email có quyền admin không
    if (errorMessage.includes("not found") || errorMessage.includes("does not exist")) {
      return "Admin account not found. Please check the email or contact system administrator."
    } else if (errorMessage.includes("not admin") || errorMessage.includes("no admin privileges")) {
      return "Access denied. This email does not have admin privileges."
    } else if (errorMessage.includes("invalid email")) {
      return "Please enter a valid email address."
    } else {
      return "Unable to verify admin privileges. Please try again or contact system administrator."
    }
  }

  static isAdminError(errorMessage: string): boolean {
    return Object.values(EAdminMessages).some((message) => errorMessage.includes(message))
  }

  static getAdminErrorType(errorMessage: string): EAdminMessages | null {
    for (const [key, value] of Object.entries(EAdminMessages)) {
      if (errorMessage.includes(value)) {
        return value as EAdminMessages
      }
    }
    return null
  }
}
