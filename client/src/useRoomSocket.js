import React from "react";
import { socket } from "./socket.js";

export function useRoomSocket() {
  const [state, setState] = React.useState(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const onRoomState = (nextState) => {
      setState(nextState);
      setError("");
    };

    const onGameError = (e) => {
      setError(e?.message ?? "Erreur inconnue.");
    };

    socket.on("room:state", onRoomState);
    socket.on("game:error", onGameError);

    return () => {
      socket.off("room:state", onRoomState);
      socket.off("game:error", onGameError);
    };
  }, []);

  const ensureConnection = React.useCallback(() => {
    if (!socket.connected) socket.connect();
  }, []);

  const emit = React.useCallback((event, payload) => {
    if (payload === undefined) {
      socket.emit(event);
      return;
    }
    socket.emit(event, payload);
  }, []);

  const disconnect = React.useCallback(() => {
    socket.disconnect();
  }, []);

  return {
    state,
    setState,
    error,
    setError,
    ensureConnection,
    emit,
    disconnect
  };
}
