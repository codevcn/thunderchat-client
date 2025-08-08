import { StatusBadge, CategoryBadge } from "../badges"
import type { TAdminViolationReport } from "@/utils/types/be-api"

interface BasicInformationSectionProps {
  violation: TAdminViolationReport
}

export const BasicInformationSection = ({ violation }: BasicInformationSectionProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-regular-white-cl mb-4">Basic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-regular-text-secondary-cl text-sm mb-2">Report ID</p>
          <p className="text-regular-white-cl">#{violation.id}</p>
        </div>
        <div>
          <p className="text-regular-text-secondary-cl text-sm mb-2">Status</p>
          <StatusBadge status={violation.status} />
        </div>
        <div>
          <p className="text-regular-text-secondary-cl text-sm mb-2">Category</p>
          <CategoryBadge category={violation.reportCategory} />
        </div>
        <div>
          <p className="text-regular-text-secondary-cl text-sm mb-2">Reported Date</p>
          <p className="text-regular-white-cl">{new Date(violation.createdAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
