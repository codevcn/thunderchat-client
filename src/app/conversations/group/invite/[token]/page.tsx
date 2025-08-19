"use client"

import { CustomAvatar, Spinner } from "@/components/materials"
import { groupChatService } from "@/services/group-chat.service"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { toaster } from "@/utils/toaster"
import { TGroupChatWithCreator } from "@/utils/types/be-api"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { STATIC_CHAT_BACKGROUND_URL } from "@/utils/UI-constants"
import { pureNavigator } from "@/utils/helpers"

export default function InvitePage() {
  const { token } = useParams()
  const [isFetchingGroupChat, setIsFetchingGroupChat] = useState<boolean>(false)
  const [isRequestingToJoinGroup, setIsRequestingToJoinGroup] = useState<boolean>(false)
  const [groupChat, setGroupChat] = useState<TGroupChatWithCreator>()
  const groupChatCreator = groupChat?.Creator
  const groupChatCreatorProfile = groupChatCreator?.Profile
  const groupChatCreatorEmail = groupChatCreator?.email
  const groupChatCreatorAvatar = groupChatCreatorProfile?.avatar
  const groupChatCreatorFullName = groupChatCreatorProfile?.fullName

  const requestToJoinGroup = async () => {
    if (!groupChat) return
    try {
      setIsRequestingToJoinGroup(true)
      await groupChatService.createGroupJoinRequest(groupChat.id)
      toaster.success("Request to join group sent successfully")
    } catch (error) {
      toaster.error(axiosErrorHandler.handleHttpError(error).message)
    } finally {
      setIsRequestingToJoinGroup(false)
    }
  }

  const fetchGroupChat = async () => {
    if (!token || typeof token !== "string") return
    setIsFetchingGroupChat(true)
    try {
      const res = await groupChatService.fetchGroupChatByInviteCode(token)
      if (!res) {
        toaster.error("Invite code is invalid or deprecated")
        return
      }
      setGroupChat(res)
    } catch (error) {
      toaster.error(axiosErrorHandler.handleHttpError(error).message)
    } finally {
      setIsFetchingGroupChat(false)
    }
  }

  const backToHome = () => {
    pureNavigator("/")
  }

  useEffect(() => {
    fetchGroupChat()
  }, [token])

  return (
    <div
      style={{ backgroundImage: `url(${STATIC_CHAT_BACKGROUND_URL})` }}
      className="flex flex-col justify-center items-center min-h-screen px-4 py-8 bg-regular-dark-gray-cl"
    >
      <div
        onClick={backToHome}
        className="fixed top-0 left-0 w-full py-4 px-6 flex items-center cursor-pointer"
      >
        <div className="w-12 h-12 p-4 rounded-full bg-regular-violet-cl">
          <svg
            className="-translate-x-2 -translate-y-2"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            height={40}
            width={40}
            fill="#fff"
            viewBox="11.53 1.39 41.08 61.26"
          >
            <path d="M52.5,2.2c0.3-0.4-0.1-0.9-0.5-0.8L26.1,7.2c-0.1,0-0.3,0.1-0.3,0.3L13.9,29.6c-0.2,0.4,0.1,0.9,0.6,0.8l6.5-1.4  c0.4-0.1,0.8,0.4,0.6,0.7l-8.4,16.7c-0.2,0.4,0.2,0.8,0.6,0.7l5.1-1.2c0.4-0.1,0.8,0.4,0.6,0.8l-7.9,15.2c-0.3,0.5,0.4,1,0.8,0.6  l20.8-18.8c0.4-0.3,0.1-1-0.4-0.9l-2.3,0.3c-0.5,0.1-0.8-0.4-0.5-0.8L42,24.9c0.3-0.4-0.1-0.9-0.5-0.8l-4.6,1  c-0.5,0.1-0.8-0.4-0.5-0.8L52.5,2.2z M19.3,26.3c0.1,0.2,0.4,0.3,0.7,0.3l2-0.4c0.9-0.2,1.8,0.1,2.3,0.8c0.6,0.7,0.6,1.7,0.2,2.5  l-6.7,13.3l2.2-0.5c0.9-0.2,1.8,0.1,2.3,0.8c0.5,0.7,0.6,1.7,0.2,2.5l-2.5,4.7C20,50.4,20,50.6,20,50.7v2.6c0,0.3-0.1,0.6-0.4,0.8  L14,59.2L21.4,45c0.2-0.4,0.2-0.8-0.1-1.1c-0.2-0.3-0.5-0.4-0.8-0.4c-0.1,0-0.2,0-0.2,0l-4.8,1.1l7.9-15.7c0.2-0.4,0.1-0.8-0.1-1.1  c-0.2-0.3-0.7-0.5-1.1-0.4l-6.1,1.3l9.9-18.4h1.4l-8.3,15.4C19.2,25.9,19.2,26.1,19.3,26.3z"></path>
          </svg>
        </div>
        <h1 className="text-xl font-bold ml-4">Thunder Chat</h1>
      </div>

      <div className="flex flex-col items-center justify-center min-w-[400px] text-white py-4 px-10 bg-regular-modal-board-bgcl rounded-lg">
        {isFetchingGroupChat ? (
          <div className="w-16 h-16 border-4 border-regular-violet-cl border-t-transparent rounded-full animate-spin"></div>
        ) : (
          groupChat && (
            <div className="flex flex-col items-center justify-center text-white p-4 max-w-md">
              {/* Profile Picture */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-b from-violet-300 to-violet-600 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">
                  {groupChat.name[0] + groupChat.name[1]}
                </span>
              </div>

              {/* Group Name */}
              <h2 className="text-2xl font-bold text-white mt-4">{groupChat.name}</h2>

              {/* Founder Info */}
              <div className="my-8 text-center">
                <p className="text-white text-base font-bold py-1 px-2 rounded-md bg-regular-dark-gray-cl">
                  Created by:
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <CustomAvatar
                    src={groupChatCreatorAvatar}
                    alt={groupChatCreatorFullName}
                    imgSize={50}
                    fallback={groupChatCreatorFullName?.[0]}
                    className="border border-regular-hover-card-cl"
                  />
                  <div className="flex flex-col">
                    <p className="text-white text-base font-bold">{groupChatCreatorFullName}</p>
                    <p className="text-white text-sm">{groupChatCreatorEmail}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 w-full mt-4">
                <button
                  onClick={requestToJoinGroup}
                  disabled={isRequestingToJoinGroup}
                  className={`h-[44px] w-full bg-regular-violet-cl hover:bg-transparent hover:text-regular-violet-cl border-2 border-regular-violet-cl text-white font-semibold px-6 rounded-lg transition-colors ${
                    isRequestingToJoinGroup ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isRequestingToJoinGroup ? (
                    <Spinner size="medium" className="text-white m-auto" />
                  ) : (
                    <>
                      <span>Request to "</span>
                      <span>{groupChatCreatorFullName}</span>
                      <span>" join group</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
