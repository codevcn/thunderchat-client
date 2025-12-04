import { clientAxios } from "@/configs/axios"
import type { TUploadFileRes, TUploadMultipleFilesResult } from "@/utils/types/be-api"

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

export const uploadMultipleFiles = async (
  files: File[],
  onUploadProgress?: (loaded: number, total?: number) => void
) => {
  console.log("[multe]")
  const formData = new FormData()
  for (const file of files) {
    formData.append("files", file)
  }
  return clientAxios.post<TUploadMultipleFilesResult>("/upload/multiple-files", formData, {
    onUploadProgress: (progressEvent) => {
      onUploadProgress?.(progressEvent.loaded, progressEvent.total)
    },
  })
}
