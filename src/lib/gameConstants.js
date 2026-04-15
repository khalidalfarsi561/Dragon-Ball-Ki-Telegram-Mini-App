export const COLLECTIONS = Object.freeze({
  USERS: 'users',
  LEVELS: 'levels',
  CARDS: 'cards',
  USER_CARDS: 'user_cards',
});

export const LEVEL_THRESHOLDS = Object.freeze([
  { id: 'saiyan', name: 'Saiyan', minKiRequired: 0, multiplier: 1 },
  { id: 'super_saiyan', name: 'Super Saiyan', minKiRequired: 1000, multiplier: 1.5 },
  { id: 'super_saiyan_blue', name: 'Super Saiyan Blue', minKiRequired: 10000, multiplier: 2.5 },
]);