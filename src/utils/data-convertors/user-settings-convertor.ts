import type { TSettingsState } from "@/utils/types/global"
import type { TUserSettings } from "@/utils/types/be-api"

export const convertToSettingsState = (userSettings: TUserSettings): TSettingsState => {
  return {
    pushNotification: {
      enabled: userSettings.pushNotificationEnabled,
    },
    privacy: {
      onlyReceiveFriendMessage: userSettings.onlyReceiveFriendMessage,
    },
    accessibility: {
      voiceAssistantEnabled: userSettings.voiceAssistantEnabled ?? false,
      ttsEnabled: userSettings.ttsEnabled ?? false,
      sttEnabled: userSettings.sttEnabled ?? false,
      autoReadMessages: userSettings.autoReadMessages ?? false,
      speechRate: userSettings.speechRate ?? 1.0,
      voiceActivationMode: userSettings.voiceActivationMode ?? "WAKE_WORD",
      wakeWordPhrase: userSettings.wakeWordPhrase ?? "Hey Chat",
    },
  }
}
