"use client"

import { JSX, useEffect } from "react"
import { EAuthStatus } from "@/utils/enums"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { authService } from "@/services/auth.service"
import { setAuthStatus } from "@/redux/auth/auth.slice"
import { setUser } from "@/redux/user/user.slice"

export const AuthProvider = ({ children }: { children: JSX.Element }) => {
   const { authStatus } = useAppSelector((state) => state.auth)
   const dispatch = useAppDispatch()

   useEffect(() => {
      if (authStatus === EAuthStatus.UNAUTHENTICATED || authStatus === EAuthStatus.UNKNOWN) {
         authService
            .checkAuth()
            .then((res) => {
               if (res) {
                  dispatch(setAuthStatus(EAuthStatus.AUTHENTICATED))
                  dispatch(setUser(res))
               } else {
                  dispatch(setAuthStatus(EAuthStatus.UNAUTHENTICATED))
               }
            })
            .catch(() => {
               dispatch(setAuthStatus(EAuthStatus.UNAUTHENTICATED))
            })
      }
   }, [])

   return children
}
