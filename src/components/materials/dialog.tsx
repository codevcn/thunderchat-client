"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogOverlay = forwardRef<
   React.ComponentRef<typeof DialogPrimitive.Overlay>,
   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
   <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
         "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
         className
      )}
      {...props}
   />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = forwardRef<
   React.ComponentRef<typeof DialogPrimitive.Content>,
   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
   <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
         ref={ref}
         className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
            className
         )}
         {...props}
      >
         {children}
      </DialogPrimitive.Content>
   </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
   <div
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
   />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
   <div
      className={cn(
         "flex flex-col sm:flex-row items-center sm:justify-end sm:space-x-2",
         className
      )}
      {...props}
   />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = forwardRef<
   React.ComponentRef<typeof DialogPrimitive.Title>,
   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
   <DialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
   />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = forwardRef<
   React.ComponentRef<typeof DialogPrimitive.Description>,
   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
   <DialogPrimitive.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
   />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

type TCustomDialogProps = {
   open: boolean
   dialogBody: React.JSX.Element
   trigger?: React.JSX.Element
   dialogHeader?: {
      title: string
      description: string
      classNames?: {
         title?: string
         description?: string
      }
   }
   onHideShow?: (open: boolean) => void
}

const CustomDialog = ({
   trigger,
   open,
   dialogBody,
   dialogHeader,
   onHideShow,
}: TCustomDialogProps) => {
   return (
      <Dialog open={open} onOpenChange={onHideShow}>
         <DialogTrigger asChild={!!trigger}>{trigger}</DialogTrigger>
         <DialogContent className="xs:max-w-[350px] sm:max-w-[400px] md:max-w-[600px] lg:max-w-[900px] bg-regular-modal-board-bgcl rounded-lg border-none outline-none">
            <DialogHeader hidden={!dialogHeader}>
               <DialogTitle
                  className={cn("text-regular-white-cl", dialogHeader?.classNames?.title)}
               >
                  {dialogHeader?.title || ""}
               </DialogTitle>
               <DialogDescription
                  className={cn("text-regular-icon-cl", dialogHeader?.classNames?.description)}
               >
                  {dialogHeader?.description || ""}
               </DialogDescription>
            </DialogHeader>
            {dialogBody}
            {onHideShow && (
               <DialogFooter className="translate-y-2 w-full">
                  <button
                     className="flex gap-1 items-center w-fit border-2 text-sm border-gray-500 border-solid px-5 py-1 rounded-[5px] text-regular-white-cl hover:bg-regular-icon-btn-cl"
                     onClick={() => onHideShow(false)}
                  >
                     <X className="h-4 w-4" />
                     <span>Close</span>
                  </button>
               </DialogFooter>
            )}
         </DialogContent>
      </Dialog>
   )
}

export { CustomDialog }
