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
   friend_request_action = "friend_request_action",
}
