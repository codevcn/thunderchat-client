import { useEffect, useState, useCallback } from "react"
import { useUser } from "./user"
import { userService } from "@/services/user.service"
import type { TUserWithProfileFE } from "@/utils/types/fe-api"

// Hook sử dụng userService để lấy dữ liệu profile
export const useUserProfile = (): {
  userProfile: TUserWithProfileFE | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} => {
  const user = useUser()
  const [userProfile, setUserProfile] = useState<TUserWithProfileFE | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!user?.email) return

    setLoading(true)
    setError(null)

    try {
      const profileData = await userService.getUserByEmail(user.email)
      setUserProfile({ ...user, Profile: profileData.Profile })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile")
    } finally {
      setLoading(false)
    }
  }, [user])

  // Fetch profile khi user thay đổi
  useEffect(() => {
    if (user?.email) {
      refetch()
    }
  }, [user?.email, refetch])

  return {
    userProfile,
    loading,
    error,
    refetch,
  }
}
