import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL ?? "https://owlbearapi.sunitro.de";

export const socket = io(socketUrl, {
  autoConnect: false,
  path: "/socket.io/",
  transports: ["websocket", "polling"]
});


