import { useRef } from "react"

export const useDebounce = () => {
   const timer = useRef<NodeJS.Timeout>(undefined)
   return <P extends any[]>(handler: (...args: P) => void, delayInMs: number) => {
      return (...args: Parameters<typeof handler>) => {
         clearTimeout(timer.current)
         timer.current = setTimeout(() => {
            handler(...args)
         }, delayInMs)
      }
   }
}

export const useDebounceLeading = () => {
   const timer = useRef<NodeJS.Timeout>(undefined)
   return <P extends any[]>(handler: (...params: P) => void, delayInMs: number) =>
      (...args: Parameters<typeof handler>) => {
         if (!timer.current) {
            handler(...args)
         }
         clearTimeout(timer.current)
         timer.current = setTimeout(() => {
            timer.current = undefined
         }, delayInMs)
      }
}
