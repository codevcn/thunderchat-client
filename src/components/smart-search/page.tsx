"use client"
import { useState } from "react"
import SmartSearch, { TMember } from "./smart-search"

// (Bạn phải export type TMember từ file smart-search.tsx của bạn)

export default function SmartSearchPage() {
  // Dữ liệu giả (mock data) để test component
  // Trong ứng dụng thật, bạn sẽ thay bằng logic lấy dữ liệu thật
  const [mockMembers, setMockMembers] = useState<TMember[]>([
    {
      id: 1,
      email: "user1@example.com",
      Profile: { id: 101, fullName: "User Một", avatar: null },
    },
    {
      id: 2,
      email: "user2@example.com",
      Profile: {
        id: 102,
        fullName: "User Hai",
        avatar: "https://i.pravatar.cc/150?img=2",
      },
    },
  ])
  const [mockDirectChatId, setMockDirectChatId] = useState(123)

  const handleMessageClick = (messageId: number) => {
    console.log("Đã nhấn vào tin nhắn:", messageId)
    // Thêm logic để nhảy đến tin nhắn trong chat
  }

  // 2. Render component SmartSearch của bạn tại đây
  return (
    <div className="flex justify-center w-full h-full p-4 bg-gray-800">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-4">Tìm kiếm thông minh</h1>
        <SmartSearch
          members={mockMembers}
          directChatId={mockDirectChatId}
          onMessageClick={handleMessageClick}
        />
      </div>
    </div>
  )
}
