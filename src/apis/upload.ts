import { clientAxios } from "@/configs/axios"

export const uploadFile = async (file: File): Promise<{ url: string }> => {
   const formData = new FormData()
   formData.append('file', file)

   const { data } = await clientAxios.post('/upload', formData, {
      headers: {
         'Content-Type': 'multipart/form-data',
      },
   })

   return data
} 