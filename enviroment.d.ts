declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production"
      NEXT_PUBLIC_SERVER_ENDPOINT: string
      NEXT_PUBLIC_SERVER_ENDPOINT_DEV: string
      NEXT_PUBLIC_SERVER_HOST: string
      NEXT_PUBLIC_SERVER_HOST_DEV: string
    }
  }
}

export {}
