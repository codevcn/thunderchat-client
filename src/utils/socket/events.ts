export enum ESocketInitEvents {
  connect_error = "connect_error",
  connect = "connect",
}

export enum ESocketEvents {
  send_message_direct = "send_message:direct",
  send_message_group = "send_message:group",
  error = "error",
  send_friend_request = "friend_request:send",
  recovered_connection = "recovered_connection",
  message_seen_direct = "message_seen:direct",
  message_seen_group = "message_seen:group",
  typing_direct = "typing:direct",
  typing_group = "typing:group",
  pin_message = "pin_message",
  pin_message_group = "pin_message:group",
  pin_direct_chat = "pin_direct_chat",
  friend_request_action = "friend_request_action",
  new_conversation = "new_conversation",
  broadcast_user_online_status = "broadcast_user_online_status",
  check_user_online_status = "check_user_online_status",
  join_direct_chat_room = "join_direct_chat_room",
  join_group_chat_room = "join_group_chat_room",
  remove_group_chat_members = "remove_group_chat_members",
  add_group_chat_members = "add_group_chat_members",
  update_group_chat_info = "update_group_chat_info",
  update_user_info = "update_user_info",
}
