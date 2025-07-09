import { TSearchUsersData } from "@/utils/types/be-api"
import { useEffect, useRef, useState } from "react"
import {
  Checkbox,
  CustomAvatar,
  CustomTooltip,
  IconButton,
  Skeleton,
  Spinner,
  TextField,
} from "@/components/materials"
import { useDebounce } from "@/hooks/debounce"
import { userService } from "@/services/user.service"
import { toaster } from "@/utils/toaster"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { ArrowLeft, ArrowRight, Camera, X, Plus, RefreshCw } from "lucide-react"
import { groupChatService } from "@/services/group-chat.service"
import { useAppDispatch } from "@/hooks/redux"
import { addConversations } from "@/redux/conversations/conversations.slice"
import { EMessageTypes } from "@/utils/enums"

type TPrepareNewGroupProps = {
  pickedUsers: TSearchUsersData[]
  open: boolean
  onOpen: (open: boolean) => void
  closeCreateGroupChat: () => void
}

type TLoading = "upload-avatar" | "delete-avatar" | "create-group"

const PrepareNewGroup = ({
  pickedUsers,
  open,
  onOpen,
  closeCreateGroupChat,
}: TPrepareNewGroupProps) => {
  const usersCount = pickedUsers.length
  const [loading, setLoading] = useState<TLoading>()
  const [avatar, setAvatar] = useState<string>()
  const isCreatedRef = useRef<boolean>(false)
  const groupNameInputRef = useRef<HTMLInputElement>(null)
  const dispatch = useAppDispatch()

  const closeBoard = () => {
    onOpen(false)
  }

  const handlePickGroupPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return
    if (avatar) {
      try {
        await handleDeleteAvatar()
      } catch (error) {
        toaster.error("Failed to delete the previous avatar")
        return
      }
    }
    setLoading("upload-avatar")
    try {
      const res = await groupChatService.uploadGroupAvatar(file)
      setAvatar(res.avatarUrl)
    } catch (err) {
      toaster.error(axiosErrorHandler.handleHttpError(err).message)
    } finally {
      setLoading(undefined)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!avatar || loading === "delete-avatar" || isCreatedRef.current) return
    setLoading("delete-avatar")
    try {
      await groupChatService.deleteGroupAvatar(avatar)
      setAvatar(undefined)
    } catch (err) {
      toaster.error(axiosErrorHandler.handleHttpError(err).message)
    } finally {
      setLoading(undefined)
    }
  }

  const addGroupChatToList = (groupName: string, groupChatId: number, avatarUrl?: string) => {
    dispatch(
      addConversations([
        {
          avatar: { src: avatarUrl, fallback: groupName[0] },
          title: groupName,
          subtitle: { content: "You created this group chat", type: EMessageTypes.TEXT },
          lastMessageTime: new Date().toISOString(),
          pinIndex: 0,
          id: groupChatId,
          type: "group",
          createdAt: new Date().toISOString(),
        },
      ])
    )
  }

  const handleCreateGroup = async () => {
    const groupName = groupNameInputRef.current?.value
    if (!groupName) {
      toaster.error("Please enter a group name")
      return
    }
    setLoading("create-group")
    const memberIds = pickedUsers.map(({ id }) => id)
    try {
      const groupChat = await groupChatService.createGroupChat(groupName, memberIds, avatar)
      isCreatedRef.current = true
      addGroupChatToList(groupName, groupChat.id, avatar)
      closeCreateGroupChat()
    } catch (err) {
      toaster.error(axiosErrorHandler.handleHttpError(err).message)
    } finally {
      setLoading(undefined)
    }
  }

  useEffect(() => {
    return () => {
      if (isCreatedRef.current) {
        handleDeleteAvatar()
      }
    }
  }, [])

  return (
    <div
      className={`${open ? "left-0" : "left-full"} absolute z-50 top-0 transition-[left] duration-200 bg-black w-full h-full overflow-hidden`}
    >
      <div className="flex flex-col gap-2 w-full h-full">
        <div className="p-4 bg-regular-dark-gray-cl">
          <div className="w-full">
            <IconButton onClick={closeBoard} className="w-fit pr-2.5">
              <span className="flex items-center gap-2 w-fit">
                <ArrowLeft size={20} />
                <span>Back</span>
              </span>
            </IconButton>
          </div>

          {/* Group Photo */}
          <div className="flex justify-center mt-2">
            <CustomTooltip title="Upload group photo" placement="right" align="center" arrow>
              <div className="group w-[100px] h-[100px] bg-regular-violet-cl rounded-full flex items-center justify-center cursor-pointer">
                <input
                  type="file"
                  id="avatar-input"
                  hidden
                  onChange={handlePickGroupPhoto}
                  accept="image/*"
                />
                {loading === "upload-avatar" ? (
                  <div className="w-full h-full bg-regular-violet-cl rounded-full flex items-center justify-center">
                    <Spinner size="medium" />
                  </div>
                ) : avatar ? (
                  <div className="w-full h-full bg-regular-violet-cl rounded-full relative transition-colors duration-200">
                    <img
                      src={avatar}
                      alt="Group Avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                    <label
                      htmlFor="avatar-input"
                      className="hidden items-center justify-center rounded-full group-hover:flex group-hover:bg-white/20 absolute top-0 left-0 h-full w-full cursor-pointer"
                    >
                      <Camera className="w-12 h-12 text-white" />
                      <span className="absolute left-[55%] top-[55%] bg-white rounded-full">
                        <RefreshCw className="w-4 h-4 text-regular-violet-cl" />
                      </span>
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="avatar-input"
                    className="flex items-center justify-center group-hover:scale-110 transition-transform duration-200 relative h-full w-full cursor-pointer"
                  >
                    <Camera className="w-12 h-12 text-white" />
                    <span className="absolute left-[55%] top-[55%] bg-white rounded-full">
                      <Plus className="w-5 h-5 text-regular-violet-cl" />
                    </span>
                  </label>
                )}
              </div>
            </CustomTooltip>
          </div>

          {/* Group Name Input */}
          <div className="mt-4">
            <TextField
              inputId="group-name"
              placeholder="Enter group name..."
              classNames={{ input: "w-full" }}
              ref={groupNameInputRef}
            />
          </div>
        </div>

        {pickedUsers && usersCount > 0 && (
          <div className="grow p-4 pb-6 overflow-y-auto STYLE-styled-scrollbar bg-regular-dark-gray-cl">
            <div className="w-full">
              <p className="text-regular-violet-cl text-sm font-medium">
                {usersCount > 1 ? `${usersCount} members` : "1 member"}
              </p>
            </div>

            <div className="space-y-4 mt-4">
              {pickedUsers.map(({ Profile, id }) => (
                <div key={id} className="flex items-center gap-3">
                  <CustomAvatar
                    imgSize={48}
                    src={Profile.avatar}
                    alt="User Avatar"
                    fallback={Profile.fullName[0]}
                    className="text-lg font-bold bg-regular-violet-cl"
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    <h3
                      title={Profile.fullName}
                      className="font-medium text-base text-white truncate"
                    >
                      {Profile.fullName}
                    </h3>
                    <p className="text-[13px] text-gray-400">Last seen Jan 20, 2025 at 16:23</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="absolute bottom-6 right-6 z-20">
          {loading === "create-group" ? (
            <div className="flex justify-center items-center w-[50px] h-[50px] rounded-full bg-regular-violet-cl">
              <Spinner size="medium" />
            </div>
          ) : (
            <button
              onClick={handleCreateGroup}
              className="flex justify-center items-center w-[50px] h-[50px] rounded-full bg-regular-violet-cl hover:scale-110 transition duration-200"
            >
              <ArrowRight color="currentColor" size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

type TAddMembersBoardProps = {
  open: boolean
  onOpen: (open: boolean) => void
}

export const AddMembersBoard = ({ open, onOpen }: TAddMembersBoardProps) => {
  const [pickedUsers, setPickedUsers] = useState<TSearchUsersData[]>([])
  const [searchResults, setSearchResults] = useState<TSearchUsersData[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [openPrepareNewGroup, setOpenPrepareNewGroup] = useState(false)
  const debounce = useDebounce()

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
        setSearchResults(res)
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

  const prepareNewGroup = () => {
    if (pickedUsers.length === 0) {
      toaster.error("Please pick at least one user")
      return
    }
    setOpenPrepareNewGroup(true)
  }

  return (
    <div
      className={`${open ? "left-0" : "left-full"} absolute z-40 top-0 transition-[left] duration-200 bg-black w-full h-full overflow-hidden`}
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
                  <p className="text-[13px] text-gray-400">Last seen Jan 20, 2025 at 16:23</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div
          className={`${pickedUsers && pickedUsers.length > 0 ? "bottom-6" : "-bottom-14"} transition-[bottom] duration-200 absolute right-6 z-20`}
        >
          <button
            onClick={prepareNewGroup}
            className="flex justify-center items-center w-[50px] h-[50px] rounded-full bg-regular-violet-cl hover:scale-110 transition duration-200"
          >
            <ArrowRight color="currentColor" size={24} />
          </button>
        </div>
      </div>

      <PrepareNewGroup
        pickedUsers={pickedUsers}
        open={openPrepareNewGroup}
        onOpen={setOpenPrepareNewGroup}
        closeCreateGroupChat={closeBoard}
      />
    </div>
  )
}
