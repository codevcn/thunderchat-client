"use client"

import { JSX, useEffect } from "react"
import { EAdminAuthStatus } from "@/utils/enums"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { authService } from "@/services/auth.service"
import { setAdminAuthStatus } from "@/redux/auth/admin-auth.slice"
import { setUser } from "@/redux/user/user.slice"

export const AdminAuthProvider = ({ children }: { children: JSX.Element }) => {
  const { adminAuthStatus } = useAppSelector((state) => state.adminAuth)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (
      adminAuthStatus === EAdminAuthStatus.UNAUTHENTICATED ||
      adminAuthStatus === EAdminAuthStatus.UNKNOWN
    ) {
      authService
        .checkAdminAuth()
        .then((res) => {
          if (res) {
            dispatch(setAdminAuthStatus(EAdminAuthStatus.AUTHENTICATED))
            dispatch(setUser(res))
          } else {
            dispatch(setAdminAuthStatus(EAdminAuthStatus.UNAUTHENTICATED))
          }
        })
        .catch(() => {
          dispatch(setAdminAuthStatus(EAdminAuthStatus.UNAUTHENTICATED))
        })
    }
  }, [])

  return children
}
