import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  createRoom,
  getVisibleState,
  joinRoom,
  leaveBySocket,
  playersBySocketId,
  rooms,
  spectateRoom,
  standTwentyOne,
  startGame
} from "../src/game.js";
import {
  AWALE_SEEDS_PER_PIT,
  AWALE_TOTAL_PITS,
  ENERGY_PER_TURN,
  STARTING_HP,
  TWENTY_ONE_STARTING_BET,
  TWENTY_ONE_STARTING_LIVES,
  TWENTY_ONE_STARTING_TARGET,
  TWENTY_ONE_TRUMPS_PER_ROUND
} from "../src/core/constants.js";

function resetState() {
  rooms.clear();
  playersBySocketId.clear();
}

function createTwoPlayerRoom(gameType = "card_duel") {
  const room = createRoom("socket-a", "Alice", gameType);
  joinRoom(room.code, "socket-b", "Bob");
  return room;
}

describe("room lifecycle", () => {
  beforeEach(resetState);

  it("creates rooms, joins players, and tracks sockets", () => {
    const room = createTwoPlayerRoom("unknown-mode");

    assert.equal(room.gameType, "card_duel");
    assert.equal(room.players.length, 2);
    assert.equal(room.hostPlayerId, room.players[0].id);
    assert.deepEqual(playersBySocketId.get("socket-a"), { code: room.code, playerId: room.players[0].id });
    assert.deepEqual(playersBySocketId.get("socket-b"), { code: room.code, playerId: room.players[1].id });
  });

  it("adds spectators without exposing a player hand", () => {
    const room = createTwoPlayerRoom();
    spectateRoom(room.code, "socket-s", "Sam");

    const visible = getVisibleState(room, null);

    assert.equal(visible.viewerRole, "spectator");
    assert.equal(visible.spectatorCount, 1);
    assert.equal(visible.players.length, 2);
    assert.ok(visible.players.every((player) => player.hand === undefined));
  });

  it("removes sockets and promotes a new host when the host leaves", () => {
    const room = createTwoPlayerRoom();
    const secondPlayer = room.players[1];

    const code = leaveBySocket("socket-a");

    assert.equal(code, room.code);
    assert.equal(room.players.length, 1);
    assert.equal(room.hostPlayerId, secondPlayer.id);
    assert.equal(playersBySocketId.has("socket-a"), false);
  });
});

describe("card duel", () => {
  beforeEach(resetState);

  it("starts with combat state, energy, and per-player hidden hands", () => {
    const room = createTwoPlayerRoom("card_duel");
    startGame(room.code, room.hostPlayerId);

    const current = room.players[room.turnIndex % room.players.length];
    const visibleForCurrent = getVisibleState(room, current.id);
    const visibleCurrent = visibleForCurrent.players.find((player) => player.id === current.id);
    const visibleOpponent = visibleForCurrent.players.find((player) => player.id !== current.id);

    assert.equal(room.phase, "combat");
    assert.equal(room.cardDuel.lastEvent, null);
    assert.equal(current.energy, ENERGY_PER_TURN);
    assert.ok(room.players.every((player) => player.hp === STARTING_HP));
    assert.ok(room.players.every((player) => player.hand.length === 1));
    assert.equal(visibleCurrent.hand.length, 1);
    assert.equal(visibleOpponent.hand, undefined);
  });

  it("requires the host to start a game", () => {
    const room = createTwoPlayerRoom("card_duel");
    const guest = room.players[1];

    assert.throws(() => startGame(room.code, guest.id), /Seul l'h/);
    assert.equal(room.phase, "lobby");
  });
});

describe("awale", () => {
  beforeEach(resetState);

  it("starts with a full board and legal moves for players only", () => {
    const room = createTwoPlayerRoom("awale");
    spectateRoom(room.code, "socket-s", "Sam");
    startGame(room.code, room.hostPlayerId);

    const current = room.players[room.turnIndex % room.players.length];
    const visibleForCurrent = getVisibleState(room, current.id);
    const spectatorVisible = getVisibleState(room, null);

    assert.equal(room.phase, "awale");
    assert.equal(room.awale.board.length, AWALE_TOTAL_PITS);
    assert.ok(room.awale.board.every((seeds) => seeds === AWALE_SEEDS_PER_PIT));
    assert.deepEqual(room.awale.captured, [0, 0]);
    assert.equal(visibleForCurrent.awale.legalMoves.length, 6);
    assert.deepEqual(spectatorVisible.awale.legalMoves, []);
  });
});

describe("twenty one", () => {
  beforeEach(resetState);

  it("starts rounds with hidden number cards and trump hands", () => {
    const room = createTwoPlayerRoom("twenty_one");
    startGame(room.code, room.hostPlayerId);

    const viewer = room.players[0];
    const opponent = room.players[1];
    const visible = getVisibleState(room, viewer.id);
    const visibleViewer = visible.players.find((player) => player.id === viewer.id);
    const visibleOpponent = visible.players.find((player) => player.id === opponent.id);

    assert.equal(room.phase, "twenty_one");
    assert.equal(room.twentyOne.target, TWENTY_ONE_STARTING_TARGET);
    assert.equal(room.twentyOne.bet, TWENTY_ONE_STARTING_BET);
    assert.ok(room.players.every((player) => player.twentyOne.lives === TWENTY_ONE_STARTING_LIVES));
    assert.ok(room.players.every((player) => player.twentyOne.cards.length === 2));
    assert.ok(room.players.every((player) => player.hand.length === TWENTY_ONE_TRUMPS_PER_ROUND));
    assert.ok(visibleViewer.twentyOne.cards.every((card) => card.value !== null));
    assert.ok(visibleOpponent.twentyOne.cards.every((card) => card.value === null));
  });

  it("starts a new round when both players stand without acting", () => {
    const room = createTwoPlayerRoom("twenty_one");
    startGame(room.code, room.hostPlayerId);

    const first = room.players[room.turnIndex % room.players.length];
    standTwentyOne(room.code, first.id);
    const second = room.players[room.turnIndex % room.players.length];
    standTwentyOne(room.code, second.id);

    assert.equal(room.phase, "twenty_one");
    assert.equal(room.twentyOne.round, 2);
    assert.equal(room.twentyOne.lastRoundResult.tie, true);
    assert.ok(room.players.every((player) => player.twentyOne.lives === TWENTY_ONE_STARTING_LIVES));
    assert.ok(room.players.every((player) => player.twentyOne.manualStand === false));
  });
});
