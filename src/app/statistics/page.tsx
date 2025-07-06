"use client"

import { useEffect, useState } from "react"
import { useAppDispatch } from "@/hooks/redux"
import { fetchDashboardStatistics } from "@/redux/statistics/statistics.thunks"
import { StatisticsDashboard } from "@/components/statistics/statistics-dashboard"
import { StatisticsOverall } from "@/components/statistics/statistics-overall"
import { StatisticsUsers } from "@/components/statistics/statistics-users"
import { StatisticsTopUsers } from "@/components/statistics/statistics-top-users"

type TStatisticsTab = "dashboard" | "overall" | "users" | "top-users"

export default function StatisticsPage() {
   const dispatch = useAppDispatch()
   const [activeTab, setActiveTab] = useState<TStatisticsTab>("dashboard")

   useEffect(() => {
      // Load dashboard data khi vào trang
      dispatch(fetchDashboardStatistics())
   }, [dispatch])

   const tabs = [
      { id: "dashboard" as TStatisticsTab, label: "Dashboard", icon: "📊" },
      { id: "overall" as TStatisticsTab, label: "Tổng quan", icon: "📈" },
      { id: "users" as TStatisticsTab, label: "Người dùng", icon: "👥" },
      { id: "top-users" as TStatisticsTab, label: "Top Users", icon: "🏆" },
   ]

   const renderTabContent = () => {
      switch (activeTab) {
         case "dashboard":
            return <StatisticsDashboard />
         case "overall":
            return <StatisticsOverall />
         case "users":
            return <StatisticsUsers />
         case "top-users":
            return <StatisticsTopUsers />
         default:
            return <StatisticsDashboard />
      }
   }

   return (
      <div className="min-h-screen bg-gray-50 p-6">
         <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
               <h1 className="text-3xl font-bold text-gray-900 mb-2">Thống kê hệ thống</h1>
               <p className="text-gray-600">Theo dõi hoạt động và hiệu suất của hệ thống chat</p>
            </div>

            {/* Tabs */}
            <div className="mb-6">
               <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                     {tabs.map((tab) => (
                        <button
                           key={tab.id}
                           onClick={() => setActiveTab(tab.id)}
                           className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                              ? "border-blue-500 text-blue-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                              }`}
                        >
                           <span className="mr-2">{tab.icon}</span>
                           {tab.label}
                        </button>
                     ))}
                  </nav>
               </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow">
               {renderTabContent()}
            </div>
         </div>
      </div>
   )
} 