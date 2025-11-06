"use client"

import { PhoneOff, MicOff, Video, VideoOff, X, Mic, User, Users } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { EVoiceCallStatus } from "@/utils/enums"
import { createPortal } from "react-dom"
import type { IAgoraRTCRemoteUser, ICameraVideoTrack } from "agora-rtc-sdk-ng"
import { userService } from "@/services/user.service"

type RemoteUserPlayerProps = {
  user: IAgoraRTCRemoteUser
  name?: string
  isPinned?: boolean
  onPin?: (uid: string) => void
  isMainView?: boolean
}

const RemoteUserPlayer = ({
  user,
  name = "Unknown",
  isPinned,
  onPin,
  isMainView = false,
}: RemoteUserPlayerProps) => {
  const videoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (videoRef.current && user.videoTrack) {
      user.videoTrack.play(videoRef.current)
    }
    return () => {
      user.videoTrack?.stop()
    }
  }, [user.videoTrack])

  useEffect(() => {
    if (user.audioTrack) {
      user.audioTrack.play()
    }
  }, [user.audioTrack])

  return (
    <div
      className={`relative w-full h-full bg-gray-900 rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${
        isPinned ? "ring-4 ring-blue-500" : "cursor-pointer hover:ring-2 hover:ring-white/50"
      }`}
      onClick={() => !isPinned && onPin?.(String(user.uid))}
      title={isPinned ? "Pinned" : "Click to pin"}
    >
      <div ref={videoRef} className="w-full h-full">
        {!user.hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <User className="w-16 h-16 text-gray-400" />
          </div>
        )}
      </div>

      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-sm flex items-center gap-2">
        {name}
        {!user.hasAudio && <MicOff className="w-3 h-3 text-red-400" />}
      </div>

      {isPinned && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500 rounded text-white text-xs font-semibold">
          Pinned
        </div>
      )}
    </div>
  )
}

type MoreUsersCardProps = {
  count: number
  onClick: () => void
}

const MoreUsersCard = ({ count, onClick }: MoreUsersCardProps) => {
  return (
    <div
      onClick={onClick}
      className="relative w-full h-full bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer hover:bg-gray-700 transition-all duration-300 flex flex-col items-center justify-center"
    >
      <Users className="w-12 h-12 text-white mb-2" />
      <span className="text-2xl font-bold text-white">+{count}</span>
      <span className="text-sm text-gray-300 mt-1">more participants</span>
    </div>
  )
}

type HolderUIProps = {
  onClose: () => void
  calleeName?: string
  callState: EVoiceCallStatus
  localVideoTrack: ICameraVideoTrack | null
  remoteUsers: IAgoraRTCRemoteUser[]
  toggleVideo: () => void
  isVideoEnabled: boolean
  toggleMic: () => void
  isMicEnabled: boolean
  switchCamera: () => Promise<void>
}

