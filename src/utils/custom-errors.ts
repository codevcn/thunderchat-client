export class DirectChatError extends Error {
   constructor(message: string) {
      super(message)

      this.name = "Direct Chat Error"
   }
}
