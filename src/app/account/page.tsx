"use client"

import { useUser } from "@/hooks/user"

const AccountPage = () => {
   const user = useUser()!

   return (
      <div className="flex flex-col items-center gap-2 justify-center h-screen w-screen p-10 text-white">
         <h1 className="text-2xl font-bold">Account Page</h1>
         <p>
            <span>ID: </span>
            <span>{user.id}</span>
         </p>
         <p>
            <span>Email: </span>
            <span>{user.email}</span>
         </p>
      </div>
   )
}

export default AccountPage
