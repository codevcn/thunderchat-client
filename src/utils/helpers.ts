import dayjs from "dayjs"
import type { TFormData } from "./types/global"
import DOMPurify from "dompurify"

export const setLastSeen = (date: string) => {
   return dayjs(date).format("MM/DD/YYYY, h:mm A")
}

export function isValueInEnum<T extends object>(value: string, enumObject: T): boolean {
   return Object.values(enumObject).includes(value)
}

export const getPathWithQueryString = (): string => {
   return window.location.pathname + window.location.search
}

export function extractFormData<T extends TFormData>(formEle: HTMLFormElement): T {
   const formData = new FormData(formEle)
   const data: any = {}

   for (const [key, value] of formData.entries()) {
      const currentValue = data[key]
      if (currentValue) {
         if (Array.isArray(currentValue)) {
            currentValue.push(value)
         } else {
            data[key] = [currentValue, value]
         }
      } else {
         data[key] = value
      }
   }

   return data
}

export const pureNavigator = (url: string) => {
   window.location.href = url
}

export const getCurrentLocationPath = (): string => {
   return window.location.pathname
}

export const santizeMsgContent = (htmlStr: string): string => {
   return DOMPurify.sanitize(htmlStr)
}

/**
 * Handle event delegation for dataset
 * @param e - React.MouseEvent<HTMLDivElement>
 * @param target - { datasetName: camelCase string, className?: string }
 * @returns dataset value or null if dataset not found
 */
export const handleEventDelegation = <R extends Record<string, any>>(
   e: React.MouseEvent<HTMLDivElement>,
   target: {
      datasetName: string
      className?: string
   }
): R | null => {
   const { datasetName, className } = target
   const element = e.target as HTMLElement
   let dataset = element.getAttribute(datasetName)
   if (dataset) {
      return JSON.parse(dataset)
   }
   const closest = element.closest<HTMLElement>(
      `${className ? `.${className}` : ""}[${datasetName}]`
   )
   if (closest) {
      const dataset = closest.getAttribute(datasetName)
      if (dataset) {
         return JSON.parse(dataset)
      }
   }
   return null
}

/**
 * Create a path with query parameters
 * @param path - The path to create the path with
 * @param params - The parameters to create the path with
 * @returns The path with the query parameters
 */
export const createPathWithParams = (path: string, params: Record<string, string>): string => {
   const queryParams = new URLSearchParams(params)
   return `${path}?${queryParams.toString()}`
}
