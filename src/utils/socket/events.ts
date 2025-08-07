export enum ESocketInitEvents {
  connect_error = "connect_error",
  connect = "connect",
}

export enum ESocketEvents {
  send_message_direct = "send_message:direct",
  error = "error",
  send_friend_request = "friend_request:send",
  recovered_connection = "recovered_connection",
  message_seen_direct = "message_seen:direct",
  typing_direct = "typing:direct",
  pin_message = "pin_message",
  pin_direct_chat = "pin_direct_chat",
  friend_request_action = "friend_request_action",
  new_conversation = "new_conversation",
  broadcast_user_online_status = "broadcast_user_online_status",
  check_user_online_status = "check_user_online_status",
  join_direct_chat_room = "join_direct_chat_room",
}
