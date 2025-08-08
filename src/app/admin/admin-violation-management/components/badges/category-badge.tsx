import type { TViolationReportCategory } from "@/utils/types/be-api"

interface CategoryBadgeProps {
  category: TViolationReportCategory
}

export const CategoryBadge = ({ category }: CategoryBadgeProps) => {
  const categoryConfig = {
    SENSITIVE_CONTENT: { color: "bg-red-500/20 text-red-400", label: "Sensitive Content" },
    BOTHER: { color: "bg-yellow-500/20 text-yellow-400", label: "Harassment" },
    FRAUD: { color: "bg-orange-500/20 text-orange-400", label: "Fraud" },
    OTHER: { color: "bg-gray-500/20 text-gray-400", label: "Other" },
  }

  const config = categoryConfig[category]

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
      {config.label}
    </span>
  )
}
