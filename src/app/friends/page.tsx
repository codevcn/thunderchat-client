"use client"

import { FriendsList } from "./friends-list"
import { AppNavigation } from "@/components/layout/app-navigation"
import { AddFriend } from "./add-friend"
import { Contact, Ban, Mail } from "lucide-react"
import { FriendRequests } from "./friend-requests"
import { Blocked } from "./blocked"
import { useSearchParams } from "next/navigation"
import { ETabs } from "./sharing"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/materials"

type TTab = {
   key: ETabs
   label: string
   icon: React.JSX.Element
}

const tabs: TTab[] = [
   {
      key: ETabs.FRIENDS_LIST,
      label: "My Friends",
      icon: <Contact className="h-5 w-5" />,
   },
   {
      key: ETabs.ADD_FRIEND_REQUESTS,
      label: "Friend Invitations",
      icon: <Mail className="h-5 w-5" />,
   },
   {
      key: ETabs.BLOCKED,
      label: "Blocked",
      icon: <Ban className="h-5 w-5" />,
   },
]

const Main = () => {
   const searchParams = useSearchParams()
   const qsAction = searchParams.get("action") || ETabs.FRIENDS_LIST
   const router = useRouter()

   const changeTab = (key: string) => {
      router.push(`/friends?action=${key}`)
   }

   return (
      <div className="w-full px-5 pt-5 pb-3 relative">
         <div className="h-fit w-full">
            <Tabs defaultValue={ETabs.FRIENDS_LIST} onValueChange={changeTab} value={qsAction}>
               <TabsList className="gap-1 p-0">
                  {tabs.map(({ key, label, icon }) => (
                     <TabsTrigger key={key} value={key}>
                        <div className="flex items-center gap-x-1">
                           {icon}
                           {label}
                        </div>
                     </TabsTrigger>
                  ))}
               </TabsList>
               <TabsContent value={ETabs.FRIENDS_LIST}>
                  <FriendsList />
               </TabsContent>
               <TabsContent value={ETabs.ADD_FRIEND_REQUESTS}>
                  <FriendRequests />
               </TabsContent>
               <TabsContent value={ETabs.BLOCKED}>
                  <Blocked />
               </TabsContent>
            </Tabs>
         </div>
         <AddFriend />
      </div>
   )
}

const FriendsPage = () => {
   return (
      <div className="flex min-h-screen bg-regular-black-cl w-full relative">
         <AppNavigation />
         <Main />
      </div>
   )
}

export default FriendsPage
