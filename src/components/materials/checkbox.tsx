import { Check } from "lucide-react"

type TCheckboxProps = {
   inputId: string
} & Partial<{
   onChange: (checked: boolean) => void
   inputName: string
   inputValue: string
   inputClassName: string
}>

export const Checkbox = ({
   onChange,
   inputName,
   inputId,
   inputValue,
   inputClassName,
}: TCheckboxProps) => {
   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
         onChange(e.target.checked)
      }
   }

   return (
      <>
         <input
            type="checkbox"
            id={inputId}
            name={inputName}
            hidden
            readOnly
            value={inputValue}
            className={`${inputClassName} checkbox-input`}
            onChange={handleChange}
         />
         <label
            htmlFor={inputId}
            className="border border-[#4b5563] cursor-pointer w-5 h-5 rounded items-center justify-center"
         >
            <span className="checkbox-checked-icon hidden">
               <Check className="w-[1.2rem] h-[1.2rem] text-white" />
            </span>
         </label>
      </>
   )
}
