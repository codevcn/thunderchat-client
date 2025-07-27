import { pureNavigator } from "@/utils/helpers"
import axios, { HttpStatusCode } from "axios"
import type { AxiosRequestConfig } from "axios"

const NEXT_PUBLIC_SERVER_ENDPOINT = process.env.NEXT_PUBLIC_SERVER_ENDPOINT

export const clientAxios = axios.create({ baseURL: NEXT_PUBLIC_SERVER_ENDPOINT })

clientAxios.interceptors.response.use((response) => {
  if (response.status === HttpStatusCode.Unauthorized) {
    pureNavigator("/")
  }
  return response
})

export const requestConfig: AxiosRequestConfig = {
  withCredentials: true,
}

export const clientSideAxios = axios.create({ baseURL: "/" })
