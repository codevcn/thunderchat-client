import { directChatService } from "@/services/direct-chat.service"
import { createAsyncThunk } from "@reduxjs/toolkit"

export const fetchDirectChatThunk = createAsyncThunk(
   "messages/fetchDirectChat",
   directChatService.fetchDirectChat
)
