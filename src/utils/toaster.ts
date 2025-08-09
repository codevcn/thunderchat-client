import { toast } from "sonner"

class CustomToaster {
  success(message: string) {
    toast.success(message, {
      duration: 3000,
      position: "bottom-right",
    })
  }

  error(message: string) {
    toast.error(message, {
      duration: 3000,
      position: "bottom-right",
    })
  }

  info(message: string) {
    toast.info(message, {
      duration: 3000,
      position: "bottom-right",
    })
  }

  warning(message: string) {
    toast.warning(message, {
      duration: 3000,
      position: "bottom-right",
    })
  }
}

export const toaster = new CustomToaster()
