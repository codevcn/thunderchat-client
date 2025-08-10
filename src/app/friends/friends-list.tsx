"use client"

import type { TGetFriendsData, TUserWithProfile } from "@/utils/types/be-api"
import { CustomAvatar, CustomPopover, DefaultAvatar, TextField } from "@/components/materials"
import { Spinner } from "@/components/materials/spinner"
import { useUser } from "@/hooks/user"
import { friendService } from "@/services/friend.service"
import axiosErrorHandler from "@/utils/axios-error-handler"
import { useEffect, useMemo, useRef, useState } from "react"
import { EChatType, EPaginations } from "@/utils/enums"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { toast } from "@/components/materials"
import { CircleMinus, Contact, Ellipsis, MessageCircleMore, Search } from "lucide-react"
import { useNavToConversation } from "@/hooks/navigation"
import { directChatService } from "@/services/direct-chat.service"
import { useDebounce } from "@/hooks/debounce"

type TFriendCardProps = {
  friend: TGetFriendsData
  user: TUserWithProfile
}

const FriendCard = ({ friend, user }: TFriendCardProps) => {
  const { Recipient, Sender } = friend
  const friendOfUser = user.id === Recipient.id ? Sender : Recipient
  const { Profile, email } = friendOfUser
  const navToDirectChat = useNavToConversation()
  const [isRemovingFriend, setIsRemovingFriend] = useState<boolean>(false)

  const navToChatWithFriend = () => {
    directChatService.findConversationWithOtherUser(friendOfUser.id).then((res) => {
      if (res) {
        navToDirectChat(res.id, EChatType.DIRECT)
      }
    })
  }

  const removeFriend = () => {
    setIsRemovingFriend(true)
    friendService
      .removeFriend(friendOfUser.id)
      .then((res) => {
        if (res) {
          eventEmitter.emit(EInternalEvents.FRIEND_REMOVED, friend.id)
        }
      })
      .catch((error) => {
        toast.error(axiosErrorHandler.handleHttpError(error).message)
      })
      .finally(() => {
        setIsRemovingFriend(false)
      })
  }

  return (
    <div className="flex justify-between items-center w-full mb-3 gap-x-5 px-4 py-3 bg-regular-modal-board-bgcl rounded-md">
      <div className="flex items-center gap-x-3">
        <div>
          <CustomAvatar
            fallback={Profile?.fullName[0].toUpperCase()}
            src={Profile?.avatar}
            imgSize={45}
            alt={Profile?.fullName}
            className="bg-regular-violet-cl text-2xl"
          />
        </div>
        <div className="h-fit">
          <div>
            <span className="mb-1 font-bold">{Profile?.fullName || "Unnamed"}</span>
          </div>
          <div className="text-sm text-regular-icon-cl">
            <span>{email}</span>
          </div>
        </div>
      </div>
      <div className="text-regular-placeholder-cl">
        <CustomPopover
          trigger={
            <button className="text-regular-white-cl">
              <Ellipsis size={20} />
            </button>
          }
          align="end"
        >
          <div
            style={{
              pointerEvents: isRemovingFriend ? "none" : "auto",
            }}
            className="py-2 bg-regular-modal-board-bgcl rounded-lg border-white/20 border-solid border"
          >
            <button
              onClick={navToChatWithFriend}
              className="text-regular-white-cl w-full px-4 py-2 flex items-center gap-x-2 hover:bg-regular-hover-bgcl"
            >
              <MessageCircleMore size={20} />
              <span>Chat</span>
            </button>
            <button
              onClick={removeFriend}
              className="text-regular-white-cl w-full px-4 py-2 flex items-center gap-x-2 hover:bg-regular-hover-bgcl"
            >
              {isRemovingFriend ? (
                <Spinner size="small" className="m-auto" />
              ) : (
                <>
                  <CircleMinus size={20} />
                  <span>Remove Friend</span>
                </>
              )}
            </button>
          </div>
        </CustomPopover>
      </div>
    </div>
  )
}

type TLoadMoreBtnProps = {
  onLoadMore: () => void
  hidden: boolean
}

const LoadMoreBtn = ({ onLoadMore, hidden }: TLoadMoreBtnProps) => {
  const [isLastFriend, setIsLastFriend] = useState<boolean>(false)

  useEffect(() => {
    const handleLastFriend = () => {
      setIsLastFriend(true)
    }

    eventEmitter.on(EInternalEvents.LAST_FRIEND_REQUEST, handleLastFriend)

    return () => {
      eventEmitter.removeListener(EInternalEvents.LAST_FRIEND_REQUEST, handleLastFriend)
    }
  }, [])

  return (
    <div className="flex mt-7" hidden={isLastFriend || hidden}>
      <button
        onClick={onLoadMore}
        className="hover:bg-regular-hover-bgcl m-auto cursor-pointer px-5 py-2 rounded-md bg-regular-button-bgcl"
      >
        Load More
      </button>
    </div>
  )
}

