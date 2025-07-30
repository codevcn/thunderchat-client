"use client"

import { Home, Bell, Settings, MessageCircle, Users, User, Shield } from "lucide-react"
import Link from "next/link"
import { memo, JSX } from "react"
import { CustomAvatar, CustomTooltip } from "../materials"
import { useAccountModal } from "@/contexts/account-modal.context"
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
    label: "Notification",
    icon: <Bell size={20} color="white" />,
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

type AppNavigationProps = {
  // Có thể thêm các prop khác nếu cần
}

export const AppNavigation = memo((props: AppNavigationProps) => {
  const { openAccount } = useAccountModal()
  const user = useAppSelector((state) => state.user.user)

  // Check if user is admin (you can modify this logic based on your auth system)
  const isAdmin = user?.email === "trung@gmail.com"

  return (
    <div className="screen-medium-chatting:flex hidden w-[55px] h-screen relative">
      <div className="flex justify-between flex-col gap-4 bg-regular-dark-gray-cl pt-6 pb-3 w-[inherit] h-[inherit]">
        <CustomTooltip title="Account" placement="right">
          <div
            className="flex w-[55px] cursor-pointer transition duration-200 hover:bg-regular-hover-card-cl py-3"
            onClick={openAccount}
          >
            <div className="m-auto">
              <CustomAvatar fallback={<User size={30} color="white" />} />
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

          {/* Admin Link - Only show for admin users */}
          {isAdmin && (
            <CustomTooltip placement="right" title="Admin Panel">
              <Link
                href="/admin"
                className="flex w-[55px] cursor-pointer transition duration-200 hover:bg-regular-hover-card-cl py-3"
              >
                <div className="m-auto text-white">
                  <Shield size={20} color="white" />
                </div>
              </Link>
            </CustomTooltip>
          )}
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
