import { getProfile, updateProfile } from "@/apis/profile"

class ProfileService {
  getProfile = getProfile
  updateProfile = updateProfile
}

export const profileService = new ProfileService()
