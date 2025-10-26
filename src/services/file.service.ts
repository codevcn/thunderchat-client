import { uploadFile, uploadMultipleFiles } from "@/apis/upload"
import type { TUploadFileRes, TUploadMultipleFilesResult } from "@/utils/types/be-api"
import axios from "axios"

export class FileService {
  static async downloadFile(
    mediaUrl: string,
    onDownloadProgress?: (loaded: number, total?: number) => void
  ) {
    return await axios.get(mediaUrl, {
      responseType: "blob",
      onDownloadProgress: (progressEvent) => {
        onDownloadProgress?.(progressEvent.loaded, progressEvent.total)
      },
    })
  }

  static async uploadFile(
    file: File,
    onUploadProgress?: (loaded: number, total?: number) => void
  ): Promise<TUploadFileRes> {
    const { data } = await uploadFile(file, onUploadProgress)
    return data
  }

  static async uploadMultipleFiles(
    files: File[],
    onUploadProgress?: (loaded: number, total?: number) => void
  ): Promise<TUploadMultipleFilesResult> {
    const { data } = await uploadMultipleFiles(files, onUploadProgress)
    return data
  }
}
