"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { CustomPopover } from "@/components/materials"
import { cn } from "@/lib/utils"
import { Button } from "@/components/materials/button"
import { Calendar } from "@/components/materials/calendar"
import dayjs from "dayjs"

type TDatePickerProps = Partial<{
  initialDate: Date
  onDateChange: (date: Date) => void
  btnClassName: string
  withAnInput: boolean
  inputClassName: string
  inputPlaceholder: string
  inputName: string
  inputId: string
}>

export const DatePicker = ({
  initialDate,
  onDateChange,
  btnClassName,
  inputClassName,
  inputId,
  inputName,
  inputPlaceholder,
  withAnInput,
}: TDatePickerProps) => {
  const [date, setDate] = useState<Date | undefined>(initialDate)

  const handleDateChange = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (onDateChange && selectedDate) onDateChange(selectedDate)
  }

  return (
    <>
      {withAnInput && (
        <input
          type="text"
          placeholder={inputPlaceholder}
          name={inputName}
          className={inputClassName}
          id={inputId}
          value={date ? dayjs(date).format("DD/MM/YYYY") : ""}
          readOnly
          hidden
        />
      )}

      <CustomPopover
        trigger={
          <Button
            variant={"outline"}
            className={cn(`${btnClassName} DatePicker-input-button justify-between text-left`)}
          >
            {date ? format(date, "PPP") : <span>Pick a date</span>}
            <CalendarIcon />
          </Button>
        }
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateChange}
          captionLayout="dropdown"
        />
      </CustomPopover>
    </>
  )
}
