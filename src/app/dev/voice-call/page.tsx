import { VoiceCall } from "@/app/conversations/direct-chat/voice-call"

export default function VoiceCallPage() {
  return <VoiceCall canSend={true} directChatId={1} />
}
