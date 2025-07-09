import { CustomPopover, IconButton, Skeleton } from "@/components/materials"
import { CustomAvatar } from "@/components/materials"
import { useDebounce } from "@/hooks/debounce"
import { useAppSelector } from "@/hooks/redux"
import { groupMemberService } from "@/services/group-member.service"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { toaster } from "@/utils/toaster"
import type { TGroupChatMemberWithUser } from "@/utils/types/be-api"
import { ArrowLeft, UserX } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type TManageMembersPopoverProps = {
  open: boolean
  trigger: React.ReactNode
  onOpenChange: (open: boolean) => void
}

const ManageMembersPopover = ({ trigger, onOpenChange }: TManageMembersPopoverProps) => {
  return (
    <CustomPopover trigger={trigger} onOpenChange={onOpenChange}>
      <div className="bg-black py-2 rounded-lg text-white border border-white/30">
        <button className="flex items-center gap-2 py-2 px-6 text-regular-red-cl font-bold hover:bg-regular-hover-card-cl">
          <UserX size={20} strokeWidth={3} />
          <span>Remove</span>
        </button>
      </div>
    </CustomPopover>
  )
}

export const ManageMembers = () => {
  const [open, setOpen] = useState<boolean>(false)
  const { groupChat, groupChatMembers } = useAppSelector(({ messages }) => messages)
  const [searchResults, setSearchResults] = useState<TGroupChatMemberWithUser[]>(
    groupChatMembers || []
  )
  const debounce = useDebounce()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [activePopover, setActivePopover] = useState<number>()

  const openManageMembers = () => {
    setOpen(true)
  }

  const closeBoard = () => {
    setOpen(false)
  }

  const searchUsers = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const value = input.value
    if (!value) {
      setSearchResults(groupChatMembers || [])
      return
    }
    if (groupChat) {
      setLoading(true)
      groupMemberService
        .searchGroupChatMembers(groupChat.id, value)
        .then((res) => {
          setSearchResults(res)
        })
        .catch((err) => {
          toaster.error(axiosErrorHandler.handleHttpError(err).message)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, 300)

  const handleChangeOpenPopover = (id: number, open: boolean) => {
    if (open) {
      setActivePopover(id)
    } else {
      setActivePopover(undefined)
    }
  }

  useEffect(() => {
    eventEmitter.on(EInternalEvents.OPEN_MANAGE_MEMBERS, openManageMembers)
    return () => {
      eventEmitter.off(EInternalEvents.OPEN_MANAGE_MEMBERS, openManageMembers)
    }
  }, [])

  return (
    <div
      className={`${open ? "left-0" : "left-full"} absolute z-[80] top-0 transition-[left] duration-200 bg-black w-full h-full overflow-hidden`}
    >
      <div className="flex flex-col gap-2 w-full h-full">
        <div className="p-4 bg-regular-dark-gray-cl w-full">
          <div className="w-full">
            <IconButton onClick={closeBoard} className="w-fit pr-2.5">
              <span className="flex items-center gap-2 w-fit">
                <ArrowLeft size={20} />
                <span>Back</span>
              </span>
            </IconButton>
          </div>

          <div className="w-full flex justify-start items-center gap-2 mt-4">
            <input
              type="text"
              placeholder="Search people..."
              className="w-full text-gray-400 bg-transparent outline-none border-none"
              onChange={searchUsers}
              ref={inputRef}
            />
          </div>
        </div>

        <div className="grow py-4 px-2 overflow-y-auto STYLE-styled-scrollbar bg-regular-dark-gray-cl w-full">
          {loading ? (
            <div className="flex flex-col gap-1 justify-center items-center">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-2 w-full px-3 py-2">
                  <Skeleton className="w-[50px] h-[50px] rounded-full bg-regular-hover-card-cl" />
                  <div className="w-[195px]">
                    <Skeleton className="w-full h-[20px] bg-regular-hover-card-cl rounded-md" />
                    <Skeleton className="w-1/2 h-[15px] bg-regular-hover-card-cl mt-1 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            searchResults.map(({ User: { Profile }, id }) => (
              <ManageMembersPopover
                key={id}
                open={activePopover === id}
                onOpenChange={(open) => handleChangeOpenPopover(id, open)}
                trigger={
                  <div
                    onClick={() => handleChangeOpenPopover(id, true)}
                    className={`${activePopover === id ? "bg-purple-200 hover:bg-purple-200" : ""} flex items-center gap-2 hover:bg-regular-hover-card-cl w-full cursor-pointer rounded-md p-2`}
                  >
                    <CustomAvatar
                      imgSize={48}
                      src={Profile.avatar}
                      alt="User Avatar"
                      fallback={Profile.fullName[0]}
                      className="text-lg font-bold bg-regular-violet-cl"
                    />

                    <div
                      className={`${activePopover === id ? "text-black" : "text-white"} min-w-0 space-y-1`}
                    >
                      <h3 title={Profile.fullName} className="font-medium text-base truncate">
                        {Profile.fullName}
                      </h3>
                      <p
                        className={`${activePopover === id ? "text-black" : "text-gray-400"} text-[13px]`}
                      >
                        Last seen Jan 20, 2025 at 16:23
                      </p>
                    </div>
                  </div>
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
