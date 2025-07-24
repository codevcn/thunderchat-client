"use client"

import { clientAxios } from "@/configs/axios"
import { useState } from "react"

export default function DevPage() {
  const [isLoading, setIsLoading] = useState(false)

  const syncAllDataToES = async () => {
    try {
      setIsLoading(true)
      const response = await clientAxios.get("/dev/sync-all-data-to-es")
      console.log(">>> response:", { data: response.data })
    } catch (error) {
      console.log(">>> error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAllDataFromES = async () => {
    try {
      setIsLoading(true)
      const response = await clientAxios.get("/dev/delete-all-data-from-es")
      console.log(">>> response:", { data: response.data })
    } catch (error) {
      console.log(">>> error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen">
      <div className="flex flex-col items-center justify-center">
        <button onClick={syncAllDataToES} disabled={isLoading}>
          {isLoading ? "Syncing..." : "Sync all data to ES"}
        </button>

        <button
          className="bg-red-500 text-white p-2 rounded-md mt-12"
          onClick={deleteAllDataFromES}
          disabled={isLoading}
        >
          {isLoading ? "Deleting..." : "Delete all data from ES"}
        </button>
      </div>
    </div>
  )
}
