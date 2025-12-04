"use client"

import { JSX, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { userSettingService } from "@/services/user-setting.service"
import { setSettings } from "@/redux/settings/settings.slice"
import { EAuthStatus } from "@/utils/enums"

export const UserSettingsProvider = ({ children }: { children: JSX.Element }) => {
  const { authStatus } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (authStatus === EAuthStatus.AUTHENTICATED) {
      userSettingService
        .fetchUserSettings()
        .then((settings) => {
          dispatch(setSettings(settings))
          console.log(" User settings loaded globally:", settings)
        })
        .catch((err) => {
          console.error(" Failed to load user settings:", err)
        })
    }
  }, [authStatus, dispatch])

  return children
}
