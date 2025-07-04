import React from "react"
import { Ban } from "lucide-react"

export const Blocked = () => {
   return (
      <div className="mt-2 border-t border-regular-hover-card-cl border-solid pt-3">
         <div className="flex flex-col items-center gap-4 mt-8">
            <Ban className="w-16 h-16 text-regular-icon-cl" />
            <h3 className="text-lg font-medium text-regular-icon-cl text-center">
               No users have been blocked
            </h3>
            <p className="text-sm text-regular-icon-cl text-center max-w-[300px]">
               You can block other users by clicking the block icon in the chat
            </p>
         </div>
      </div>
   )
}
