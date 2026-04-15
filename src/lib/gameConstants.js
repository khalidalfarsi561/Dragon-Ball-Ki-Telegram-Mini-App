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

export const GAME_CONSTANTS = Object.freeze({
  ENERGY_MAX: 100,
  CLICK_ENERGY_COST: 1,
  SYNC_INTERVAL_MS: 5000,
  OFFLINE_ENERGY_PER_MINUTE: 12,
  OFFLINE_ENERGY_MINUTES_CAP: 240,
  OFFLINE_SYNC_RETRY_DELAY_MS: 1500,
});

export const DEFAULT_LEVEL = LEVEL_THRESHOLDS[0];

export const getLevelByKi = (totalKi = 0) => {
  const ki = Number(totalKi) || 0;
  let currentLevel = DEFAULT_LEVEL;

  for (const level of LEVEL_THRESHOLDS) {
    if (ki >= level.minKiRequired) {
      currentLevel = level;
    }
  }

  return currentLevel;
};

export const getNextLevel = (currentLevelId) => {
  const currentIndex = LEVEL_THRESHOLDS.findIndex((level) => level.id === currentLevelId);
  if (currentIndex < 0) return null;
  return LEVEL_THRESHOLDS[currentIndex + 1] || null;
};

export const getLevelMultiplierByKi = (totalKi = 0) => getLevelByKi(totalKi).multiplier;