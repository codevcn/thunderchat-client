import { clientAxios } from "@/configs/axios"

export const uploadFile = async (
  file: File
): Promise<{ url: string; fileName: string; fileType: string }> => {
  const formData = new FormData()
  formData.append("file", file)

  try {
    const { data } = await clientAxios.post("/upload", formData)
    return data
  } catch (error: any) {
    console.error("Upload error:", error?.response?.data || error)
    throw error
  }
}
