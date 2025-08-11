import type {
  TGroupChatData,
  TGroupJoinRequest,
  TGroupJoinRequestWithUser,
} from "@/utils/types/be-api"
import { useEffect, useState } from "react"
import { CustomAvatar, CustomDialog, Spinner } from "@/components/materials"
import { toaster } from "@/utils/toaster"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { groupChatService } from "@/services/group-chat.service"
import { EJoinRequestStatus } from "@/utils/enums"

type TRequestItemProps = {
  user: TGroupJoinRequestWithUser
  onApproveRejectRequest: (joinRequestId: number, status: EJoinRequestStatus) => void
  approveLoading: TGroupJoinRequest["id"] | undefined
}

const RequestItem = ({ user, onApproveRejectRequest, approveLoading }: TRequestItemProps) => {
  const {
    Requester: {
      Profile: { avatar, fullName },
      email,
    },
    id,
  } = user

  return (
    <div className="flex items-center justify-between gap-3 w-full border border-gray-600 py-2 px-4 rounded-md hover:bg-regular-hover-card-cl transition-colors">
      <CustomAvatar
        src={avatar}
        imgSize={40}
        fallback={fullName[0]}
        className="text-2xl bg-regular-violet-cl"
      />
      <div className="flex-1">
        <p className="text-base font-medium leading-snug">{fullName}</p>
        <p className="text-sm text-gray-400">{email}</p>
      </div>
      <div className="flex items-center gap-4">
        <button
          className="flex text-sm text-white hover:text-regular-violet-cl"
          onClick={() => onApproveRejectRequest(id, EJoinRequestStatus.APPROVED)}
          disabled={approveLoading === id}
        >
          {approveLoading === id ? <Spinner size="small" className="m-auto" /> : "Approve"}
        </button>
        <button
          className="flex text-sm text-white hover:text-regular-violet-cl"
          onClick={() => onApproveRejectRequest(id, EJoinRequestStatus.REJECTED)}
          disabled={approveLoading === id}
        >
          {approveLoading === id ? <Spinner size="small" className="m-auto" /> : "Reject"}
        </button>
      </div>
    </div>
  )
}

type TApproveMembersProps = {
  open: boolean
  onOpen: (open: boolean) => void
  groupChat: TGroupChatData
}

export const ApproveMembersBoard = ({ open, onOpen, groupChat }: TApproveMembersProps) => {
  const { id: groupChatId } = groupChat
  const [requests, setRequests] = useState<TGroupJoinRequestWithUser[]>()
  const [isFetchingUsers, setIsFetchingUsers] = useState<boolean>(false)
  const [approveLoading, setApproveLoading] = useState<TGroupJoinRequest["id"]>()

  const fetchGroupJoiningRequests = () => {
    if (!open) return
    setIsFetchingUsers(true)
    groupChatService
      .fetchGroupJoiningRequests(groupChatId, EJoinRequestStatus.PENDING)
      .then((joinRequests) => {
        setRequests(joinRequests)
      })
      .catch((err) => {
        toaster.error(axiosErrorHandler.handleHttpError(err).message)
      })
      .finally(() => {
        setIsFetchingUsers(false)
      })
  }

  const handleApproveRejectRequest = (joinRequestId: number, status: EJoinRequestStatus) => {
    setApproveLoading(joinRequestId)
    groupChatService
      .processGroupJoinRequest(joinRequestId, status, groupChatId)
      .then((joinRequest) => {
        setRequests(requests?.filter((user) => user.id !== joinRequest.id))
      })
      .catch((err) => {
        toaster.error(axiosErrorHandler.handleHttpError(err).message)
      })
      .finally(() => {
        setApproveLoading(undefined)
      })
  }

  useEffect(() => {
    fetchGroupJoiningRequests()
  }, [open])

  return (
    <CustomDialog
      open={open}
      onHideShow={onOpen}
      dialogHeader={{ title: "Manage Join Requests" }}
      dialogBody={
        <div className="min-w-[500px] my-4 relative">
          {isFetchingUsers ? (
            <div className="flex justify-center items-center absolute top-0 left-0 w-full h-full">
              <Spinner size="medium" />
            </div>
          ) : (
            requests &&
            (requests.length > 0 ? (
              <div className="flex flex-col items-center gap-3">
                {requests.map((user) => (
                  <RequestItem
                    key={user.id}
                    user={user}
                    onApproveRejectRequest={handleApproveRejectRequest}
                    approveLoading={approveLoading}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 px-4">
                <p className="text-white text-base break-words">
                  No one has requested to join this group.
                </p>
              </div>
            ))
          )}
        </div>
      }
    />
  )
}
