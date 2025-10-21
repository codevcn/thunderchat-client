declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production"
      NEXT_PUBLIC_SERVER_ENDPOINT: string
      NEXT_PUBLIC_SERVER_ENDPOINT_DEV: string
      NEXT_PUBLIC_SERVER_HOST: string
      NEXT_PUBLIC_SERVER_HOST_DEV: string
      NEXT_PUBLIC_WEBSOCKET_MESSAGING_ENDPOINT_DEV: string
      NEXT_PUBLIC_WEBSOCKET_CALLING_ENDPOINT_DEV: string
      NEXT_PUBLIC_WEBSOCKET_MESSAGING_ENDPOINT: string
      NEXT_PUBLIC_WEBSOCKET_CALLING_ENDPOINT: string
    }
  }
}

export {}
