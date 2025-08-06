export class DirectChatError extends Error {
  constructor(message: string) {
    super(message)

    this.name = "Direct Chat Error"
  }
}

export class GroupChatError extends Error {
  constructor(message: string) {
    super(message)

    this.name = "Group Chat Error"
  }
}
