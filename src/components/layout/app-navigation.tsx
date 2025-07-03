"use client"

import { Home, Bell, Settings, MessageCircle, Users, User } from "lucide-react"
import Link from "next/link"
import { memo, JSX } from "react"
import { CustomAvatar, CustomTooltip } from "../materials"

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

export const AppNavigation = memo(() => {
   return (
      <div className="screen-medium-chatting:flex hidden w-[55px] h-screen relative">
         <div className="flex justify-between flex-col gap-4 bg-regular-dark-gray-cl pt-6 pb-3 w-[inherit] h-[inherit]">
            <CustomTooltip title="Account" placement="right">
               <Link
                  href="/account"
                  className="flex w-[55px] cursor-pointer transition duration-200 hover:bg-regular-hover-card-cl py-3"
               >
                  <div className="m-auto">
                     <CustomAvatar fallback={<User size={30} color="white" />} />
                  </div>
               </Link>
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
               <div className="flex w-[55px] cursor-pointer transition duration-200 hover:bg-regular-hover-card-cl py-3">
                  <div className="m-auto">
                     <Settings size={20} color="white" />
                  </div>
               </div>
            </CustomTooltip>
         </div>
         <div className="absolute top-0 right-0 min-w-[0.5px] h-full bg-regular-hover-card-cl"></div>
      </div>
   )
})
