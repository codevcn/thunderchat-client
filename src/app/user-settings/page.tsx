"use client"

import React, { useState, useEffect } from "react"
import { AppNavigation } from "@/components/layout/app-navigation"
import { UserCog } from "lucide-react"
import { userSettingService } from "@/services/user-setting.service"
import { toast } from "sonner"
import { toaster } from "@/utils/toaster"
import axiosErrorHandler from "@/utils/axios-error-handler"

type TToggleSwitchProps = {
  checked: boolean
  onChange: (v: boolean) => void
  labelId?: string
}

// Toggle switch component chuẩn Tailwind
function ToggleSwitch({ checked, onChange, labelId }: TToggleSwitchProps) {
  return (
    <label
      className="relative inline-flex items-center cursor-pointer select-none"
      htmlFor={labelId}
    >
      <input
        id={labelId}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
        role="switch"
        aria-checked={checked}
      />
      <div className="w-11 h-6 bg-regular-hover-bgcl peer-checked:bg-regular-violet-cl rounded-full transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-regular-violet-cl"></div>
      <div className="absolute left-1 top-1 w-4 h-4 bg-regular-white-cl rounded-full shadow-md transition-transform duration-200 peer-checked:translate-x-5"></div>
    </label>
  )
}

type TPrivacyContentProps = {
  onlyReceiveFriendMessage: boolean
  handleTogglePrivacy: (value: boolean) => void
}

// UI cho tab Quyền riêng tư
const PrivacyContent = ({
  onlyReceiveFriendMessage,
  handleTogglePrivacy,
}: TPrivacyContentProps) => {
  return (
    <div className="flex-1 flex justify-center bg-regular-black-cl min-h-screen px-16 py-8">
      <div className="w-full h-fit bg-regular-modal-board-bgcl border border-regular-border-cl rounded-2xl p-8 shadow-lg overflow-auto">
        <div className="font-bold text-xl text-regular-white-cl">Privacy</div>
        <div className="bg-regular-dark-gray-cl rounded-xl px-6 py-4 flex items-center justify-between gap-8 mt-6">
          <div>
            <h3 className="text-base text-regular-white-cl font-medium">
              Block messages from strangers
            </h3>
            <p className="text-xs text-regular-gray-cl mt-2 text-gray-400">
              When you enable this, you will not receive messages from people who are not your
              friends.
            </p>
          </div>
          <ToggleSwitch
            checked={onlyReceiveFriendMessage}
            onChange={(v) => handleTogglePrivacy(v)}
            labelId="toggle-block-stranger"
          />
        </div>
      </div>
    </div>
  )
}

type TSettingsLoadingItem = "only-receive-friend-message"

type TSettingsLoading = TSettingsLoadingItem[]

enum ESettingsTab {
  PRIVACY = "PRIVACY",
}

const sidebarOptions = [
  { key: ESettingsTab.PRIVACY, label: "Privacy", icon: <UserCog size={20} /> },
]

export default function UserSettingsPage() {
  const [selectedTab, setSelectedTab] = useState<ESettingsTab>(ESettingsTab.PRIVACY)
  const [onlyReceiveFriendMessage, setOnlyReceiveFriendMessage] = useState<boolean>(false)
  const [loading, setLoading] = useState<TSettingsLoading>([])

  // Hàm cập nhật trạng thái toggle
  const handleTogglePrivacy = (value: boolean) => {
    userSettingService
      .updateOnlyReceiveFriendMessage(value)
      .then(() => {
        setOnlyReceiveFriendMessage(value)
      })
      .catch((error) => {
        toaster.error(axiosErrorHandler.handleHttpError(error).message)
      })
  }

  const checkLoading = (key: TSettingsLoadingItem): boolean => {
    return loading?.includes(key) || false
  }

  const fetchSettingsPrivacy = () => {
    if (selectedTab === ESettingsTab.PRIVACY) {
      setLoading((prev) => [...prev, "only-receive-friend-message"])
      userSettingService
        .fetchUserSettings()
        .then((data) => {
          setOnlyReceiveFriendMessage(!!data.onlyReceiveFriendMessage)
        })
        .catch((error) => {
          toaster.error(axiosErrorHandler.handleHttpError(error).message)
        })
        .finally(() => {
          setLoading((prev) => prev.filter((item) => item !== "only-receive-friend-message"))
        })
    }
  }

  // Lấy trạng thái ban đầu khi mở tab Quyền riêng tư
  useEffect(() => {
    fetchSettingsPrivacy()
  }, [selectedTab])

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--tdc-regular-black-cl)",
        color: "var(--tdc-regular-white-cl)",
        fontFamily: "inherit",
        letterSpacing: 0.1,
      }}
    >
      {/* AppNavigation ngoài cùng bên trái */}
      <AppNavigation />
      {/* SIDEBAR: option user settings */}
      <div
        style={{
          minWidth: 260,
          background: "var(--tdc-regular-dark-gray-cl)",
          borderRight: "1px solid var(--tdc-regular-border-cl)",
          display: "flex",
          flexDirection: "column",
          padding: "32px 0 0 0",
          boxShadow: "2px 0 16px rgba(30,20,50,0.09)",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 22,
            color: "var(--tdc-regular-white-cl)",
            padding: "0 0 24px 32px",
            letterSpacing: 1,
          }}
        >
          Settings
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {sidebarOptions.map((opt) => (
            <div
              key={opt.key}
              onClick={() => setSelectedTab(ESettingsTab[opt.key])}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontWeight: 500,
                fontSize: 17,
                color:
                  selectedTab === opt.key
                    ? "var(--tdc-regular-violet-cl)"
                    : "var(--tdc-regular-white-cl)",
                background: selectedTab === opt.key ? "rgba(100,60,255,0.09)" : "none",
                borderRadius: 10,
                margin: "0 16px",
                padding: "12px 18px",
                cursor: "pointer",
                boxShadow: selectedTab === opt.key ? "0 1px 4px rgba(50,40,120,0.07)" : "none",
                transition: "background 0.2s, color 0.2s",
                position: "relative",
              }}
            >
              {opt.icon}
              {opt.label}
            </div>
          ))}
        </div>
      </div>
      {/* MAIN CONTENT */}
      {selectedTab === ESettingsTab.PRIVACY && (
        <PrivacyContent
          onlyReceiveFriendMessage={onlyReceiveFriendMessage}
          handleTogglePrivacy={handleTogglePrivacy}
        />
      )}
    </div>
  )
}
