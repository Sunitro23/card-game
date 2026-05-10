export const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const MAX_ENERGY = 6;
export const ENERGY_PER_TURN = 2;
export const STARTING_HP = 30;
export const MAX_HAND_SIZE = 5;
export const MAX_DEFENSE_IN_HAND = 2;
export const AWALE_SEEDS_PER_PIT = 4;
export const AWALE_PITS_PER_PLAYER = 6;
export const AWALE_TOTAL_PITS = AWALE_PITS_PER_PLAYER * 2;
export const TWENTY_ONE_STARTING_LIVES = 3;
export const TWENTY_ONE_STARTING_TARGET = 21;
export const TWENTY_ONE_STARTING_BET = 1;
export const TWENTY_ONE_TRUMPS_PER_ROUND = 3;
export const TWENTY_ONE_MAX_TRUMPS = 6;

export const ATTACKS = {
  ranged: { type: "ranged", label: "Attaque à distance", dieSides: 4 },
  magic: { type: "magic", label: "Attaque magique", dieSides: 6 },
  melee: { type: "melee", label: "Attaque de mêlée", dieSides: 8 }
};
