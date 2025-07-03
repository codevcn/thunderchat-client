// >>> fix this: remove
import { dev_test_values } from "../../../temp/test"

import { X, Info, AtSign } from "lucide-react"
import { openInfoBar } from "@/redux/conversations/conversations-slice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { IconButton } from "@/components/materials/icon-button"
import { ProgressiveImage } from "@/components/materials/progressive-image"
import { setLastSeen } from "@/utils/helpers"
import { robotoFont } from "@/utils/fonts"
import type { TUserWithProfile } from "@/utils/types/be-api"

const Avatar = ({ recipient }: { recipient: TUserWithProfile }) => {
   return (
      <div className="aspect-square w-full bg-purple-200 relative">
         <div className="w-full h-full cursor-default">
            {recipient.Profile?.avatar ? (
               <ProgressiveImage
                  src={recipient?.Profile?.avatar}
                  className="w-full h-full"
                  prgssClassName="w-full h-full bg-regular-black-cl"
               />
            ) : (
               <div
                  className={`${robotoFont.variable} w-full h-full flex justify-center font-roboto items-center overflow-hidden text-user-avt-fsize bg-user-avt-bgimg`}
               >
                  {recipient.Profile?.fullName[0] || "U"}
               </div>
            )}
         </div>

         <div className="flex justify-end flex-col absolute bottom-0 left-0 bg-modal-text-bgimg min-h-[100px] w-full px-6 pb-2">
            <p className="text-xl font-bold">{recipient.Profile?.fullName || "Unnamed"}</p>
            <span className="text-sm opacity-60">
               {"Last seen " + setLastSeen(dev_test_values.user_1.lastOnline)}
            </span>
         </div>
      </div>
   )
}

const ProfileInfo = ({ recipient }: { recipient: TUserWithProfile }) => {
   const { Profile } = recipient

   return (
      <div className="flex flex-col gap-2 px-2 pt-[0.87rem] pb-[0.87rem]">
         {Profile?.about && (
            <div className="flex gap-4 items-center px-4 py-2">
               <div className="text-regular-icon-cl">
                  <Info color="inherit" />
               </div>
               <div className="w-info-bar">
                  <p className="text-base leading-5 w-full">{Profile.about}</p>
                  <p className="text-regular-text-secondary-cl mt-1">Bio</p>
               </div>
            </div>
         )}

         {recipient.email && (
            <div className="flex gap-4 items-center px-4 py-2">
               <div className="text-regular-icon-cl">
                  <AtSign color="inherit" />
               </div>
               <div className="w-info-bar">
                  <p className="text-base leading-5 w-full">{recipient.email}</p>
                  <p className="text-regular-text-secondary-cl mt-1">Username</p>
               </div>
            </div>
         )}
      </div>
   )
}

export const InfoBar = () => {
   const { infoBarIsOpened } = useAppSelector(({ conversations }) => conversations)
   const recipient = useAppSelector(({ messages }) => messages.directChat?.Recipient)
   const dispatch = useAppDispatch()

   const handleOpenInfoBar = (open: boolean) => {
      dispatch(openInfoBar(open))
   }

   return (
      <div
         className={`${infoBarIsOpened ? "right-0" : "-right-slide-info-mb-bar screen-large-chatting:-right-slide-info-bar"} flex flex-col bg-regular-info-bar-bgcl screen-large-chatting:bg-regular-dark-gray-cl w-info-bar-mb screen-large-chatting:w-info-bar h-full overflow-hidden border-l-regular-hover-card-cl border-l z-[60] transition-[right] absolute duration-[0.4s] screen-large-chatting:duration-300 ease-slide-info-bar-timing`}
      >
         <div className="flex items-center gap-[15px] h-header py-[7px] px-3">
            <IconButton
               className="flex justify-center items-center h-10 w-10 text-regular-icon-cl"
               onClick={() => handleOpenInfoBar(false)}
            >
               <X />
            </IconButton>
            <div className="text-xl">
               <h2>User Info</h2>
            </div>
         </div>

         {recipient && (
            <div className="h-chat-container w-full">
               <div className="overflow-y-scroll STYLE-styled-scrollbar h-full bg-regular-info-bar-bgcl">
                  <Avatar recipient={recipient} />

                  <ProfileInfo recipient={recipient} />
               </div>
            </div>
         )}
      </div>
   )
}
