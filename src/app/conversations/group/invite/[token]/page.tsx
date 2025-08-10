"use client"

import { groupChatService } from "@/services/group-chat.service"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { createPathWithParams, pureNavigator } from "@/utils/helpers"
import { toaster } from "@/utils/toaster"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function InvitePage() {
  const { token } = useParams()
  const [message, setMessage] = useState<string>()

  const joinGroup = async () => {
    if (!token || typeof token !== "string") return
    try {
      const res = await groupChatService.joinGroupChatByInviteLink(token)
      if (res.message) {
        toaster.info(res.message)
        setMessage(res.message)
      } else {
        pureNavigator(createPathWithParams("/conversations", { gid: `${res.groupChatId}` }))
      }
    } catch (error) {
      toaster.error(axiosErrorHandler.handleHttpError(error).message)
    }
  }

  useEffect(() => {
    joinGroup()
  }, [])

  return (
    <div className="flex flex-col justify-center items-center min-h-screen px-4 py-8 bg-regular-dark-gray-cl">
      {!message && (
        <div className="w-16 h-16 border-4 border-regular-violet-cl border-t-transparent rounded-full animate-spin"></div>
      )}
      <p className="text-base text-white mt-5">
        {message || "Checking your authentication status..."}
      </p>
    </div>
  )
}
