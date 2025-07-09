import { directChatService } from "@/services/direct-chat.service"
import { groupChatService } from "@/services/group-chat.service"
import { groupMemberService } from "@/services/group-member.service"
import { createAsyncThunk } from "@reduxjs/toolkit"

export const fetchDirectChatThunk = createAsyncThunk(
  "messages/fetchDirectChat",
  directChatService.fetchDirectChat
)

export const fetchGroupChatThunk = createAsyncThunk(
  "messages/fetchGroupChat",
  groupChatService.fetchGroupChat
)

export const fetchGroupChatMembersThunk = createAsyncThunk(
  "messages/fetchGroupChatMembers",
  groupMemberService.fetchGroupChatMembers
)
