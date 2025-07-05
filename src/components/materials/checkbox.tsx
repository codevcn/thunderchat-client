import { Check } from "lucide-react"

type TCheckboxProps = {
  inputId: string
} & Partial<{
  onChange: (checked: boolean) => void
  inputName: string
  inputValue: string
  inputClassName: string
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
  defaultChecked,
  checked,
  readOnly,
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
        className={`${readOnly ? "pointer-events-none cursor-default" : ""} w-5 h-5 min-w-5 min-h-5 max-w-5 max-h-5 border border-[#4b5563] cursor-pointer rounded items-center justify-center`}
      >
        <span className="checkbox-checked-icon hidden">
          <Check className="w-[1.2rem] h-[1.2rem] text-white" />
        </span>
      </label>
    </>
  )
}
