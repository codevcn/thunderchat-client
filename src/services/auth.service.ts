import { getCheckAuth, postLoginUser } from "@/apis/auth"
import type { TUserWithProfile } from "@/utils/types/be-api"
import type { TSuccess } from "@/utils/types/global"

class AuthService {
  async checkAuth(): Promise<TUserWithProfile> {
    const { data } = await getCheckAuth()
    return data
  }

  async loginUser(email: string, password: string, keepSigned: boolean): Promise<TSuccess> {
    const { data } = await postLoginUser({ email, password, keepSigned })
    return data
  }
}

export const authService = new AuthService()
