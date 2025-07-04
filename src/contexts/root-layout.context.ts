import { createContext } from "react"

type TRootLayoutContext = {
   appRootRef: React.RefObject<HTMLElement | null> | null
}

const defaultContext: TRootLayoutContext = {
   appRootRef: null,
}

export const RootLayoutContext = createContext<TRootLayoutContext>(defaultContext)
