"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import AccountPage from "@/app/(account)/page"

type AccountModalContextType = {
  showAccount: boolean
  openAccount: () => void
  closeAccount: () => void
}

const AccountModalContext = createContext<AccountModalContextType | undefined>(undefined)

export const useAccountModal = () => {
  const context = useContext(AccountModalContext)
  if (!context) {
    throw new Error("useAccountModal must be used within AccountModalProvider")
  }
  return context
}

type AccountModalProviderProps = {
  children: ReactNode
}

export const AccountModalProvider = ({ children }: AccountModalProviderProps) => {
  const [showAccount, setShowAccount] = useState(false)

  const openAccount = () => setShowAccount(true)
  const closeAccount = () => setShowAccount(false)

  return (
    <AccountModalContext.Provider value={{ showAccount, openAccount, closeAccount }}>
      {children}
      {showAccount && (
        <div className="fixed inset-0 z-50 flex bg-black/50">
          <div className="w-[55px]"></div>
          <div className="w-convs-list h-full bg-regular-dark-gray-cl border-regular-hover-card-cl border-r overflow-y-auto STYLE-styled-scrollbar">
            <AccountPage showBackButton={true} onBack={closeAccount} />
          </div>
          <div className="flex-1" onClick={closeAccount}></div>
        </div>
      )}
    </AccountModalContext.Provider>
  )
}
