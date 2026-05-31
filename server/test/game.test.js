import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  createRoom,
  getVisibleState,
  joinRoom,
  leaveBySocket,
  playersBySocketId,
  shootBerenikeShot,
  rooms,
  playTwentyOneTrump,
  returnToLobby,
  spectateRoom,
  standTwentyOne,
  startGame,
  useBerenikeItem
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

  it("keeps a permanent room roster while a chosen duel is running", () => {
    const room = createRoom("socket-a", "Alice", "card_duel");
    joinRoom(room.code, "socket-b", "Bob");
    joinRoom(room.code, "socket-c", "Chloe");
    const host = room.players[0];
    const opponent = room.players[1];
    const inactive = room.players[2];

    startGame(room.code, host.id, { gameType: "twenty_one", opponentPlayerId: opponent.id });

    assert.equal(room.gameType, "twenty_one");
    assert.deepEqual(room.players.map((player) => player.id), [host.id, opponent.id]);
    assert.deepEqual(room.allPlayers.map((player) => player.id), [host.id, opponent.id, inactive.id]);
    assert.equal(getVisibleState(room, inactive.id).viewerRole, "spectator");

    returnToLobby(room.code, host.id);

    assert.equal(room.phase, "lobby");
    assert.deepEqual(room.players.map((player) => player.id), [host.id, opponent.id, inactive.id]);
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
    assert.ok(visibleOpponent.twentyOne.cards.some((card) => card.hidden && card.value === null));
    assert.ok(visibleOpponent.twentyOne.cards.some((card) => !card.hidden && card.value !== null));
  });

  it("resolves the round when both players stand in sequence", () => {
    const room = createTwoPlayerRoom("twenty_one");
    startGame(room.code, room.hostPlayerId);

    const first = room.players[room.turnIndex % room.players.length];
    standTwentyOne(room.code, first.id);
    const second = room.players[room.turnIndex % room.players.length];
    standTwentyOne(room.code, second.id);

    assert.equal(room.phase, "twenty_one");
    assert.equal(room.twentyOne.round, 2);
    assert.equal(room.twentyOne.lastRoundResult.round, 1);
    assert.equal(typeof room.twentyOne.lastRoundResult.tie, "boolean");
    assert.ok(Object.keys(room.twentyOne.lastRoundResult.scores).length === 2);
    if (room.twentyOne.lastRoundResult.tie) {
      assert.ok(room.players.every((player) => player.twentyOne.lives === TWENTY_ONE_STARTING_LIVES));
    } else {
      assert.equal(room.twentyOne.lastRoundResult.damage, TWENTY_ONE_STARTING_BET);
      assert.ok(room.players.some((player) => player.twentyOne.lives === TWENTY_ONE_STARTING_LIVES - TWENTY_ONE_STARTING_BET));
    }
    assert.ok(room.players.every((player) => player.twentyOne.manualStand === false));
  });

  it("requires a fresh stand chain after changing the target with a trump card", () => {
    const room = createTwoPlayerRoom("twenty_one");
    startGame(room.code, room.hostPlayerId);

    const first = room.players[room.turnIndex % room.players.length];
    standTwentyOne(room.code, first.id);
    const second = room.players[room.turnIndex % room.players.length];
    const targetCard = { id: "target-17", type: "trump", trumpType: "go_for", target: 17, name: "Cible 17" };
    second.hand.push(targetCard);

    playTwentyOneTrump(room.code, second.id, targetCard.id);
    assert.equal(room.twentyOne.target, 17);
    assert.equal(room.twentyOne.standStreak, 0);
    assert.equal(first.twentyOne.manualStand, false);

    standTwentyOne(room.code, second.id);
    assert.equal(room.twentyOne.round, 1);
    standTwentyOne(room.code, first.id);
    assert.equal(room.twentyOne.round, 2);
  });

  it("requires a fresh stand chain after changing opponent number cards", () => {
    const room = createTwoPlayerRoom("twenty_one");
    startGame(room.code, room.hostPlayerId);

    const first = room.players[room.turnIndex % room.players.length];
    const startingOpponentCardCount = first.twentyOne.cards.length;
    standTwentyOne(room.code, first.id);
    const second = room.players[room.turnIndex % room.players.length];
    const removeCard = { id: "remove-opponent", type: "trump", trumpType: "deck", action: "remove", name: "Retrait" };
    second.hand.push(removeCard);

    playTwentyOneTrump(room.code, second.id, removeCard.id);
    assert.equal(first.twentyOne.cards.length, startingOpponentCardCount - 1);
    assert.equal(room.twentyOne.standStreak, 0);
    assert.equal(first.twentyOne.manualStand, false);

    standTwentyOne(room.code, second.id);
    assert.equal(room.twentyOne.round, 1);
    standTwentyOne(room.code, first.id);
    assert.equal(room.twentyOne.round, 2);
  });

  it("lets Alliance give two trump cards to each player", () => {
    const room = createTwoPlayerRoom("twenty_one");
    startGame(room.code, room.hostPlayerId);

    const actor = room.players[room.turnIndex % room.players.length];
    const opponent = room.players.find((player) => player.id !== actor.id);
    const alliance = { id: "alliance", type: "trump", trumpType: "bet", action: "friendship", name: "Alliance" };
    actor.hand = [alliance];
    opponent.hand = [];
    room.twentyOne.trumpDeck = [
      { id: "trump-a", type: "trump", trumpType: "bet", action: "one_up", name: "Mise +1" },
      { id: "trump-b", type: "trump", trumpType: "bet", action: "shield", name: "Bouclier" },
      { id: "trump-c", type: "trump", trumpType: "deck", action: "return", name: "Retour" },
      { id: "trump-d", type: "trump", trumpType: "deck", action: "remove", name: "Retrait" }
    ];

    playTwentyOneTrump(room.code, actor.id, alliance.id);

    assert.equal(actor.hand.length, 2);
    assert.equal(opponent.hand.length, 2);
    assert.equal(room.twentyOne.trumpDeck.length, 0);
  });
});

