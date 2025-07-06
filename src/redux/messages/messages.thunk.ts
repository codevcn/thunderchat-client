import { messageService } from "@/services/message.service"
import { createAsyncThunk } from "@reduxjs/toolkit"

export const fetchDirectMessagesThunk = createAsyncThunk(
  "messages/fetchDirectMessages",
  messageService.fetchDirectMessages
)

export const fetchGroupMessagesThunk = createAsyncThunk(
  "messages/fetchGroupMessages",
  messageService.fetchGroupMessages
)
