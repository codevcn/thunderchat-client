import type { TUserWithProfile } from "@/utils/types/be-api"
import { useAppSelector } from "./redux"

type TUseUserReturn = TUserWithProfile | null

export const useUser = (): TUseUserReturn => {
  const user = useAppSelector(({ user }) => user.user)
  return user
}
