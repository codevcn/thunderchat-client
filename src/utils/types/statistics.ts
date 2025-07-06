export type TMonthlyStatistics = {
   month: string
   totalChats: number
   totalMessages: number
   totalFiles: number
}

export type TOverallStatistics = {
   totalChats: number
   totalMessages: number
   totalFiles: number
   totalUsers: number
   avgMessagesPerChat: number
   avgFilesPerChat: number
}

export type TUserStatistics = {
   userId: number
   username: string
   chatsCreated: number
   messagesSent: number
   filesUploaded: number
   lastActivity: string
}

export type TTopUser = {
   userId: number
   username: string
   totalMessages: number
   totalFiles: number
   totalChats: number
}

export type TDashboardStatistics = {
   monthly: TMonthlyStatistics[]
   overall: TOverallStatistics
   topUsers: TTopUser[]
}

export type TStatisticsParams = {
   startDate: string
   endDate: string
}

export type TUserStatisticsParams = TStatisticsParams & {
   userId: number
}

export type TTopUsersParams = {
   limit: number
} 