"use client"

import React, { useState, useEffect } from "react"
import { Lock, ArrowLeft } from "lucide-react"
import { AppNavigation } from "@/components/layout/app-navigation"
import { Settings as SettingsIcon, UserCog } from "lucide-react"
import { fetchUserSettings, updateUserSettingsService } from "@/services/user-setting.service"
import { toast } from "sonner" // Nếu đã có thư viện toast, nếu chưa có thì dùng alert

const sidebarOptions = [{ key: "privacy", label: "Privacy", icon: <UserCog size={20} /> }]

// Toggle switch component chuẩn Tailwind
function ToggleSwitch({
  checked,
  onChange,
  labelId,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  labelId?: string
}) {
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
        <div className="bg-regular-dark-gray-cl rounded-xl px-6 py-4 flex items-center justify-between gap-4 mt-6">
          <span className="text-base text-regular-white-cl font-medium">
            Block messages from strangers
          </span>
          <ToggleSwitch
            checked={onlyReceiveFriendMessage}
            onChange={handleTogglePrivacy}
            labelId="toggle-block-stranger"
          />
        </div>
      </div>
    </div>
  )
}

export default function UserSettingsPage() {
  const [selectedTab, setSelectedTab] = useState("privacy")
  const [onlyReceiveFriendMessage, setOnlyReceiveFriendMessage] = useState(false)
  const [loading, setLoading] = useState(false)

  // Lấy trạng thái ban đầu khi mở tab Quyền riêng tư
  useEffect(() => {
    if (selectedTab === "privacy") {
      setLoading(true)
      fetchUserSettings()
        .then((data) => {
          setOnlyReceiveFriendMessage(!!data.onlyReceiveFriendMessage)
        })
        .catch((error) => {
          console.error("Lỗi khi lấy trạng thái quyền riêng tư:", error)
          toast.error("Không lấy được trạng thái quyền riêng tư!")
        })
        .finally(() => setLoading(false))
    }
  }, [selectedTab])

  // Hàm cập nhật trạng thái toggle
  const handleTogglePrivacy = (value: boolean) => {
    setOnlyReceiveFriendMessage(value)
    updateUserSettingsService(value)
      .then(() => {
        toast.success("Cập nhật thành công!")
      })
      .catch((error) => {
        console.error("Lỗi khi cập nhật trạng thái quyền riêng tư:", error)
        toast.error("Cập nhật thất bại!")
      })
  }

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
              onClick={() => setSelectedTab(opt.key)}
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
      {selectedTab === "privacy" && (
        <PrivacyContent
          onlyReceiveFriendMessage={onlyReceiveFriendMessage}
          handleTogglePrivacy={handleTogglePrivacy}
        />
      )}
    </div>
  )
}