export const FriendsList = () => {
  const [friends, setFriends] = useState<TGetFriendsData[]>([])
  const [isFetchingFriends, setIsFetchingFriends] = useState<boolean>(false)
  const user = useUser()!
  const tempFlagUseEffectRef = useRef<boolean>(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounce = useDebounce()
  const [isSearchingFriends, setIsSearchingFriends] = useState<boolean>(false)
  const [friendsSearchResult, setFriendsSearchResult] = useState<TGetFriendsData[]>()

  const filteredFriends = useMemo(() => {
    return friends
  }, [friends])

  const fetchFriendsHandler = async (lastFriendId?: number) => {
    setIsFetchingFriends(true)
    friendService
      .getFriends({
        limit: EPaginations.FRIENDS_PAGE_SIZE,
        userId: user.id,
        lastFriendId,
      })
      .then((friends) => {
        if (friends && friends.length > 0) {
          setFriends((pre) => [...pre, ...friends])
        } else {
          eventEmitter.emit(EInternalEvents.LAST_FRIEND_REQUEST)
        }
      })
      .catch((error) => {
        toast.error(axiosErrorHandler.handleHttpError(error).message)
      })
      .finally(() => {
        setIsFetchingFriends(false)
      })
  }

  const onLoadMore = () => {
    if (friends) {
      const friendsLen = friends.length
      if (friendsLen > 0) {
        fetchFriendsHandler(friends[friendsLen - 1].id)
      }
    }
  }

  const catchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      searchUsers()
    }
  }

  const searchUsers = debounce(() => {
    const inputValue = inputRef.current?.value.trim()
    console.log(">>> inputValue:", inputValue)
    if (inputValue && inputValue.length > 0) {
      setIsSearchingFriends(true)
      friendService
        .searchFriendsByKeyword(inputValue)
        .then((friends) => {
          console.log(">>> friends:", friends)
          setFriendsSearchResult(friends)
        })
        .catch((error) => {
          toast.error(axiosErrorHandler.handleHttpError(error).message)
        })
        .finally(() => {
          setIsSearchingFriends(false)
        })
    } else {
      setFriendsSearchResult(undefined)
    }
  }, 300)

  const listenFriendRemoved = (friendId: number) => {
    setFriends((pre) => pre.filter((f) => f.id !== friendId))
  }

  useEffect(() => {
    if (tempFlagUseEffectRef.current) {
      tempFlagUseEffectRef.current = false
      if (!friends || friends.length === 0) {
        fetchFriendsHandler()
      }
    }
    eventEmitter.on(EInternalEvents.FRIEND_REMOVED, listenFriendRemoved)
    return () => {
      eventEmitter.removeListener(EInternalEvents.FRIEND_REMOVED, listenFriendRemoved)
    }
  }, [])

  return (
    <div className="mt-2 border-t border-regular-hover-card-cl border-solid pt-3">
      <div className="pt-2">
        <TextField
          placeholder="Enter email or name of friend here..."
          classNames={{ input: "w-full py-1 text-base" }}
          suffixIcon={<Search className="h-5 w-5" />}
          onPressEnter={catchEnter}
          onChange={searchUsers}
          ref={inputRef}
        />
      </div>
      <div className="mt-6">
        {friendsSearchResult ? (
          friendsSearchResult.length > 0 ? (
            friendsSearchResult.map((friend) => (
              <FriendCard key={friend.id} friend={friend} user={user} />
            ))
          ) : isSearchingFriends ? (
            <div className="flex flex-col items-center gap-4 pt-4">
              <Spinner size="medium" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 pt-4">
              <Contact className="w-16 h-16 text-regular-icon-cl" />
              <h3 className="text-lg font-medium text-regular-icon-cl text-center">
                No results found
              </h3>
              <p className="text-sm text-regular-icon-cl text-center max-w-[300px]">
                Please try again with a different keyword
              </p>
            </div>
          )
        ) : filteredFriends && filteredFriends.length > 0 ? (
          <>
            {filteredFriends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} user={user} />
            ))}
            <LoadMoreBtn onLoadMore={onLoadMore} hidden={isFetchingFriends} />
          </>
        ) : isFetchingFriends ? (
          <div className="flex flex-col items-center gap-4 pt-4">
            <Spinner size="medium" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 pt-4">
            <Contact className="w-16 h-16 text-regular-icon-cl" />
            <h3 className="text-lg font-medium text-regular-icon-cl text-center">No friends yet</h3>
            <p className="text-sm text-regular-icon-cl text-center max-w-[300px]">
              You can add friends by clicking the Add Friend button in the page corner
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
