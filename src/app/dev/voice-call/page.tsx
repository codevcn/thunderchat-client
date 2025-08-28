"use client"

import { useEffect, useState } from "react"
import { VoiceCall } from "@/app/conversations/direct-chat/voice-call"
import { TDirectChatData } from "@/utils/types/be-api"
import { directChatService } from "@/services/direct-chat.service"

export default function VoiceCallPage() {
  const [directChat, setDirectChat] = useState<TDirectChatData | null>(null)

  const fetchDirectChat = async () => {
    directChatService.fetchDirectChat(49).then((res) => {
      setDirectChat(res)
    })
  }

  useEffect(() => {
    fetchDirectChat()
  }, [])

  return (
    <div className="w-screen h-screen STYLE-styled-scrollbar overflow-y-auto flex flex-col items-center justify-center gap-8">
      <a href="/conversations" className="p-2 bg-red-600 text-white rounded-md">
        Back
      </a>
      <div className="flex flex-col gap-2">
        <span>
          Direct Chat ID: <span className="font-bold">{directChat?.id}</span>
        </span>
        <span>
          Creator: <span className="font-bold">{directChat?.Creator.Profile.fullName}</span>
        </span>
        <span>
          Recipient: <span className="font-bold">{directChat?.Recipient.Profile.fullName}</span>
        </span>
      </div>
      {directChat && <VoiceCall canSend={true} directChat={directChat} />}
    </div>
  )
}
