"use client"

import { Home, Settings, MessageCircle, Users } from "lucide-react"
import Link from "next/link"
import { memo, JSX } from "react"
import { CustomAvatar, CustomTooltip } from "../materials"
import { useAccountModal } from "@/contexts/account-modal.context"
import { useUser } from "@/hooks/user"
import { useAppSelector } from "@/hooks/redux"

type TNav = {
  label: string
  href?: string
  icon: JSX.Element
}

const navs: TNav[] = [
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
  },
]

export const AppNavigation = memo(() => {
  const { openAccount } = useAccountModal()
  const user = useUser()!
  const userProfile = user.Profile
  const openConvsList = useAppSelector((state) => state.layout.openConvsList)

  return (
    <div
      style={{ left: openConvsList ? "0" : "-55px" }}
      className="flex top-0 left-0 fixed screen-medium-chatting:static z-[99] w-[55px] h-screen transition-[left] duration-200"
    >
      <div className="flex justify-between flex-col gap-4 bg-regular-dark-gray-cl pt-6 pb-3 w-[inherit] h-[inherit]">
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
          {navs.map(({ label, href, icon }) => (
            <CustomTooltip key={label} placement="right" title={label}>
              {href ? (
                <Link
                  href={href}
                  className="flex w-[55px] cursor-pointer transition duration-200 hover:bg-regular-hover-card-cl py-3"
                >
                  <div className="m-auto text-white">{icon}</div>
                </Link>
              ) : (
                <div className="flex w-[55px] cursor-pointer transition duration-200 hover:bg-regular-hover-card-cl py-3">
                  <div className="m-auto">{icon}</div>
                </div>
              )}
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
      </div>
      <div className="absolute top-0 right-0 min-w-[0.5px] h-full bg-regular-hover-card-cl"></div>
    </div>
  )
})
