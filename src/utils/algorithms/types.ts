export type TUniqueObjectQueueItem = {
   id: number // ID của phần tử trong queue
}

export type TUniqueObjectQueueItems<T> = {
   [key: number]: T
}

export type TObjectQueueItems<T> = {
   [key: number]: T
}
