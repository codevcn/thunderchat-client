import { getCurrentPathOnBrowserURL, pureNavigator } from "@/utils/helpers"
import axios, { HttpStatusCode } from "axios"
import type { AxiosRequestConfig } from "axios"

export const NEXT_PUBLIC_SERVER_ENDPOINT =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_SERVER_ENDPOINT
    : process.env.NEXT_PUBLIC_SERVER_ENDPOINT_DEV

export const clientAxios = axios.create({ baseURL: NEXT_PUBLIC_SERVER_ENDPOINT })

clientAxios.interceptors.request.use((config) => {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("jwt_token_auth="))
    ?.split("=")[1]
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

clientAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === HttpStatusCode.Unauthorized &&
      getCurrentPathOnBrowserURL() !== "/" &&
      !getCurrentPathOnBrowserURL().startsWith("/admin")
    ) {
      pureNavigator("/")
    }
    throw error
  }
)

export const requestConfig: AxiosRequestConfig = {
  withCredentials: true,
}

export const clientSideAxios = axios.create({ baseURL: "/" })
