import type { AxiosError, HttpStatusCode } from "axios"
import type { TDirectMessage, TDirectChat } from "@/utils/types/be-api"

export type TStateDirectMessage = TDirectMessage & {
   isNewMsg?: boolean
}

export type TDirectChatWithMessages = TDirectChat & { messages: TDirectMessage[] }

export type THttpErrorResBody =
   | {
        name: string
        message: string
        timestamp: string
        isUserError: boolean
     }
   | string

export type TAxiosError = {
   originalError: AxiosError<THttpErrorResBody>
   statusCode: number
   message: string
   isUserError: boolean
   clientMessage: string
}

export type TSuccess = {
   success: boolean // always true
}

export type TDirectChatCard = {
   id: number
   avatar: string
   title: string
   subtitle: string
   lastMessageTime: string
   pinIndex: number
}

export type TUnknownObject = {
   [key: number | string]: any
}

export type TUnknownFunction<P, R> = (...args: P[]) => R

export type TSendDirectMessageErrorRes = {
   isError: boolean
   message: string
}

export type TSendMessageCallback = (data: TSendDirectMessageErrorRes | TSuccess) => void

export type THandledAxiosError = {
   originalError: unknown
   statusCode: HttpStatusCode
   message: string
   isUserError: boolean
}

export type TFormData = {
   [key: string]: FormDataEntryValue | FormDataEntryValue[] | TCheckboxValue | undefined
}

export type TLastPageAccessed = {
   current: string
   previous: string
}

export type TEmoji = {
   src: string
   name: string
}

export type TCheckboxValue = "on" | undefined

export type TMessageStateUpdates = {
   msgId: number
   msgUpdates: Partial<TStateDirectMessage>
}

export type TPlacement = "top" | "right" | "bottom" | "left"

export type TAlign = "center" | "start" | "end"
