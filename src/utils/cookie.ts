"use client"

export class ClientCookieManager {
  static genJWTCookieExpiresDate = (hours: number): string => {
    return new Date(Date.now() + hours * 60 * 60 * 1000).toUTCString()
  }

  static setAuthCookie = (token: string): void => {
    if (typeof document === "undefined") return
    document.cookie = `jwt_token_auth=${token}; expires=${this.genJWTCookieExpiresDate(3)}`
  }

  static getAuthCookie = (): string => {
    if (typeof document === "undefined") return ""
    return (
      document.cookie
        .split("; ")
        .find((c) => c.startsWith("jwt_token_auth="))
        ?.split("=")[1] || ""
    )
  }

  static deleteAuthCookie = (): void => {
    if (typeof document === "undefined") return
    console.log(">>> run this 25")
    document.cookie = "jwt_token_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC"
  }
}
