import { useAppSelector } from "./redux"
import { EAdminAuthStatus } from "@/utils/enums"

type TUseAdminAuthReturn = {
  adminAuthStatus: EAdminAuthStatus
}

export const useAdminAuth = (): TUseAdminAuthReturn => {
  const adminAuth = useAppSelector((state) => state.adminAuth)
  return adminAuth
}
