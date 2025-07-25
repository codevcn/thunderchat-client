import { toast } from "sonner"

class CustomToaster {
   success(message: string) {
      toast.success(message, {
         duration: 3000,
         position: "top-right",
      })
   }

   error(message: string) {
      toast.error(message, {
         duration: 3000,
         position: "top-right",
      })
   }

   info(message: string) {
      toast.info(message, {
         duration: 3000,
         position: "top-right",
      })
   }
}

export const toaster = new CustomToaster()
