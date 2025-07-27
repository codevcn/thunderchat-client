import { groupChatService } from "@/services/group-chat.service"
import { groupMemberService } from "@/services/group-member.service"
import { createAsyncThunk } from "@reduxjs/toolkit"

export const fetchGroupChatThunk = createAsyncThunk(
  "messages/fetchGroupChat",
  groupChatService.fetchGroupChat
)

export const fetchGroupChatMembersThunk = createAsyncThunk(
  "messages/fetchGroupChatMembers",
  groupMemberService.fetchGroupChatMembers
)
