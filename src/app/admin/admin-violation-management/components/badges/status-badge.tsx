import { Clock, CheckCircle2, X } from "lucide-react"
import type { TViolationReportStatus } from "@/utils/types/be-api"
import { EViolationReportStatus } from "@/utils/enums"

interface StatusBadgeProps {
  status: TViolationReportStatus
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig = {
    [EViolationReportStatus.PENDING]: {
      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      icon: Clock,
    },
    [EViolationReportStatus.RESOLVED]: {
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      icon: CheckCircle2,
    },
    [EViolationReportStatus.DISMISSED]: {
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      icon: X,
    },
  }

  const config = statusConfig[status]
  const IconComponent = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${config.color}`}
    >
      <IconComponent size={14} />
      {status}
    </span>
  )
}
