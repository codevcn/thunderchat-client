import { useEffect, useState } from "react"
import { useUser } from "./user"
import { userService } from "@/services/user.service"
import type { TUserWithProfileFE } from "@/utils/types/fe-api"

export const useUserProfile = (refreshKey?: number): TUserWithProfileFE | null => {
  const user = useUser()
  const [userProfile, setUserProfile] = useState<TUserWithProfileFE | null>(null)

  useEffect(() => {
    if (user?.email) {
      userService.getUserByEmail(user.email).then((profileData) => {
        setUserProfile({ ...user, Profile: profileData.Profile })
      })
    }
  }, [user, refreshKey]) // Thêm refreshKey vào dependency array

  return userProfile
}
