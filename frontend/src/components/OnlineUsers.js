import { useEffect, useState } from "react";
import { connectSocket } from "../services/socketService";

// Shows how many users are currently online, updated live from the server's
// presence:updated event. See docs/API_CONTRACT.md (2).
function OnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const socket = connectSocket();

    function handlePresenceUpdated(payload) {
      setOnlineUsers(Array.isArray(payload && payload.onlineUsers) ? payload.onlineUsers : []);
    }

    socket.on("presence:updated", handlePresenceUpdated);

    return () => {
      socket.off("presence:updated", handlePresenceUpdated);
    };
  }, []);

  const names = onlineUsers.map((user) => user.fullName).join(", ");

  return (
    <span className="online-indicator" title={names || "No one online"}>
      <span className="online-dot" aria-hidden="true" />
      {onlineUsers.length} online
    </span>
  );
}

export default OnlineUsers;
