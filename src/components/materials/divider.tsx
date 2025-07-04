import { cn } from "@/lib/utils"

type TDividerProps = Partial<{
   height: number
   textContent: string
   className: string
   textClassName: string
}>

export const Divider = ({ height, textContent, className, textClassName }: TDividerProps) => {
   return (
      <div
         className={cn("w-full relative bg-regular-divider-cl", className)}
         style={{ height: height || "1px" }}
      >
         {textContent && (
            <div
               className={cn(
                  "px-2 absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2",
                  textClassName
               )}
            >
               {textContent}
            </div>
         )}
      </div>
   )
}
