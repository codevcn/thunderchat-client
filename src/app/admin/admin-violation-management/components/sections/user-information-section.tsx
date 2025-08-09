import { Info } from "lucide-react"
import type { TAdminViolationReport } from "@/utils/types/be-api"

interface UserInformationSectionProps {
  violation: TAdminViolationReport
  onUserHistoryClick: (userId: number, userName: string, userEmail: string) => void
}

export const UserInformationSection = ({
  violation,
  onUserHistoryClick,
}: UserInformationSectionProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-regular-white-cl mb-4">User Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reporter Information */}
        <div className="bg-regular-hover-card-cl p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-regular-violet-cl font-medium">Reporter</h4>
            <button
              onClick={() =>
                onUserHistoryClick(
                  violation.reporterId,
                  violation.reporterName,
                  violation.reporterEmail
                )
              }
              className="text-regular-violet-cl hover:text-regular-tooltip-bgcl p-1 rounded hover:bg-regular-black-cl transition-colors"
              title="View report history"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
          <p className="text-regular-white-cl font-medium">{violation.reporterName}</p>
          <p className="text-regular-text-secondary-cl">{violation.reporterEmail}</p>
        </div>

        {/* Reported User Information */}
        <div className="bg-regular-hover-card-cl p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-regular-violet-cl font-medium">Reported User</h4>
            <button
              onClick={() =>
                onUserHistoryClick(
                  violation.reportedUserId,
                  violation.reportedUserName,
                  violation.reportedUserEmail
                )
              }
              className="text-regular-violet-cl hover:text-regular-tooltip-bgcl p-1 rounded hover:bg-regular-black-cl transition-colors"
              title="View report history"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
          <p className="text-regular-white-cl font-medium">{violation.reportedUserName}</p>
          <p className="text-regular-text-secondary-cl">{violation.reportedUserEmail}</p>
        </div>
      </div>
    </div>
  )
}
