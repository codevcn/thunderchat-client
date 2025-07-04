"use client"

import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"
import type { TPlacement } from "@/utils/types/global"
import { forwardRef } from "react"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = forwardRef<
   React.ComponentRef<typeof TooltipPrimitive.Content>,
   React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
   <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
         ref={ref}
         sideOffset={sideOffset}
         className={cn(
            "overflow-hidden rounded-md bg-regular-tooltip-bgcl px-3 py-1.5 text-sm text-white animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
         )}
         style={{ zIndex: 999 }}
         {...props}
      />
   </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

type TCustomTooltipProps = {
   children: React.JSX.Element
   title: string
   placement?: TPlacement
   align?: "center" | "start" | "end"
   arrow?: boolean
}

const CustomTooltip = ({
   children,
   title,
   placement = "bottom",
   align = "center",
   arrow = true,
}: TCustomTooltipProps) => {
   return (
      <TooltipProvider delayDuration={300}>
         <Tooltip>
            <TooltipTrigger className="h-fit cursor-auto">{children}</TooltipTrigger>
            <TooltipContent side={placement} align={align}>
               {title}
               {arrow && (
                  <TooltipPrimitive.Arrow className="fill-current text-regular-tooltip-bgcl" />
               )}
            </TooltipContent>
         </Tooltip>
      </TooltipProvider>
   )
}

export { CustomTooltip }
