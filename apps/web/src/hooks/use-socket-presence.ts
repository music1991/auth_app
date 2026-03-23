"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

const urlService = process.env.NEXT_PUBLIC_SERVICES_URL;
const socketUrl = urlService?.replace('/api', '');

console.log("🔗 Intentando conectar socket a:", socketUrl);
export const socket: Socket = io(socketUrl, { 
   path: "/socket.io/",
  transports: ['polling', 'websocket'], 
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  withCredentials: true
});

function useSocketPresence(user: any) {
  useEffect(() => {
    if (!user?.id) {
      if (socket.connected) socket.disconnect();
      return;
    }

    const onConnect = () => {
      console.log("✅ Socket conectado. Enviando login para:", user.name);
      socket.emit("user:login", {
        id: user.id,
        name: user.name,
        role: user.role
      });
    };

    const onDisconnect = (reason: string) => {
      console.log("❌ Socket desconectado. Motivo:", reason);
    };

    const onConnectError = (err: any) => {
      console.error("⚠️ Error de conexión Socket:", err.message);
    };

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

export default function PresencePing({ user }: { user: any }) {
  useSocketPresence(user);
  return null;
}
