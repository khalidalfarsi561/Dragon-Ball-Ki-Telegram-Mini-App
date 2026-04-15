import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePocketBase } from '../api/pocketbase';

const ENERGY_MAX = 100;
const CLICK_ENERGY_COST = 1;
const SYNC_INTERVAL_MS = 5000;
const DEFAULT_OFFLINE_TEXT = 'Gathering Ki... (Loading)';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getLevelMultiplier = (level) => toNumber(level?.multiplier, 1);
const getBaseIncomePerSecond = (cards = []) =>
  cards.reduce((sum, card) => sum + toNumber(card?.base_income_per_hour, 0) / 3600, 0);

const calcOfflineKi = ({ lastActive, totalIncomePerSecond }) => {
  if (!lastActive || !totalIncomePerSecond) return 0;
  const last = new Date(lastActive).getTime();
  if (!Number.isFinite(last)) return 0;
  const now = Date.now();
  const secondsAway = Math.max(0, (now - last) / 1000);
  return Math.floor(secondsAway * totalIncomePerSecond);
};

export const useGameLogic = ({
  telegramId,
  initialUser = null,
  initialLevel = null,
  initialCards = [],
} = {}) => {
  const pb = usePocketBase();
  const syncTimerRef = useRef(null);
  const pendingSyncRef = useRef(false);

  const [user, setUser] = useState(initialUser);
  const [level, setLevel] = useState(initialLevel);
  const [cards, setCards] = useState(initialCards);
  const [balanceKi, setBalanceKi] = useState(toNumber(initialUser?.balance_ki, 0));
  const [totalKi, setTotalKi] = useState(toNumber(initialUser?.total_ki, 0));
  const [energy, setEnergy] = useState(toNumber(initialUser?.energy, ENERGY_MAX));
  const [lastActive, setLastActive] = useState(initialUser?.last_active || null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(Boolean(initialUser));
  const [error, setError] = useState(null);

  useEffect(() => {
    setUser(initialUser);
    setLevel(initialLevel);
    setCards(initialCards);
    setBalanceKi(toNumber(initialUser?.balance_ki, 0));
    setTotalKi(toNumber(initialUser?.total_ki, 0));
    setEnergy(toNumber(initialUser?.energy, ENERGY_MAX));
    setLastActive(initialUser?.last_active || null);
    setIsLoaded(Boolean(initialUser));
  }, [initialUser, initialLevel, initialCards]);

  const totalIncomePerSecond = useMemo(() => getBaseIncomePerSecond(cards), [cards]);
  const levelMultiplier = useMemo(() => getLevelMultiplier(level), [level]);

  const offlineKiEarned = useMemo(
    () => calcOfflineKi({ lastActive, totalIncomePerSecond }),
    [lastActive, totalIncomePerSecond]
  );

  const applyOfflineProgress = useCallback(() => {
    if (!offlineKiEarned) return;
    setBalanceKi((current) => current + offlineKiEarned);
    setTotalKi((current) => current + offlineKiEarned);
    setLastActive(new Date().toISOString());
  }, [offlineKiEarned]);

  const syncUserState = useCallback(
    async (nextState = {}) => {
      if (!pb || !telegramId) return null;
      const recordId = user?.id || telegramId;
      const payload = {
        telegram_id: telegramId,
        username: user?.username || nextState.username || '',
        total_ki: nextState.totalKi ?? totalKi,
        balance_ki: nextState.balanceKi ?? balanceKi,
        energy: nextState.energy ?? energy,
        last_active: nextState.lastActive ?? new Date().toISOString(),
        level_id: nextState.levelId ?? level?.id ?? null,
      };

      setIsSyncing(true);
      setError(null);
      pendingSyncRef.current = false;

      try {
        const updated = user?.id
          ? await pb.collection('users').update(recordId, payload)
          : await pb.collection('users').create({ id: recordId, ...payload });
        setUser(updated);
        return updated;
      } catch (syncError) {
        setError(syncError);
        pendingSyncRef.current = true;
        return null;
      } finally {
        setIsSyncing(false);
      }
    },
    [balanceKi, energy, level?.id, pb, telegramId, totalKi, user]
  );

  const clickKi = useCallback(
    async (clickCount = 1) => {
      const clicks = Math.max(1, clickCount);
      const kiGain = clicks * levelMultiplier;
      let updatedEnergy = energy;

      if (updatedEnergy < CLICK_ENERGY_COST) return { kiGain: 0, energy: updatedEnergy };

      updatedEnergy = Math.max(0, updatedEnergy - CLICK_ENERGY_COST * clicks);
      const nextBalance = balanceKi + kiGain;
      const nextTotal = totalKi + kiGain;
      const now = new Date().toISOString();

      setBalanceKi(nextBalance);
      setTotalKi(nextTotal);
      setEnergy(updatedEnergy);
      setLastActive(now);

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
          return await pb.collection('user_cards').update(currentCardRecord.id, payload);
        }
        return await pb.collection('user_cards').create(payload);
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
    const result = await pb.collection('cards').getList(1, 100, { sort: 'base_cost' });
    setCards(result.items || []);
    return result.items || [];
  }, [pb, telegramId]);

  useEffect(() => {
    if (!pb || !telegramId) return undefined;

    if (offlineKiEarned) applyOfflineProgress();

    syncTimerRef.current = setInterval(() => {
      if (pendingSyncRef.current) {
        syncUserState();
      } else if (user) {
        syncUserState();
      }
    }, SYNC_INTERVAL_MS);

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [applyOfflineProgress, offlineKiEarned, pb, syncUserState, telegramId, user]);

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
    setUser,
    setLevel,
    setCards,
    setBalanceKi,
    setTotalKi,
    setEnergy,
    setLastActive,
    applyOfflineProgress,
    clickKi,
    purchaseCard,
    refreshCards,
    syncUserState,
  };
};

export default useGameLogic;