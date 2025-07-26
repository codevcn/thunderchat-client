"use client"

import React, { useState, useEffect } from "react"
import { Lock, ArrowLeft } from "lucide-react"
import { AppNavigation } from "@/components/layout/app-navigation"
import {
  Monitor,
  Bell,
  MessageCircle,
  Settings as SettingsIcon,
  UserCog,
  Puzzle,
} from "lucide-react"
import { fetchUserSettings, updateUserSettingsService } from "@/services/user-setting.service"
import { toast } from "sonner" // Nếu đã có thư viện toast, nếu chưa có thì dùng alert

const sidebarOptions = [
  { key: "general", label: "Cài đặt chung", icon: <SettingsIcon size={20} /> },
  { key: "privacy", label: "Quyền riêng tư", icon: <UserCog size={20} /> },
  { key: "appearance", label: "Giao diện", icon: <Monitor size={20} />, badge: "Beta" },
  { key: "notification", label: "Thông báo", icon: <Bell size={20} /> },
  { key: "message", label: "Tin nhắn", icon: <MessageCircle size={20} /> },
  { key: "utility", label: "Tiện ích", icon: <Puzzle size={20} /> },
]

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

export default function UserSettingsPage() {
  const [selectedTab, setSelectedTab] = useState("general")
  const [onlyReceiveFriendMessage, setOnlyReceiveFriendMessage] = useState(false)
  const [suggestMention, setSuggestMention] = useState(true)
  const [findSticker, setFindSticker] = useState(true)
  const [loading, setLoading] = useState(false)
  const [suggestSticker, setSuggestSticker] = useState(true) // Để riêng cho tab Tiện ích

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

  // UI cho tab Tiện ích
  const utilityContent = (
    <div className="flex-1 flex items-center justify-center bg-regular-black-cl min-h-screen">
      <div className="w-full max-w-[600px] min-w-[320px] min-h-[340px] max-h-[90vh] bg-regular-modal-board-bgcl border border-regular-border-cl rounded-2xl p-8 shadow-lg flex flex-col gap-8 overflow-auto">
        {/* Group: Gợi ý Sticker */}
        <div className="mb-2">
          <div className="font-bold text-lg text-regular-white-cl mb-2">Gợi ý Sticker</div>
          <div className="bg-regular-dark-gray-cl rounded-xl px-6 py-4 flex items-center justify-between mb-2 gap-4">
            <span className="text-base text-regular-white-cl font-medium">
              Hiện gợi ý Sticker phù hợp với nội dung tin nhắn đang soạn
            </span>
            <ToggleSwitch
              checked={suggestSticker}
              onChange={(v) => setSuggestSticker(v)}
              labelId="toggle-suggest-sticker"
            />
          </div>
        </div>
        {/* Group: Gợi ý @ */}
        <div>
          <div className="font-bold text-lg text-regular-white-cl mb-2">Gợi ý @</div>
          <div className="flex flex-col gap-4">
            {/* Option: Gợi ý nhắc tên */}
            <div className="bg-regular-dark-gray-cl rounded-xl px-6 py-4 flex items-center gap-4">
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "#e74c3c" }}
              >
                <svg width="22" height="22" fill="white" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base text-regular-white-cl">Gợi ý nhắc tên</div>
                <div className="text-sm text-gray-400 mt-1">
                  Gợi ý nhắc tên theo nội dung đang soạn
                </div>
              </div>
              <ToggleSwitch
                checked={suggestMention}
                onChange={(v) => setSuggestMention(v)}
                labelId="toggle-suggest-mention"
              />
            </div>
            {/* Option: Tìm sticker */}
            <div className="bg-regular-dark-gray-cl rounded-xl px-6 py-4 flex items-center gap-4">
              <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-regular-violet-cl">
                <svg width="22" height="22" fill="white" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <text x="12" y="16" textAnchor="middle" fontSize="12" fill="#fff">
                    :)
                  </text>
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base text-regular-white-cl">Tìm sticker</div>
                <div className="text-sm text-gray-400 mt-1">Gõ từ khóa để tìm Sticker</div>
              </div>
              <ToggleSwitch
                checked={findSticker}
                onChange={(v) => setFindSticker(v)}
                labelId="toggle-find-sticker"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // UI cho tab Quyền riêng tư
  const privacyContent = (
    <div className="flex-1 flex items-center justify-center bg-regular-black-cl min-h-screen">
      <div className="w-full max-w-[600px] min-w-[320px] min-h-[340px] max-h-[90vh] bg-regular-modal-board-bgcl border border-regular-border-cl rounded-2xl p-8 shadow-lg flex flex-col gap-8 overflow-auto">
        <div className="font-bold text-xl text-regular-white-cl mb-4">Quyền riêng tư</div>
        <div className="bg-regular-dark-gray-cl rounded-xl px-6 py-4 flex items-center justify-between gap-4">
          <span className="text-base text-regular-white-cl font-medium">
            Chặn tin nhắn từ người lạ
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
          Cài đặt
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
              {opt.badge && (
                <span
                  style={{
                    background: "var(--tdc-regular-violet-cl)",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 6,
                    padding: "2px 8px",
                    marginLeft: 8,
                    letterSpacing: 0.5,
                  }}
                >
                  Beta
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* MAIN CONTENT */}
      {selectedTab === "utility" && utilityContent}
      {selectedTab === "privacy" && privacyContent}
    </div>
  )
}
