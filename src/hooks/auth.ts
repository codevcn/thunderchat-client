import { useAppSelector } from "./redux"
import { EAuthStatus } from "@/utils/enums"

type TUseAuthReturn = {
   authStatus: EAuthStatus
}

export const useAuth = (): TUseAuthReturn => {
   const auth = useAppSelector((state) => state.auth)
   return auth
}
