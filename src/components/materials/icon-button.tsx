import type { TPlacement } from "@/utils/types/global"
import { CustomTooltip } from "./tooltip"

type TIconButtonProps = {
   children: React.JSX.Element
} & Partial<{
   className: string
   onClick: (e: React.MouseEvent<HTMLDivElement>) => void
   title: {
      text: string
      placement?: TPlacement
   }
}>

export const IconButton = ({ children, className, onClick, title }: TIconButtonProps) => {
   return title ? (
      <CustomTooltip title={title.text} placement={title.placement}>
         <div
            className={`${className || ""} p-1.5 transition duration-200 hover:bg-regular-icon-btn-cl cursor-pointer rounded-full`}
            onClick={onClick}
         >
            {children}
         </div>
      </CustomTooltip>
   ) : (
      <div
         className={`${className || ""} p-1.5 transition duration-200 hover:bg-regular-icon-btn-cl cursor-pointer rounded-full`}
         onClick={onClick}
      >
         {children}
      </div>
   )
}
