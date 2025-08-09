import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

type TCheckboxProps = {
  inputId: string
} & Partial<{
  onChange: (checked: boolean) => void
  inputName: string
  inputValue: string
  inputClassName: string
  labelClassName: string
  labelIconSize: number
  defaultChecked: boolean
  checked: boolean
  readOnly: boolean
}>

export const Checkbox = ({
  onChange,
  inputName,
  inputId,
  inputValue,
  inputClassName,
  labelClassName,
  defaultChecked,
  checked,
  readOnly,
  labelIconSize,
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
        defaultChecked={defaultChecked}
        checked={checked}
      />
      <label
        htmlFor={inputId}
        className={cn(
          `${readOnly && "pointer-events-none cursor-default"} inline-block w-5 h-5 min-w-5 min-h-5 max-w-5 max-h-5 border border-[#4b5563] cursor-pointer rounded items-center justify-center`,
          labelClassName
        )}
      >
        <span className="checkbox-checked-icon hidden">
          <Check size={labelIconSize || 19} className="text-white" />
        </span>
      </label>
    </>
  )
}
