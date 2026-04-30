"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

type SocketUser = {
  id: string | number;
  name: string;
  role: string;
};

const socketUrl = process.env.NEXT_PUBLIC_SERVICES_URL?.replace("/api", "");

export const socket: Socket = io(socketUrl, {
  path: "/socket.io/",
  transports: ["polling", "websocket"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  withCredentials: true,
});

function useSocketPresence(user: SocketUser | null) {
  useEffect(() => {
    if (!user?.id) {
      if (socket.connected) socket.disconnect();
      return;
    }

    const onConnect = () => {
      socket.emit("user:login", { id: user.id, name: user.name, role: user.role });
    };

    const onDisconnect = (_reason: string) => {};

    const onConnectError = (_err: Error) => {};

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    if (!socket.connected) {
      socket.connect();
    } else {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, [user?.id]);
}

export default function PresencePing({ user }: { user: SocketUser | null }) {
  useSocketPresence(user);
  return null;
}
