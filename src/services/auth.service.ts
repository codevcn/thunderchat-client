import {
  getCheckAuth,
  postLoginUser,
  postAdminLogin,
  getAdminCheckAuth,
  checkEmailIsAdmin,
  postLogoutUser,
  postAdminLogout,
} from "@/apis/auth"
import { ClientCookieManager } from "@/utils/cookie"
import type { TLoginRes, TUserWithProfile } from "@/utils/types/be-api"
import type { TSocketId, TSuccess } from "@/utils/types/global"

class AuthService {
  async checkAuth(): Promise<TUserWithProfile> {
    const { data } = await getCheckAuth()
    return data
  }

  async loginUser(email: string, password: string, keepSigned: boolean): Promise<TLoginRes> {
    const { data } = await postLoginUser({ email, password, keepSigned })
    return data
  }

  async logoutUser(socketId: TSocketId): Promise<TSuccess> {
    const { data } = await postLogoutUser(socketId)
    ClientCookieManager.deleteAuthCookie()
    return data
  }
  // Admin methods
  async checkAdminAuth(): Promise<TUserWithProfile> {
    const { data } = await getAdminCheckAuth()
    return data
  }

  async loginAdmin(email: string, password: string, keepSigned: boolean): Promise<TLoginRes> {
    const { data } = await postAdminLogin({ email, password, keepSigned })
    return data
  }

  async logoutAdmin(): Promise<TSuccess> {
    const { data } = await postAdminLogout()
    ClientCookieManager.deleteAuthCookie()
    return data
  }

  // Check if email has admin privileges
  async checkEmailIsAdmin(email: string): Promise<boolean> {
    try {
      const { data } = await checkEmailIsAdmin(email)
      return data.isAdmin
    } catch (error) {
      return false
    }
  }
}

export const authService = new AuthService()
