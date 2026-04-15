import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePocketBase } from '../api/pocketbase';
import {
  COLLECTIONS,
  GAME_CONSTANTS,
  DEFAULT_LEVEL,
  LEVEL_THRESHOLDS,
  getLevelByKi,
  getNextLevel,
  getLevelMultiplierByKi,
} from '../lib/gameConstants';

const {
  ENERGY_MAX,
  CLICK_ENERGY_COST,
  SYNC_INTERVAL_MS,
  OFFLINE_ENERGY_PER_MINUTE,
  OFFLINE_ENERGY_MINUTES_CAP,
  OFFLINE_SYNC_RETRY_DELAY_MS,
} = GAME_CONSTANTS;

const DEFAULT_OFFLINE_TEXT = 'Gathering Ki... (Loading)';
const GAME_STATE_STORAGE_KEY = 'dragon-ball-ki-game-state';
const SYNC_QUEUE_STORAGE_KEY = 'dragon-ball-ki-sync-queue';
const lastSyncSnapshotKey = 'dragon-ball-ki-last-sync-snapshot';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const safeNow = () => Date.now();

const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const loadStoredState = () => {
  if (typeof window === 'undefined') return null;
  return safeJsonParse(window.localStorage.getItem(GAME_STATE_STORAGE_KEY), null);
};

const saveStoredState = (state) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify(state));
};

const loadSyncQueue = () => {
  if (typeof window === 'undefined') return [];
  return safeJsonParse(window.localStorage.getItem(SYNC_QUEUE_STORAGE_KEY), []);
};

const saveSyncQueue = (queue) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(queue));
};

const readSnapshot = (state) => ({
  balanceKi: toNumber(state?.balanceKi, 0),
  totalKi: toNumber(state?.totalKi, 0),
  energy: toNumber(state?.energy, ENERGY_MAX),
  levelId: state?.levelId || null,
  lastActive: state?.lastActive || null,
});

const snapshotEquals = (a, b) =>
  a.balanceKi === b.balanceKi &&
  a.totalKi === b.totalKi &&
  a.energy === b.energy &&
  a.levelId === b.levelId &&
  a.lastActive === b.lastActive;

const getBaseIncomePerSecond = (cards = []) =>
  cards.reduce((sum, card) => sum + toNumber(card?.base_income_per_hour, 0) / 3600, 0);

const calculateOfflineEnergyRecovery = (lastActive, currentEnergy = ENERGY_MAX) => {
  if (!lastActive) return 0;
  const last = new Date(lastActive).getTime();
  if (!Number.isFinite(last)) return 0;
  const elapsedMs = Math.max(0, safeNow() - last);
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const recovered = Math.floor((elapsedMinutes * OFFLINE_ENERGY_PER_MINUTE) / 1);
  return Math.max(0, Math.min(ENERGY_MAX - currentEnergy, recovered));
};

const calculateOfflineKi = ({ lastActive, totalIncomePerSecond }) => {
  if (!lastActive || !totalIncomePerSecond) return 0;
  const last = new Date(lastActive).getTime();
  if (!Number.isFinite(last)) return 0;
  const now = safeNow();
  const secondsAway = Math.max(0, (now - last) / 1000);
  return Math.floor(secondsAway * totalIncomePerSecond);
};

const clampEnergy = (value) => Math.max(0, Math.min(ENERGY_MAX, Math.floor(value)));

const getTelegramHaptics = () => {
  if (typeof window === 'undefined') return null;
  const telegram = window.Telegram?.WebApp;
  return telegram?.HapticFeedback || null;
};

const pushSyncQueueItem = (queue, item) => {
  const nextQueue = [...queue, item];
  saveSyncQueue(nextQueue);
  return nextQueue;
};

