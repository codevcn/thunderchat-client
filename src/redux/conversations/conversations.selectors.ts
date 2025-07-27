import { createSelector } from "reselect"
import { RootState } from "../store"

export const selectDirectChat = (id: number) =>
  createSelector(
    ({ conversations }: RootState) => conversations.conversations,
    (searchResults) => searchResults?.find((result) => result.id === id)
  )

export const sortDirectChatsByPinned = createSelector(
  ({ conversations }: RootState) => conversations.conversations,
  (directChats) => {
    if (directChats && directChats.length > 0) {
      return directChats // Return conversations as they are, sorting is handled in component
    }
    return null
  }
)
