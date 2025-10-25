"use client"

import { useEffect, useRef } from "react"
import { localStorageManager } from "@/utils/local-storage"
import { RootLayoutContext } from "@/contexts/root-layout.context"
import { getPathWithQueryString } from "@/utils/helpers"
import { usePushNotification } from "@/hooks/push-notification"
import { useGlobalVoiceCallListener } from "@/hooks/use-global-voice-call"
import { GlobalIncomingCallModal } from "@/components/voice-call/GlobalIncomingCallModal"

const PushNotificationProvider = () => {
  usePushNotification()
  return <></>
}

// const CallProvider = () => {
//   useGlobalVoiceCallListener()
//   return <></>
// }
export const AppLayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const appRootRef = useRef<HTMLDivElement>(null)

  const setLastPageAccessed = () => {
    localStorageManager.setLastPageAccessed(getPathWithQueryString())
  }

  useEffect(() => {
    setLastPageAccessed()
  }, [])

  return (
    <div ref={appRootRef} id="App-Root" className="bg-regular-dark-gray-cl">
      <PushNotificationProvider />

      {/* <GlobalIncomingCallModal /> */}
      <RootLayoutContext.Provider value={{ appRootRef }}>{children}</RootLayoutContext.Provider>
    </div>
  )
}
