import { clientAxios } from "@/configs/axios"
import type { TUploadFileRes } from "@/utils/types/be-api"

export const uploadFile = async (
  file: File,
  onUploadProgress?: (loaded: number, total?: number) => void
) => {
  const formData = new FormData()
  formData.append("file", file)
  return clientAxios.post<TUploadFileRes>("/upload", formData, {
    onUploadProgress: (progressEvent) => {
      onUploadProgress?.(progressEvent.loaded, progressEvent.total)
    },
  })
}
