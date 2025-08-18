"use client"

import { Home, Settings, MessageCircle, Users } from "lucide-react"
import Link from "next/link"
import { memo, JSX, useEffect, useState } from "react"
import { CounterBadge, CustomAvatar, CustomTooltip } from "../materials"
import { useAccountModal } from "@/contexts/account-modal.context"
import { useUser } from "@/hooks/user"
import { useAppSelector } from "@/hooks/redux"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"
import type { TGetFriendRequestsData, TUserWithProfile } from "@/utils/types/be-api"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { usePathname, useRouter } from "next/navigation"
import { ETabs } from "@/app/friends/sharing"
import { toast } from "sonner"

type TNav = {
  label: string
  href: string
  icon: JSX.Element
  counter?: number
}

const navs = (unreadFriendRequestsCount: number): TNav[] => [
  {
    label: "Home",
    href: "/",
    icon: <Home size={20} color="white" />,
  },
  {
    label: "Conversations",
    href: "/conversations",
    icon: <MessageCircle size={20} color="white" />,
  },
  {
    label: "Friends",
    href: "/friends",
    icon: <Users size={20} color="white" />,
    counter: unreadFriendRequestsCount,
  },
]

export const AppNavigation = memo(() => {
  const { openAccount } = useAccountModal()
  const user = useUser()!
  const userProfile = user.Profile
  const openConvsList = useAppSelector((state) => state.layout.openConvsList)
  const pathname = usePathname()
  const [unreadFriendRequestsCount, setUnreadFriendRequestsCount] = useState<number>(0)
  const router = useRouter()

  const listenFriendRequest = (userData: TUserWithProfile, requestData: TGetFriendRequestsData) => {
    const { Profile, email } = userData
    handleSetUnreadFriendRequestsCount()
    eventEmitter.emit(EInternalEvents.SEND_FRIEND_REQUEST, requestData)
    toast(`User "${Profile?.fullName || email}" sent you an add friend request`, {
      action: {
        label: "View",
        onClick: () => {
          router.push(`/friends?action=${ETabs.ADD_FRIEND_REQUESTS}`)
        },
      },
    })
  }

  const handleSetUnreadFriendRequestsCount = () => {
    if (pathname !== "/friends") {
      setUnreadFriendRequestsCount((prev) => prev + 1)
    } else {
      setUnreadFriendRequestsCount(0)
    }
  }

  useEffect(() => {
    setUnreadFriendRequestsCount(0)
  }, [pathname])

  useEffect(() => {
    clientSocket.socket.on(ESocketEvents.send_friend_request, listenFriendRequest)
    return () => {
      clientSocket.socket.removeListener(ESocketEvents.send_friend_request, listenFriendRequest)
    }
  }, [])

  return (
    <div
      style={{ left: openConvsList ? "0" : "-55px" }}
      className="flex top-0 left-0 fixed screen-medium-chatting:static z-[99] w-[55px] h-screen transition-[left] duration-200"
    >
      <div className="flex justify-between flex-col relative gap-4 bg-regular-dark-gray-cl pt-6 pb-3 w-[inherit] h-[inherit]">
        <CustomTooltip title="Account" placement="right">
          <div
            className="flex w-[55px] cursor-pointer transition duration-200 hover:bg-regular-hover-card-cl py-3"
            onClick={openAccount}
          >
            <div className="m-auto">
              <CustomAvatar
                src={userProfile.avatar}
                fallback={userProfile.fullName[0]}
                alt={userProfile.fullName}
                imgSize={40}
                className="text-xl border border-gray-700 font-bold bg-regular-violet-cl"
              />
            </div>
          </div>
        </CustomTooltip>

        <div className="flex items-center flex-col w-full">
          {navs(unreadFriendRequestsCount).map(({ label, href, icon, counter }) => (
            <CustomTooltip key={label} placement="right" title={label}>
              <Link
                href={href}
                className="flex w-[55px] cursor-pointer relative transition duration-200 hover:bg-regular-hover-card-cl py-3"
              >
                {!!counter && counter > 0 && (
                  <CounterBadge
                    count={counter}
                    className="absolute top-0.5 right-1 rounded-md py-0.5 px-1.5"
                  />
                )}
                <div className="m-auto text-white">{icon}</div>
              </Link>
            </CustomTooltip>
          ))}
        </div>

        <CustomTooltip placement="right" title="Settings">
          <Link
            href="/user-settings"
            className="flex w-[55px] cursor-pointer transition duration-200 hover:bg-regular-hover-card-cl py-3"
          >
            <div className="m-auto">
              <Settings size={20} color="white" />
            </div>
          </Link>
        </CustomTooltip>
        <div className="absolute top-0 right-0 w-[1px] h-full bg-gray-600/20"></div>
      </div>
    </div>
  )
})
