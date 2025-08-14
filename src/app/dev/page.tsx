"use client"

import { clientAxios } from "@/configs/axios"
import { useEffect, useState } from "react"

type TCountAllDataFromES = {
  success: true
  messages: number
  users: number
}

export default function DevPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [data, setData] = useState<string>("")
  const [isFetchingCountAllData, setIsFetchingCountAllData] = useState<boolean>(false)

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

  const fetchCountAllData = async () => {
    try {
      setIsFetchingCountAllData(true)
      const response = await clientAxios.get<TCountAllDataFromES>("/dev/count-all-data-from-es")
      setData(JSON.stringify(response.data, null, 2))
    } catch (error) {
      console.log(">>> error:", error)
    } finally {
      setIsFetchingCountAllData(false)
    }
  }

  useEffect(() => {
    fetchCountAllData()
  }, [])

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

        {!isFetchingCountAllData && (
          <div className="mt-12">
            {data && (
              <div className="text-white">
                <pre>{data}</pre>
              </div>
            )}
          </div>
        )}

        <button
          className="bg-violet-500 text-white p-2 rounded-md mt-12"
          onClick={fetchCountAllData}
          disabled={isFetchingCountAllData}
        >
          {isFetchingCountAllData ? "Fetching..." : "Refresh"}
        </button>
      </div>
    </div>
  )
}
