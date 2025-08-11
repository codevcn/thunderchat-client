import { useDebounce } from "@/hooks/debounce"
import { useUser } from "@/hooks/user"
import { toaster } from "@/utils/toaster"
import { userService } from "@/services/user.service"
import { TSearchUsersData } from "@/utils/types/be-api"
import { useRef, useState } from "react"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { ArrowLeft, Check } from "lucide-react"
import { X } from "lucide-react"
import { CustomAvatar } from "@/components/materials/avatar"
import { Checkbox, IconButton, Skeleton, Spinner } from "@/components/materials"
import { useAppDispatch } from "@/hooks/redux"
import { addGroupChatMembers } from "@/redux/messages/messages.slice"
import { groupMemberService } from "@/services/group-member.service"

type TAddMembersBoardProps = {
  open: boolean
  onOpen: (open: boolean) => void
  groupChatId: number
}

export const AddMembersStep = ({ open, onOpen, groupChatId }: TAddMembersBoardProps) => {
  const [pickedUsers, setPickedUsers] = useState<TSearchUsersData[]>([])
  const [searchResults, setSearchResults] = useState<TSearchUsersData[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const debounce = useDebounce()
  const user = useUser()!
  const dispatch = useAppDispatch()

  const searchUsers = debounce(() => {
    const keyword = inputRef.current?.value
    if (!keyword) {
      setSearchResults([])
      return
    }
    setLoading(true)
    userService
      .searchUsers(keyword)
      .then((res) => {
        setSearchResults(res.filter(({ id }) => id !== user.id))
      })
      .catch((err) => {
        toaster.error(axiosErrorHandler.handleHttpError(err).message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, 300)

  const closeBoard = () => {
    onOpen(false)
  }

  const checkUserIsPicked = (id: number) => {
    return pickedUsers.some(({ id: pickedId }) => pickedId === id)
  }

  const handlePickUser = (user: TSearchUsersData) => {
    if (checkUserIsPicked(user.id)) {
      cancelPickUser(user.id)
    } else {
      setPickedUsers((prev) => [...prev, user])
    }
  }

  const cancelPickUser = (id: number) => {
    setPickedUsers((prev) => prev.filter((user) => user.id !== id))
  }

  const confirmAddingMembers = () => {
    if (pickedUsers.length === 0) {
      toaster.error("Please pick at least one user")
      return
    }
    setLoading(true)
    groupMemberService
      .addMembersToGroupChat(
        groupChatId,
        pickedUsers.map(({ id }) => id)
      )
      .then((res) => {
        onOpen(false)
        dispatch(addGroupChatMembers(res.addedMembers))
      })
      .catch((err) => {
        toaster.error(axiosErrorHandler.handleHttpError(err).message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <div
      className={`${open ? "left-0" : "left-full"} absolute z-[90] top-0 transition-[left] duration-200 bg-black w-full h-full overflow-hidden`}
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

          {pickedUsers && pickedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 max-h-[200px] overflow-y-auto STYLE-styled-scrollbar">
              {pickedUsers.map(({ Profile, id }) => (
                <div
                  key={id}
                  className="group flex items-center gap-2 bg-[#ffffff1a] rounded-full relative overflow-hidden"
                >
                  <div className="group-hover:translate-x-0 transition-transform duration-200 absolute -translate-x-full top-0 left-0 h-full aspect-square z-20">
                    <span
                      onClick={() => cancelPickUser(id)}
                      className="flex h-full w-full bg-red-600 hover:rotate-180 transition-transform duration-200 cursor-pointer rounded-full"
                    >
                      <X size={20} strokeWidth={3} className="text-white m-auto" />
                    </span>
                  </div>
                  <CustomAvatar
                    imgSize={32}
                    src={Profile.avatar}
                    alt="User Avatar"
                    fallback={Profile.fullName[0]}
                    className="relative z-10 text-lg font-bold bg-regular-violet-cl"
                  />
                  <span className="text-sm font-medium pr-2">{Profile.fullName}</span>
                </div>
              ))}
            </div>
          )}

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
            searchResults.map(({ Profile, id, email }) => (
              <div
                key={id}
                className="flex items-center gap-2 hover:bg-regular-hover-card-cl w-full cursor-pointer rounded-md p-2"
                onClick={() => handlePickUser({ Profile, id, email })}
              >
                <Checkbox inputId={`user-${id}`} readOnly checked={checkUserIsPicked(id)} />

                <CustomAvatar
                  imgSize={48}
                  src={Profile.avatar}
                  alt="User Avatar"
                  fallback={Profile.fullName[0]}
                  className="text-lg font-bold bg-regular-violet-cl"
                />

                <div className="min-w-0 space-y-1">
                  <h3
                    title={Profile.fullName}
                    className="font-medium text-base text-white truncate"
                  >
                    {Profile.fullName}
                  </h3>
                  <p className="text-[13px] text-gray-400">{email}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div
          className={`${pickedUsers && pickedUsers.length > 0 ? "bottom-6" : "-bottom-14"} transition-[bottom] duration-200 absolute right-4 z-20`}
        >
          {loading ? (
            <div className="flex justify-center items-center w-[50px] h-[50px] rounded-full bg-regular-violet-cl">
              <Spinner size="medium" />
            </div>
          ) : (
            <button
              onClick={confirmAddingMembers}
              className="flex justify-center items-center w-[50px] h-[50px] rounded-full bg-regular-violet-cl hover:scale-110 transition duration-200"
            >
              <Check color="currentColor" size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