describe("berenike shot", () => {
  beforeEach(resetState);

  it("supports rooms with more than two players and starts with a public reserve", () => {
    const room = createRoom("socket-a", "Alice", "berenike_shot");
    joinRoom(room.code, "socket-b", "Bob");
    joinRoom(room.code, "socket-c", "Chloe");
    startGame(room.code, room.hostPlayerId);

    const visible = getVisibleState(room, room.players[0].id);

    assert.equal(room.phase, "berenike_shot");
    assert.equal(room.players.length, 3);
    assert.ok(room.players.every((player) => player.berenike.active));
    assert.ok(room.players.every((player) => player.berenike.hp === 3));
    assert.equal(room.berenike.publicCounts.real + room.berenike.publicCounts.blank, room.berenike.reserve.length);
    assert.ok(room.berenike.publicCounts.real >= 1);
    assert.ok(room.berenike.publicCounts.blank >= 1);
    assert.equal(visible.berenike.reserveCount, room.berenike.reserve.length);
    assert.ok(visible.players[0].berenike.inventory.length >= 2);
  });

  it("lets a blank self-shot keep the turn", () => {
    const room = createTwoPlayerRoom("berenike_shot");
    startGame(room.code, room.hostPlayerId);
    const actor = room.players[room.turnIndex % room.players.length];
    room.berenike.reserve = [{ id: "test_blank", type: "blank" }];
    room.berenike.publicCounts = { real: 0, blank: 1 };

    shootBerenikeShot(room.code, actor.id, actor.id);

    assert.equal(room.phase, "berenike_shot");
    assert.equal(room.players[room.turnIndex % room.players.length].id, actor.id);
    assert.equal(actor.berenike.hp, actor.berenike.maxHp);
  });

  it("applies black powder to the next real shot only", () => {
    const room = createTwoPlayerRoom("berenike_shot");
    startGame(room.code, room.hostPlayerId);
    const actor = room.players[room.turnIndex % room.players.length];
    const target = room.players.find((player) => player.id !== actor.id);
    const powder = { id: "powder", type: "black_powder", name: "Poudre Noire", icon: "■", desc: "" };
    actor.berenike.inventory = [powder];
    room.berenike.reserve = [{ id: "test_real", type: "real" }, { id: "test_blank", type: "blank" }];
    room.berenike.publicCounts = { real: 1, blank: 1 };

    useBerenikeItem(room.code, actor.id, { itemId: powder.id });
    shootBerenikeShot(room.code, actor.id, target.id);

    assert.equal(target.berenike.hp, target.berenike.maxHp - 2);
    assert.equal(actor.berenike.powderArmed, false);
  });

  it("reveals bullet vision secrets only to the item user", () => {
    const room = createTwoPlayerRoom("berenike_shot");
    spectateRoom(room.code, "socket-s", "Sam");
    startGame(room.code, room.hostPlayerId);
    const actor = room.players[room.turnIndex % room.players.length];
    const opponent = room.players.find((player) => player.id !== actor.id);
    const glassEye = { id: "glass-eye", type: "glass_eye", name: "Oeil de Verre", icon: "◉", desc: "" };
    const magicOrb = { id: "magic-orb", type: "magic_orb", name: "Boule Magique", icon: "●", desc: "" };
    actor.berenike.inventory = [glassEye, magicOrb];
    room.berenike.reserve = [{ id: "real", type: "real" }, { id: "blank", type: "blank" }];
    room.berenike.publicCounts = { real: 1, blank: 1 };

    useBerenikeItem(room.code, actor.id, { itemId: glassEye.id });
    let visibleForActor = getVisibleState(room, actor.id);
    let visibleForOpponent = getVisibleState(room, opponent.id);
    let visibleForSpectator = getVisibleState(room, null);

    assert.equal(visibleForActor.berenike.secret.nextBullet.type, "real");
    assert.ok(visibleForActor.berenike.secret.nextBullet.id);
    assert.deepEqual(visibleForOpponent.berenike.secret, {});
    assert.deepEqual(visibleForSpectator.berenike.secret, {});

    useBerenikeItem(room.code, actor.id, { itemId: magicOrb.id });
    visibleForActor = getVisibleState(room, actor.id);

    assert.equal(visibleForActor.berenike.secret.futureBullet.position, 2);
    assert.equal(visibleForActor.berenike.secret.futureBullet.type, "blank");
    assert.ok(visibleForActor.berenike.secret.futureBullet.id);
  });
});
