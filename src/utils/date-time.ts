import dayjs from "dayjs"
import { ETimeFormats } from "./enums"

enum EMonths {
   JAN = 1,
   FEB,
   MAR,
   APR,
   MAY,
   JUN,
   JUL,
   AUG,
   SEP,
   OCT,
   NOV,
   DEC,
}

export const getDaysInMonth = (month: EMonths, year: number = -1): number[] => {
   const monthWith31Days = [1, 3, 5, 7, 8, 10, 12]
   const days =
      month === 2 ? (isLeapYear(year) ? 29 : 28) : monthWith31Days.includes(month) ? 31 : 30
   return Array.from(Array(days).keys()).map((num) => num + 1)
}

export const isLeapYear = (year: number): boolean => {
   if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) return true
   return false
}

export const getYearsList = (gap: number, endYear: number = new Date().getFullYear()): number[] => {
   const years_set: number[] = []

   for (let i = endYear - gap; i < endYear; i++) {
      years_set.push(i)
   }

   return years_set
}

export const displayMessageStickyTime = (
   currentMsgTime: Date | string,
   preMsgTime?: Date | string
): string | null => {
   const currDate = dayjs(currentMsgTime)
   if (preMsgTime) {
      const preDate = dayjs(preMsgTime)
      const today = dayjs()
      if (preDate.isSame(today, "day") && currDate.isSame(today, "day")) {
         if (currDate.diff(preDate, "minute") < 30) {
            return null
         }
         return currDate.format(ETimeFormats.HH_mm)
      }
      if (currDate.diff(preDate, "hour") < 1) {
         return null
      }
   }
   return currDate.format(ETimeFormats.MMMM_DD_YYYY)
}

export const displayTimeDifference = (originalTime: Date | string): string => {
   const now = dayjs()
   const convertedTime = dayjs(originalTime)
   const diffInMinutes = now.diff(convertedTime, "minute")

   if (diffInMinutes < 1) {
      return "Just now"
   }
   if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`
   }
   const diffInHours = now.diff(convertedTime, "hour")
   if (diffInHours < 24) {
      return `${diffInHours} hours ago`
   }
   const diffInDays = now.diff(convertedTime, "day")
   if (diffInDays < 31) {
      return `${diffInDays} days ago`
   }
   return convertedTime.format(ETimeFormats.MMMM_DD_YYYY)
}
