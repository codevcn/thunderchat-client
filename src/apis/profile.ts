import { clientAxios } from "@/configs/axios"

export const getProfile = async () => {
  const { data } = await clientAxios.get("/profile")
  return data
}

export const updateProfile = async (profileData: {
  fullName?: string
  birthday?: string
  about?: string
  avatar?: string
}) => {
  const { data } = await clientAxios.put("/profile/update", profileData, { withCredentials: true })
  return data
}
