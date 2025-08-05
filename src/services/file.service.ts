import { uploadFile } from "@/apis/upload"
import type { TUploadFileRes } from "@/utils/types/be-api"
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
}
