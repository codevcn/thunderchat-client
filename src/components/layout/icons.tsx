import { CSS_VARIABLES } from "@/configs/css-variables"

export const SuccessIconForToast = () => {
   return (
      <svg
         xmlns="http://www.w3.org/2000/svg"
         fill="var(--tdc-regular-green-cl)"
         height={CSS_VARIABLES.TOAST.ICON_SIZE}
         width={CSS_VARIABLES.TOAST.ICON_SIZE}
         viewBox="0 0 512 512"
      >
         <g>
            <path d="M437.016,74.984c-99.979-99.979-262.075-99.979-362.033,0.002c-99.978,99.978-99.978,262.073,0.004,362.031     c99.954,99.978,262.05,99.978,362.029-0.002C536.995,337.059,536.995,174.964,437.016,74.984z M406.848,406.844     c-83.318,83.318-218.396,83.318-301.691,0.004c-83.318-83.299-83.318-218.377-0.002-301.693     c83.297-83.317,218.375-83.317,301.691,0S490.162,323.549,406.848,406.844z" />
            <path d="M368.911,155.586L234.663,289.834l-70.248-70.248c-8.331-8.331-21.839-8.331-30.17,0s-8.331,21.839,0,30.17     l85.333,85.333c8.331,8.331,21.839,8.331,30.17,0l149.333-149.333c8.331-8.331,8.331-21.839,0-30.17     S377.242,147.255,368.911,155.586z" />
         </g>
      </svg>
   )
}

export const ErrorIconForToast = () => {
   return (
      <svg
         xmlns="http://www.w3.org/2000/svg"
         width={CSS_VARIABLES.TOAST.ICON_SIZE}
         height={CSS_VARIABLES.TOAST.ICON_SIZE}
         viewBox="0 0 24 24"
         fill="none"
      >
         <path d="M8 16L16 8" stroke="var(--tdc-regular-red-cl)" strokeWidth="2" />
         <path d="M16 16L8 8" stroke="var(--tdc-regular-red-cl)" strokeWidth="2" />
         <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="var(--tdc-regular-red-cl)"
            strokeWidth="2"
         />
      </svg>
   )
}