const HolderUI = ({
  onClose,
  calleeName,
  callState,
  localVideoTrack,
  remoteUsers,
  toggleVideo,
  isVideoEnabled,
  toggleMic,
  isMicEnabled,
  switchCamera,
}: HolderUIProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const ringtoneRef = useRef<HTMLAudioElement>(null)
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const [pinnedUserId, setPinnedUserId] = useState<string | null>(null)
  const [showAllUsers, setShowAllUsers] = useState(false)

  // LOGIC CHÍNH: Phân chia users
  const mainUser = pinnedUserId
    ? remoteUsers.find((u) => String(u.uid) === pinnedUserId)
    : remoteUsers[0] || null

  const remainingUsers = pinnedUserId
    ? remoteUsers.filter((u) => String(u.uid) !== pinnedUserId)
    : remoteUsers.slice(1)

  // Hiển thị tối đa 2 màn phụ
  const MAX_VISIBLE_SECONDARY = 1
  const visibleSecondaryUsers = remainingUsers.slice(0, MAX_VISIBLE_SECONDARY)
  const hiddenUsersCount = remainingUsers.length - MAX_VISIBLE_SECONDARY

  const handlePin = (uid: string) => {
    if (pinnedUserId === uid) {
      setPinnedUserId(null)
    } else {
      setPinnedUserId(uid)
      setShowAllUsers(false) // Đóng modal khi pin
    }
  }

  // Fetch user names
  useEffect(() => {
    const fetchUserNames = async () => {
      const names: Record<string, string> = {}
      for (const user of remoteUsers) {
        try {
          const userInfo = await userService.getUserById(Number(user.uid))
          names[user.uid] = userInfo.Profile?.fullName || "Unknown"
        } catch (error) {
          console.error(`Failed to fetch user ${user.uid}:`, error)
          names[user.uid] = "Unknown"
        }
      }
      setUserNames(names)
    }

    fetchUserNames()
  }, [remoteUsers])

  useEffect(() => {
    if (localVideoRef.current && localVideoTrack) {
      localVideoTrack.play(localVideoRef.current)
    }
    return () => {
      localVideoTrack?.stop()
    }
  }, [localVideoTrack])

  useEffect(() => {
    const audio = ringtoneRef.current
    if (!audio) return

    if (callState === EVoiceCallStatus.RINGING) {
      audio.load()
      audio.play().catch(console.warn)
    } else {
      audio.pause()
      audio.currentTime = 0
    }
  }, [callState])

  if (typeof document === "undefined") return null
  const portalRoot = document.body

  const showVoiceCallFallback = remoteUsers.length === 0 && !isVideoEnabled
  const showWaitingFallback = remoteUsers.length === 0 && isVideoEnabled

  const holder = (
    <div
      className="fixed inset-0 z-[9999] flex flex-col backdrop-blur-sm"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
    >
      <audio ref={ringtoneRef} src="/sounds/outgoing-call.mp3" loop style={{ display: "none" }} />

      {/* Top Bar */}
      <div className="w-full p-4 flex justify-between items-center text-white shrink-0">
        <div>
          <span className="text-lg font-semibold">
            {callState === EVoiceCallStatus.CONNECTED ? "Connected" : "Connecting..."}
          </span>
          <span className="ml-4">{remoteUsers.length + 1} participants</span>
        </div>
        <button onClick={onClose} aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div
        className="flex-1 w-full h-full p-4 relative"
        style={{ maxHeight: "calc(100vh - 180px)" }}
      >
        {/* LAYOUT: Main + Fixed Sidebar */}
        <div className="w-full h-full flex gap-4">
          {/* Main Video Area - 75% */}
          <div className="flex-1 h-full">
            {mainUser ? (
              <RemoteUserPlayer
                user={mainUser}
                name={userNames[mainUser.uid] || "Loading..."}
                isPinned={String(mainUser.uid) === pinnedUserId}
                onPin={handlePin}
                isMainView={true}
              />
            ) : showVoiceCallFallback ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-white bg-gray-900 rounded-lg">
                <Mic className="w-24 h-24" />
                <span className="text-xl font-medium mt-4">{calleeName}</span>
                <span className="text-sm text-white/70">
                  {callState === EVoiceCallStatus.RINGING ? "Ringing..." : "Voice Call"}
                </span>
              </div>
            ) : showWaitingFallback ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-white bg-gray-900 rounded-lg">
                <Users className="w-24 h-24" />
                <span className="text-xl font-medium mt-4">Waiting for others to join...</span>
                <span className="text-sm text-white/70 mt-1">You are the only one here.</span>
              </div>
            ) : null}
          </div>

          {/* Fixed Sidebar - 25% (ALWAYS show when there are remote users OR local video) */}
          {(remoteUsers.length > 0 || isVideoEnabled) && (
            <div className="w-64 h-full flex flex-col gap-4">
              {/* Local Video - Fixed at top of sidebar */}
              {isVideoEnabled && (
                <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg border-2 border-gray-700 relative shrink-0">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-sm">
                    You
                  </div>
                </div>
              )}

              {/* Secondary remote users */}
              {visibleSecondaryUsers.map((user) => (
                <div key={user.uid} className="flex-1 min-h-0">
                  <RemoteUserPlayer
                    user={user}
                    name={userNames[user.uid] || "Loading..."}
                    isPinned={false}
                    onPin={handlePin}
                  />
                </div>
              ))}

              {/* Card "+N" */}
              {hiddenUsersCount > 0 && (
                <div className="flex-1 min-h-0">
                  <MoreUsersCard count={hiddenUsersCount} onClick={() => setShowAllUsers(true)} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div
        className="px-8 py-4 flex items-center justify-center gap-6 box-content shrink-0 border-t"
        style={{
          backgroundColor: "var(--tdc-regular-button-bgcl)",
          borderColor: "var(--tdc-regular-divider-cl)",
        }}
      >
        <button
          onClick={toggleVideo}
          className={`flex flex-col items-center gap-2 ${
            isVideoEnabled ? "text-white" : "text-gray-400"
          }`}
        >
          <div
            className={`w-14 h-14 rounded-full inline-flex items-center justify-center transition shadow-md ${
              isVideoEnabled ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </div>
          <span className="text-sm font-medium">Video</span>
        </button>

        <button
          onClick={toggleMic}
          className={`flex flex-col items-center gap-2 ${
            isMicEnabled ? "text-white" : "text-gray-400"
          }`}
        >
          <div
            className={`w-14 h-14 rounded-full inline-flex items-center justify-center transition shadow-md ${
              isMicEnabled ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {isMicEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </div>
          <span className="text-sm font-medium">Mic</span>
        </button>

        <button onClick={onClose} className="flex flex-col items-center gap-2 text-white">
          <div className="w-14 h-14 rounded-full inline-flex items-center justify-center shadow-lg bg-red-600 hover:bg-red-700 transition">
            <PhoneOff className="w-7 h-7" />
          </div>
          <span className="text-sm font-medium">End Call</span>
        </button>
      </div>

      {/* Modal: Tất cả participants */}
      {showAllUsers && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-8"
          onClick={() => setShowAllUsers(false)}
        >
          <div
            className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                All Participants ({remoteUsers.length})
              </h2>
              <button
                onClick={() => setShowAllUsers(false)}
                className="text-white hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {remoteUsers.map((user) => (
                <div key={user.uid} className="aspect-video">
                  <RemoteUserPlayer
                    user={user}
                    name={userNames[user.uid] || "Loading..."}
                    isPinned={String(user.uid) === pinnedUserId}
                    onPin={handlePin}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return createPortal(holder, portalRoot)
}

export default HolderUI
