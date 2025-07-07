"use client"

import { CustomAvatar } from "@/components/materials"
import { useUser } from "@/hooks/user"

const AccountPage = () => {
  const user = useUser()!

  return (
    <div className="flex flex-col items-center gap-2 justify-center h-screen w-screen p-10 text-white">
      <h1 className="text-2xl font-bold">Account Page</h1>
      <CustomAvatar
        src={user.Profile?.avatar}
        className="bg-regular-violet-cl"
        imgSize={45}
        fallback={user.Profile.fullName[0]}
      />
      <p>{user.Profile.fullName}</p>
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
