import { EGroupChatRole } from "../enums"

export const convertGrChatMemRole = (role: EGroupChatRole) => {
  switch (role) {
    case EGroupChatRole.ADMIN:
      return "Admin"
    case EGroupChatRole.MEMBER:
      return "Member"
  }
}
