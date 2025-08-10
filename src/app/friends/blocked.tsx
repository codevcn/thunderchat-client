import { useEffect, useState } from "react"
import { Ban } from "lucide-react"
import type { TBlockedUserFullInfo } from "@/utils/types/be-api"
import { userService } from "@/services/user.service"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { toaster } from "@/utils/toaster"
import { Spinner } from "@/components/materials/spinner"
import { CustomAvatar } from "@/components/materials"

type TBlockedUserCardProps = {
  user: TBlockedUserFullInfo
  onUnblockUser: (userId: number) => void
  unblockLoading: number | undefined
}

const BlockedUserCard = ({ user, onUnblockUser, unblockLoading }: TBlockedUserCardProps) => {
  const {
    UserBlocked: { Profile, email, id: blockedUserId },
  } = user
  const { fullName, avatar } = Profile

  return (
    <div className="flex items-center justify-between gap-x-8 gap-y-2 bg-regular-modal-board-bgcl rounded-md py-2 px-4 mt-4">
      <div className="flex items-center gap-2">
        <CustomAvatar
          src={avatar}
          imgSize={40}
          className="rounded-full"
          alt={fullName}
          fallback={fullName[0]}
          fallbackClassName="text-2xl bg-regular-violet-cl"
        />
        <div>
          <h3 className="text-base font-medium leading-snug">{fullName}</h3>
          <p className="text-sm text-regular-placeholder-cl mt-1">{email}</p>
        </div>
      </div>
      <div>
        <button
          className="rounded-2xl bg-regular-dark-gray-cl px-3 py-1.5 text-regular-white-cl hover:scale-110 transition"
          onClick={() => onUnblockUser(blockedUserId)}
          disabled={unblockLoading === blockedUserId}
        >
          {unblockLoading === blockedUserId ? <Spinner /> : <span>Unblock</span>}
        </button>
      </div>
    </div>
  )
}

export const Blocked = () => {
  const [blockedUsers, setBlockedUsers] = useState<TBlockedUserFullInfo[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [unblockLoading, setUnblockLoading] = useState<number>()

  const handleUnblockUser = (userId: number) => {
    setUnblockLoading(userId)
    userService
      .unblockUser(userId)
      .then(() => {
        setBlockedUsers((prev) => prev.filter((u) => u.blockedUserId !== userId))
        toaster.success("Unblocked user successfully")
      })
      .catch((err) => {
        toaster.error(axiosErrorHandler.handleHttpError(err).message)
      })
      .finally(() => {
        setUnblockLoading(undefined)
      })
  }

  useEffect(() => {
    setLoading(true)
    userService
      .getBlockedUsersList()
      .then((res) => {
        setBlockedUsers(res)
      })
      .catch((err) => {
        toaster.error(axiosErrorHandler.handleHttpError(err).message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div className="mt-2 border-t border-regular-hover-card-cl border-solid pt-3">
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Spinner />
        </div>
      ) : blockedUsers && blockedUsers.length > 0 ? (
        <div className="flex flex-col gap-y-4">
          {blockedUsers.map((user) => (
            <BlockedUserCard
              key={user.id}
              user={user}
              onUnblockUser={handleUnblockUser}
              unblockLoading={unblockLoading}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 mt-8">
          <Ban className="w-16 h-16 text-regular-icon-cl" />
          <h3 className="text-lg font-medium text-regular-icon-cl text-center">
            No users have been blocked
          </h3>
          <p className="text-sm text-regular-icon-cl text-center max-w-[300px]">
            You can block other users by clicking the block icon in the chat
          </p>
        </div>
      )}
    </div>
  )
}
