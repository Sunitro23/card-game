import crypto from "node:crypto";
import { ROOM_CODE_CHARS } from "./constants.js";

export function uid(prefix) {
  return `${prefix}_${crypto.randomBytes(4).toString("hex")}`;
}

export function rollDie(sides = 6) {
  return Math.floor(Math.random() * sides) + 1;
}

export function shuffle(cards) {
  return cards.sort(() => Math.random() - 0.5);
}

export function generateRoomCode() {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

