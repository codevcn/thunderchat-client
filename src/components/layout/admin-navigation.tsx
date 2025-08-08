"use client"

import {
  Home,
  Users,
  Shield,
  Settings,
  BarChart3,
  AlertTriangle,
  LogOut,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { memo, JSX } from "react"
import { CustomAvatar, CustomTooltip } from "../materials"
import { useAppDispatch } from "@/hooks/redux"
import { resetAdminAuthStatus } from "@/redux/auth/admin-auth.slice"
import { authService } from "@/services/auth.service"
import { EAdminAuthStatus } from "@/utils/enums"

type TAdminNav = {
  label: string
  href?: string
  icon: JSX.Element
  active?: boolean
}

type AdminNavigationProps = {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export const AdminNavigation = memo(({ activeTab, onTabChange }: AdminNavigationProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useAppDispatch()

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname === "/admin/admin-dashboard-management") return "dashboard-management"
    if (pathname === "/admin/admin-message-management") return "message-management"
    if (pathname === "/admin/admin-user-management") return "users"
    if (pathname === "/admin/admin-violation-management") return "violations"
    return "dashboard"
  }

  const currentActiveTab = activeTab || getActiveTab()

  const handleAdminLogout = async () => {
    try {
      await authService.logoutAdmin()
      dispatch(resetAdminAuthStatus())
      router.push("/")
    } catch (error) {
      console.error("Admin logout failed:", error)
      // Even if logout fails, redirect to main app
      dispatch(resetAdminAuthStatus())
      router.push("/")
    }
  }

  const adminNavs: TAdminNav[] = [
    {
      label: "Dashboard Management",
      href: "/admin/admin-dashboard-management",
      icon: <Home size={20} className="text-regular-white-cl" />,
      active: currentActiveTab === "dashboard-management",
    },
    {
      label: "Message Management",
      href: "/admin/admin-message-management",
      icon: <MessageSquare size={20} className="text-regular-white-cl" />,
      active: currentActiveTab === "message-management",
    },

    {
      label: "User Management",
      href: "/admin/admin-user-management",
      icon: <Users size={20} className="text-regular-white-cl" />,
      active: currentActiveTab === "users",
    },
    {
      label: "Violation Management",
      href: "/admin/admin-violation-management",
      icon: <AlertTriangle size={20} className="text-regular-white-cl" />,
      active: currentActiveTab === "violations",
    },
  ]

  return (
    <div className="screen-medium-chatting:flex hidden w-[55px] h-screen relative">
      <div className="flex justify-between flex-col gap-4 bg-regular-black-cl pt-6 pb-3 w-[inherit] h-[inherit]">
        {/* Admin Avatar */}
        <CustomTooltip title="Admin Panel" placement="right">
          <div className="flex w-[55px] cursor-pointer transition duration-200 hover:bg-regular-hover-card-cl py-3">
            <div className="m-auto">
              <CustomAvatar fallback={<Shield size={30} className="text-regular-white-cl" />} />
            </div>
          </div>
        </CustomTooltip>

        {/* Navigation Items */}
        <div className="flex items-center flex-col w-full">
          {adminNavs.map(({ label, href, icon, active }) => (
            <CustomTooltip key={label} placement="right" title={label}>
              {href ? (
                <Link
                  href={href}
                  className={`flex w-[55px] cursor-pointer transition duration-200 hover:bg-regular-hover-card-cl py-3 ${
                    active ? "bg-regular-hover-card-cl" : ""
                  }`}
                >
                  <div className="m-auto text-regular-white-cl">{icon}</div>
                </Link>
              ) : (
                <div
                  className={`flex w-[55px] cursor-pointer transition duration-200 hover:bg-regular-hover-card-cl py-3 ${
                    active ? "bg-regular-hover-card-cl" : ""
                  }`}
                  onClick={() => {
                    if (onTabChange) {
                      const tabMap: { [key: string]: string } = {
                        Dashboard: "dashboard",
                        "Message Stats": "message-stats",
                        "User Management": "users",
                        "Violation Management": "violations",
                      }
                      onTabChange(tabMap[label] || "dashboard")
                    }
                  }}
                >
                  <div className="m-auto text-regular-white-cl">{icon}</div>
                </div>
              )}
            </CustomTooltip>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-2">
          {/* Settings */}
          <CustomTooltip placement="right" title="Settings">
            <Link
              href="/admin/admin-settings"
              className="flex w-[55px] cursor-pointer transition duration-200 hover:bg-regular-hover-card-cl py-3"
            >
              <div className="m-auto">
                <Settings size={20} className="text-regular-white-cl" />
              </div>
            </Link>
          </CustomTooltip>

          {/* Admin Logout */}
          <CustomTooltip placement="right" title="Logout from Admin Panel">
            <div
              onClick={handleAdminLogout}
              className="flex w-[55px] cursor-pointer transition duration-200 hover:bg-regular-hover-card-cl py-3"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleAdminLogout()
                }
              }}
            >
              <div className="m-auto">
                <LogOut size={20} className="text-regular-white-cl" />
              </div>
            </div>
          </CustomTooltip>
        </div>
      </div>
      <div className="absolute top-0 right-0 min-w-[0.5px] h-full bg-regular-hover-card-cl"></div>
    </div>
  )
})
