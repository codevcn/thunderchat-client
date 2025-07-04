import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { forwardRef } from "react"

type TTextFieldProps = Partial<{
   type: React.HTMLInputTypeAttribute
   classNames: Partial<{
      wrapper: string
      input: string
      prefixIcon: string
      suffixIcon: string
   }>
   name: string
   inputId: string
   suffixIcon: React.ReactNode
   prefixIcon: React.ReactNode
   placeholder: string
   onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
   onPressEnter: (e: React.KeyboardEvent<HTMLInputElement>) => void
   onClear: () => void
}>

export const TextField = forwardRef<HTMLInputElement | null, TTextFieldProps>(
   (
      {
         type,
         classNames,
         inputId,
         name,
         suffixIcon,
         prefixIcon,
         placeholder,
         onPressEnter,
         onChange,
         onClear,
      }: TTextFieldProps,
      ref
   ) => {
      const catchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
         if (e.key === "Enter") {
            if (onPressEnter) {
               onPressEnter(e)
            }
         }
      }

      return (
         <div className={cn("relative border-b border-gray-500", classNames?.wrapper)}>
            {prefixIcon && (
               <div className="absolute left-1 top-1/2 -translate-y-1/2">{prefixIcon}</div>
            )}
            <input
               type={type || "text"}
               className={cn(
                  "peer/input placeholder:text-regular-placeholder-cl bg-transparent px-2 py-1 outline-none boder-none",
                  classNames?.input
               )}
               id={inputId}
               name={name}
               placeholder={placeholder}
               onKeyDown={catchEnter}
               onChange={onChange}
               ref={ref}
            />
            {(suffixIcon || onClear) && (
               <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  {onClear ? <X className="w-4 h-4" onClick={onClear} /> : suffixIcon}
               </div>
            )}
            <span className="peer-focus/input:scale-x-100 absolute left-0 bottom-0 w-full scale-x-0 border-b-[1.5px] border-regular-violet-cl transition"></span>
         </div>
      )
   }
)
