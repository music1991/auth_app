"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

const urlService = process.env.NEXT_PUBLIC_SERVICES_URL;
// 1. Exportamos la instancia del socket. 
// Esto permite que el Admin u otros componentes importen 'socket' 
// y usen la MISMA conexión sin crear duplicados.
export const socket: Socket = io(urlService, { 
  transports: ['websocket'],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

/**
 * Hook interno para manejar la lógica de conexión
 */
function useSocketPresence(user: any) {
  useEffect(() => {
    if (!user) {
      if (socket.connected) socket.disconnect();
      return;
    }

/*     console.log("llega", user)
    console.log("llega variable", urlService) */

    const onConnect = () => {
        
      console.log("✅ Conectado al servidor de presencia");
      // Enviamos la identidad apenas conectamos
      socket.emit("user:login", {
        id: user.id,
        name: user.name,
        role: user.role
      });
    };

    const onDisconnect = () => {
      console.log("❌ Desconectado del servidor de presencia");
    };

    // Escuchamos eventos de conexión para re-emitir el login si el server se cae y vuelve
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Si ya está conectado (por una navegación previa), emitimos directo
    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    // Limpieza: Cuando el Layout se desmonta (Logout o cerrar pestaña)
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [user]);
}

/**
 * Componente que inyectas en tu SiteLayout
 */
export default function PresencePing({ user }: { user: any }) {
  // Activamos el hook de presencia

  useSocketPresence(user);

  // No renderiza nada, funciona como un "agente" en segundo plano
  return null;
}