export const useGameLogic = ({
  telegramId,
  initialUser = null,
  initialLevel = null,
  initialCards = [],
} = {}) => {
  const pb = usePocketBase();
  const syncTimerRef = useRef(null);
  const syncRetryTimerRef = useRef(null);
  const queueDrainInFlightRef = useRef(false);
  const lastSyncAtRef = useRef(0);
  const lastSyncedSnapshotRef = useRef(null);
  const reconnectHandlerRef = useRef(null);

  const [user, setUser] = useState(initialUser);
  const [level, setLevel] = useState(initialLevel || DEFAULT_LEVEL);
  const [cards, setCards] = useState(initialCards);
  const [balanceKi, setBalanceKi] = useState(toNumber(initialUser?.balance_ki, 0));
  const [totalKi, setTotalKi] = useState(toNumber(initialUser?.total_ki, 0));
  const [energy, setEnergy] = useState(toNumber(initialUser?.energy, ENERGY_MAX));
  const [lastActive, setLastActive] = useState(initialUser?.last_active || null);
  const [offlineKiEarned, setOfflineKiEarned] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(Boolean(initialUser));
  const [error, setError] = useState(null);
  const [syncQueue, setSyncQueue] = useState(loadSyncQueue());

  const persistLocalState = useCallback(
    (nextState) => {
      saveStoredState({
        balanceKi: nextState.balanceKi,
        totalKi: nextState.totalKi,
        energy: nextState.energy,
        lastActive: nextState.lastActive,
        levelId: nextState.level?.id || null,
        userId: nextState.user?.id || null,
        telegramId,
        updatedAt: new Date().toISOString(),
      });
    },
    [telegramId]
  );

  useEffect(() => {
    const stored = loadStoredState();
    if (!stored) return;

    setBalanceKi((current) => (Number.isFinite(stored.balanceKi) ? stored.balanceKi : current));
    setTotalKi((current) => (Number.isFinite(stored.totalKi) ? stored.totalKi : current));
    setEnergy((current) => (Number.isFinite(stored.energy) ? stored.energy : current));
    setLastActive((current) => stored.lastActive || current);
  }, []);

  useEffect(() => {
    setUser(initialUser);
    setLevel(initialLevel || DEFAULT_LEVEL);
    setCards(initialCards);
    setBalanceKi(toNumber(initialUser?.balance_ki, 0));
    setTotalKi(toNumber(initialUser?.total_ki, 0));
    setEnergy(toNumber(initialUser?.energy, ENERGY_MAX));
    setLastActive(initialUser?.last_active || null);
    setIsLoaded(Boolean(initialUser));
  }, [initialCards, initialLevel, initialUser]);

  const totalIncomePerSecond = useMemo(() => getBaseIncomePerSecond(cards), [cards]);
  const levelMultiplier = useMemo(() => getLevelMultiplierByKi(totalKi), [totalKi]);

  const derivedLevel = useMemo(() => getLevelByKi(totalKi), [totalKi]);

  useEffect(() => {
    if (!derivedLevel) return;
    setLevel((current) => (current?.id === derivedLevel.id ? current : derivedLevel));
  }, [derivedLevel]);

  const applyOfflineProgress = useCallback(() => {
    const kiEarned = calculateOfflineKi({ lastActive, totalIncomePerSecond });
    const recoveredEnergy = calculateOfflineEnergyRecovery(lastActive, energy);

    setOfflineKiEarned(kiEarned);
    if (kiEarned) {
      setBalanceKi((current) => current + kiEarned);
      setTotalKi((current) => current + kiEarned);
    }
    if (recoveredEnergy) {
      setEnergy((current) => clampEnergy(current + recoveredEnergy));
    }

    if (kiEarned || recoveredEnergy) {
      setLastActive(new Date().toISOString());
    }

    return { kiEarned, recoveredEnergy };
  }, [energy, lastActive, totalIncomePerSecond]);

  const enqueueSync = useCallback(
    (payload) => {
      const item = {
        id: `${safeNow()}-${Math.random().toString(36).slice(2)}`,
        payload,
        createdAt: new Date().toISOString(),
      };
      const nextQueue = pushSyncQueueItem(syncQueue, item);
      setSyncQueue(nextQueue);
      return item;
    },
    [syncQueue]
  );

  const shouldSyncNow = useCallback(
    (nextSnapshot) => {
      const dirty = !snapshotEquals(lastSyncedSnapshotRef.current || {}, nextSnapshot);
      const now = safeNow();
      const due = now - lastSyncAtRef.current >= SYNC_INTERVAL_MS;
      return dirty || due;
    },
    []
  );

  const syncUserState = useCallback(
    async (nextState = {}, options = {}) => {
      if (!pb || !telegramId) return null;

      const snapshot = readSnapshot({
        balanceKi: nextState.balanceKi ?? balanceKi,
        totalKi: nextState.totalKi ?? totalKi,
        energy: nextState.energy ?? energy,
        lastActive: nextState.lastActive ?? lastActive,
        levelId: nextState.levelId ?? level?.id ?? derivedLevel?.id ?? null,
      });

      if (!options.force && !shouldSyncNow(snapshot)) {
        return user;
      }

      const payload = {
        telegram_id: telegramId,
        username: user?.username || nextState.username || '',
        total_ki: snapshot.totalKi,
        balance_ki: snapshot.balanceKi,
        energy: snapshot.energy,
        last_active: snapshot.lastActive || new Date().toISOString(),
        level_id: snapshot.levelId,
      };

      setIsSyncing(true);
      setError(null);

      try {
        const recordId = user?.id;
        const updated = recordId
          ? await pb.collection(COLLECTIONS.USERS).update(recordId, payload)
          : await pb.collection(COLLECTIONS.USERS).create({ id: telegramId, ...payload });
        setUser(updated);
        lastSyncAtRef.current = safeNow();
        lastSyncedSnapshotRef.current = snapshot;
        saveSyncQueue([]);
        setSyncQueue([]);
        return updated;
      } catch (syncError) {
        setError(syncError);
        enqueueSync(payload);
        return null;
      } finally {
        setIsSyncing(false);
      }
    },
    [balanceKi, derivedLevel?.id, energy, enqueueSync, lastActive, level?.id, pb, shouldSyncNow, telegramId, totalKi, user]
  );

  const drainSyncQueue = useCallback(async () => {
    if (!pb || !telegramId || queueDrainInFlightRef.current) return;
    const queue = loadSyncQueue();
    if (!queue.length) return;

    queueDrainInFlightRef.current = true;
    try {
      let remaining = [...queue];
      for (const item of queue) {
        try {
          const recordId = user?.id;
          const payload = item.payload;
          if (recordId) {
            await pb.collection(COLLECTIONS.USERS).update(recordId, payload);
          } else {
            await pb.collection(COLLECTIONS.USERS).create({ id: telegramId, ...payload });
          }
          remaining = remaining.filter((queued) => queued.id !== item.id);
        } catch {
          break;
        }
      }
      saveSyncQueue(remaining);
      setSyncQueue(remaining);
      if (!remaining.length) {
        lastSyncAtRef.current = safeNow();
      }
    } finally {
      queueDrainInFlightRef.current = false;
    }
  }, [pb, telegramId, user?.id]);

  const scheduleRetry = useCallback(() => {
    if (syncRetryTimerRef.current) return;
    syncRetryTimerRef.current = window.setTimeout(async () => {
      syncRetryTimerRef.current = null;
      await drainSyncQueue();
    }, OFFLINE_SYNC_RETRY_DELAY_MS);
  }, [drainSyncQueue]);

  const clickKi = useCallback(
    async (clickCount = 1) => {
      const clicks = Math.max(1, clickCount);
      const kiGain = clicks * levelMultiplier;
      const currentEnergy = energy;

      if (currentEnergy < CLICK_ENERGY_COST) return { kiGain: 0, energy: currentEnergy };

      const updatedEnergy = Math.max(0, currentEnergy - CLICK_ENERGY_COST * clicks);
      const nextBalance = balanceKi + kiGain;
      const nextTotal = totalKi + kiGain;
      const now = new Date().toISOString();

      setBalanceKi(nextBalance);
      setTotalKi(nextTotal);
      setEnergy(updatedEnergy);
      setLastActive(now);

      const haptics = getTelegramHaptics();
      if (haptics?.impactOccurred) {
        haptics.impactOccurred('light');
      }

      return { kiGain, energy: updatedEnergy };
    },
    [balanceKi, energy, levelMultiplier, totalKi]
  );

  const purchaseCard = useCallback(
    async (card, currentCardRecord = null) => {
      if (!pb || !card) return null;
      const cost = toNumber(card.base_cost, 0);
      if (balanceKi < cost) return null;

      const newBalance = balanceKi - cost;
      setBalanceKi(newBalance);
      setTotalKi((current) => current - cost);
      setLastActive(new Date().toISOString());

      const payload = {
        user_id: user?.id || telegramId,
        card_id: card.id,
        current_level: toNumber(currentCardRecord?.current_level, 0) + 1,
      };

      try {
        if (currentCardRecord?.id) {
          return await pb.collection(COLLECTIONS.USER_CARDS).update(currentCardRecord.id, payload);
        }
        return await pb.collection(COLLECTIONS.USER_CARDS).create(payload);
      } catch (purchaseError) {
        setError(purchaseError);
        setBalanceKi((current) => current + cost);
        setTotalKi((current) => current + cost);
        return null;
      }
    },
    [balanceKi, pb, telegramId, user?.id]
  );

  const refreshCards = useCallback(async () => {
    if (!pb || !telegramId) return [];
    const result = await pb.collection(COLLECTIONS.CARDS).getList(1, 100, { sort: 'base_cost' });
    setCards(result.items || []);
    return result.items || [];
  }, [pb, telegramId]);

  useEffect(() => {
    if (!pb || !telegramId) return undefined;

    const { kiEarned, recoveredEnergy } = applyOfflineProgress();
    const hasOfflineProgress = Boolean(kiEarned || recoveredEnergy);
    if (hasOfflineProgress) {
      persistLocalState({
        balanceKi: balanceKi + kiEarned,
        totalKi: totalKi + kiEarned,
        energy: clampEnergy(energy + recoveredEnergy),
        lastActive: new Date().toISOString(),
        user,
        level: derivedLevel,
      });
    }

    syncTimerRef.current = window.setInterval(() => {
      const snapshot = readSnapshot({
        balanceKi,
        totalKi,
        energy,
        lastActive,
        levelId: level?.id || derivedLevel?.id || null,
      });
      if (shouldSyncNow(snapshot)) {
        syncUserState(snapshot);
      }
      if (syncQueue.length) {
        scheduleRetry();
      }
    }, SYNC_INTERVAL_MS);

    const handleOnline = () => {
      drainSyncQueue();
    };

    reconnectHandlerRef.current = handleOnline;
    window.addEventListener('online', handleOnline);

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      if (syncRetryTimerRef.current) clearTimeout(syncRetryTimerRef.current);
      if (reconnectHandlerRef.current) {
        window.removeEventListener('online', reconnectHandlerRef.current);
      }
    };
  }, [
    applyOfflineProgress,
    balanceKi,
    derivedLevel,
    drainSyncQueue,
    energy,
    lastActive,
    level?.id,
    pb,
    persistLocalState,
    scheduleRetry,
    shouldSyncNow,
    syncQueue.length,
    syncUserState,
    telegramId,
    totalKi,
    user,
  ]);

  useEffect(() => {
    persistLocalState({
      balanceKi,
      totalKi,
      energy,
      lastActive,
      user,
      level,
    });
  }, [balanceKi, energy, lastActive, level, persistLocalState, totalKi, user]);

  useEffect(() => {
    if (!user && !isLoaded) return;
    if (syncQueue.length) scheduleRetry();
  }, [isLoaded, scheduleRetry, syncQueue.length, user]);

  useEffect(() => {
    if (lastActive || isLoaded) return;
    setIsLoaded(false);
  }, [isLoaded, lastActive]);

  return {
    user,
    level,
    cards,
    balanceKi,
    totalKi,
    energy,
    energyMax: ENERGY_MAX,
    totalIncomePerSecond,
    levelMultiplier,
    offlineKiEarned,
    isLoaded,
    isSyncing,
    error,
    defaultOfflineText: DEFAULT_OFFLINE_TEXT,
    syncQueue,
    setUser,
    setLevel,
    setCards,
    setBalanceKi,
    setTotalKi,
    setEnergy,
    setLastActive,
    setOfflineKiEarned,
    applyOfflineProgress,
    clickKi,
    purchaseCard,
    refreshCards,
    syncUserState,
    drainSyncQueue,
  };
};

export default useGameLogic;