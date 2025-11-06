"use client"

import React, { useState, useEffect } from "react"
import { AppNavigation } from "@/components/layout/app-navigation"
import { Bell, ShieldUser } from "lucide-react"
import { userSettingService } from "@/services/user-setting.service"
import { toaster } from "@/utils/toaster"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import {
  setOnlyReceiveFriendMessage,
  setPushNotificationEnabled,
  setSettings,
} from "@/redux/settings/settings.slice"
import { Spinner } from "@/components/materials"
import { usePushNotification } from "@/hooks/push-notification"

const Privacy = () => {
  const { onlyReceiveFriendMessage } = useAppSelector((state) => state.settings.privacy)
  const dispatch = useAppDispatch()

  const toggleOnlyReceiveFriendMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.currentTarget.checked
    userSettingService
      .updateUserSettings({ onlyReceiveFriendMessage: checked })
      .then(() => {
        dispatch(setOnlyReceiveFriendMessage(checked))
      })
      .catch((error) => {
        toaster.error(axiosErrorHandler.handleHttpError(error).message)
      })
  }

  return (
    <div className="w-full h-fit bg-regular-modal-board-bgcl border border-regular-border-cl rounded-2xl px-6 py-4 shadow-lg overflow-auto">
      <div className="font-bold text-xl text-regular-white-cl">Privacy</div>
      <div className="bg-regular-dark-gray-cl rounded-xl px-6 py-4 flex items-center justify-between gap-8 mt-4">
        <div>
          <h3 className="text-base text-regular-white-cl font-medium">
            Block messages from strangers
          </h3>
          <p className="text-xs text-regular-gray-cl mt-2 text-gray-400">
            When you enable this, you will not receive messages from people who are not your
            friends.
          </p>
        </div>
        <label
          className="relative inline-flex items-center cursor-pointer select-none"
          htmlFor="toggle-block-stranger"
        >
          <input
            id="toggle-block-stranger"
            type="checkbox"
            checked={onlyReceiveFriendMessage}
            onChange={toggleOnlyReceiveFriendMessage}
            className="sr-only peer"
            role="switch"
          />
          <div className="w-11 h-6 bg-regular-hover-bgcl peer-checked:bg-regular-violet-cl rounded-full transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-regular-violet-cl"></div>
          <div className="absolute left-1 top-1 w-4 h-4 bg-regular-white-cl rounded-full shadow-md transition-transform duration-200 peer-checked:translate-x-5"></div>
        </label>
      </div>
    </div>
  )
}

const Notification = () => {
  const { enabled } = useAppSelector((state) => state.settings.pushNotification)
  const dispatch = useAppDispatch()
  const { subscribe, unsubscribe, checkIfSupported } = usePushNotification()

  const togglePushNotification = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.currentTarget.checked
    if (checked) {
      const isSupported = await checkIfSupported()
      if (isSupported) {
        const sub = await subscribe()

        console.log("check sub", sub)
        if (sub && sub.subscriptionData) {
          dispatch(setPushNotificationEnabled(true))
        }
      } else {
        toaster.error("Push notification is not supported on this browser.")
      }
    } else {
      userSettingService
        .updateUserSettings({ pushNotificationEnabled: false })
        .then(() => {
          dispatch(setPushNotificationEnabled(false))
        })
        .catch((error) => {
          toaster.error(axiosErrorHandler.handleHttpError(error).message)
          dispatch(setPushNotificationEnabled(true)) // rollback nếu lỗi
        })
      await unsubscribe()
    }
  }

  return (
    <div className="w-full h-fit bg-regular-modal-board-bgcl border border-regular-border-cl rounded-2xl px-6 py-4 shadow-lg overflow-auto">
      <div className="font-bold text-xl text-regular-white-cl">Push Notifications</div>
      <div className="bg-regular-dark-gray-cl rounded-xl px-6 py-4 flex items-center justify-between gap-8 mt-4">
        <div>
          <h3 className="text-base text-regular-white-cl font-medium">
            Allow notifications from this app
          </h3>
          <p className="text-xs text-regular-gray-cl mt-2 text-gray-400">
            Receive important updates and messages from this app.
          </p>
        </div>
        <label
          className="relative inline-flex items-center cursor-pointer select-none"
          htmlFor="toggle-block-stranger"
        >
          <input
            id="toggle-block-stranger"
            type="checkbox"
            checked={enabled}
            onChange={togglePushNotification}
            className="sr-only peer"
            role="switch"
          />
          <div className="w-11 h-6 bg-regular-hover-bgcl peer-checked:bg-regular-violet-cl rounded-full transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-regular-violet-cl"></div>
          <div className="absolute left-1 top-1 w-4 h-4 bg-regular-white-cl rounded-full shadow-md transition-transform duration-200 peer-checked:translate-x-5"></div>
        </label>
      </div>
    </div>
  )
}

enum ESettingsTab {
  PRIVACY = "PRIVACY",
  NOTIFICATION = "NOTIFICATION",
}

const sidebarOptions = [
  {
    key: ESettingsTab.PRIVACY,
    label: "Privacy",
    icon: <ShieldUser size={20} />,
  },
  {
    key: ESettingsTab.NOTIFICATION,
    label: "Notification",
    icon: <Bell size={20} />,
  },
]

export default function UserSettingsPage() {
  const [selectedTab, setSelectedTab] = useState<ESettingsTab>(ESettingsTab.PRIVACY)
  const dispatch = useAppDispatch()
  const [isFetching, setIsFetching] = useState<boolean>(false)

  const fetchUserSettings = () => {
    if (selectedTab === ESettingsTab.PRIVACY) {
      setIsFetching(true)
      userSettingService
        .fetchUserSettings()
        .then((data) => {
          dispatch(setSettings(data))
        })
        .catch((error) => {
          toaster.error(axiosErrorHandler.handleHttpError(error).message)
        })
        .finally(() => {
          setIsFetching(false)
        })
    }
  }

  useEffect(() => {
    fetchUserSettings()
  }, [])

  return (
    <div className="flex h-screen bg-regular-black-cl text-regular-white-cl pl-[55px] screen-medium-chatting:pl-0">
      {/* AppNavigation ngoài cùng bên trái */}
      <AppNavigation />
      {/* SIDEBAR: option user settings */}
      <div className="flex flex-col min-w-[260px] bg-regular-dark-gray-cl border-r border-regular-border-cl px-4 py-6 shadow-[2px_0_16px_rgba(30,20,50,0.09)]">
        <div className="font-bold text-2xl text-regular-white-cl">Settings</div>
        <div className="flex flex-col gap-[2px] mt-6">
          {sidebarOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSelectedTab(ESettingsTab[opt.key])}
              className={`flex items-center font-medium text-base rounded-[10px] py-3 px-[18px] cursor-pointer relative transition-colors duration-200 gap-[14px] ${
                selectedTab === opt.key
                  ? "text-[var(--tdc-regular-violet-cl)] bg-[rgba(100,60,255,0.09)] shadow-[0_1px_4px_rgba(50,40,120,0.07)]"
                  : "text-[var(--tdc-regular-white-cl)]"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {/* MAIN CONTENT */}
      <div className="flex-1 flex justify-center bg-regular-black-cl min-h-screen px-4 py-6 screen-medium-chatting:px-12">
        {isFetching ? (
          <div className="flex-1 flex justify-center items-center">
            <Spinner size="large" />
          </div>
        ) : (
          <>
            {selectedTab === ESettingsTab.PRIVACY && <Privacy />}
            {selectedTab === ESettingsTab.NOTIFICATION && <Notification />}
          </>
        )}
      </div>
    </div>
  )
}
