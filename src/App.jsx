import { useEffect, useMemo, useState } from 'react';
import GokuClicker from './components/GokuClicker';
import MiningStore from './components/MiningStore';
import BottomNav from './components/BottomNav';
import { COLLECTIONS, LEVEL_THRESHOLDS, getLevelByKi } from './lib/gameConstants';

const demoCards = [
  {
    id: 'card-1',
    name: "King Kai's Training",
    description: 'Boosts passive Ki generation with intense martial discipline.',
    base_cost: 100,
    base_income_per_hour: 12,
    category: COLLECTIONS.CARDS,
  },
  {
    id: 'card-2',
    name: 'Hyperbolic Time Chamber',
    description: 'Accelerates Ki flow and training gains dramatically.',
    base_cost: 500,
    base_income_per_hour: 75,
    category: COLLECTIONS.CARDS,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showOfflinePopup, setShowOfflinePopup] = useState(true);
  const [balanceKi, setBalanceKi] = useState(1000);
  const [totalKi, setTotalKi] = useState(2500);
  const [energy, setEnergy] = useState(100);
  const [userCards, setUserCards] = useState([]);

  const energyMax = 100;
  const level = useMemo(() => getLevelByKi(totalKi), [totalKi]);
  const offlineKiEarned = 180;
  const levelMultiplier = level?.multiplier || 1;
  const passiveKiPerSecond = useMemo(
    () =>
      userCards.reduce((total, ownedCard) => {
        const card = demoCards.find((item) => item.id === ownedCard.card_id);
        const perSecond = (Number(card?.base_income_per_hour) || 0) / 3600;
        return total + perSecond * ownedCard.current_level;
      }, 0),
    [userCards]
  );

  useEffect(() => {
    const energyInterval = window.setInterval(() => {
      setEnergy((current) => Math.min(energyMax, current + 1));
    }, 1400);

    return () => window.clearInterval(energyInterval);
  }, []);

  useEffect(() => {
    if (passiveKiPerSecond <= 0) return undefined;

    const passiveInterval = window.setInterval(() => {
      setBalanceKi((current) => current + passiveKiPerSecond);
      setTotalKi((current) => current + passiveKiPerSecond);
    }, 1000);

    return () => window.clearInterval(passiveInterval);
  }, [passiveKiPerSecond]);

  const handleClickKi = () => {
    if (energy < 1) return;
    setBalanceKi((current) => current + levelMultiplier);
    setTotalKi((current) => current + levelMultiplier);
    setEnergy((current) => Math.max(0, current - 1));
  };

  const handlePurchaseCard = (card) => {
    const cost = Number(card?.base_cost) || 0;
    if (balanceKi < cost) return;

    setBalanceKi((current) => current - cost);
    setUserCards((current) => {
      const existing = current.find((item) => item.card_id === card.id);
      if (!existing) return [...current, { card_id: card.id, current_level: 1 }];
      return current.map((item) =>
        item.card_id === card.id
          ? { ...item, current_level: item.current_level + 1 }
          : item
      );
    });
  };

  const renderTabContent = () => {
    if (activeTab === 'mining') {
      return (
        <MiningStore
          cards={demoCards}
          userCards={userCards}
          balanceKi={balanceKi}
          onPurchaseCard={handlePurchaseCard}
        />
      );
    }

    if (activeTab === 'quests') {
      return (
        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 text-sm text-slate-200">
          Daily quests are being prepared. Continue collecting Ki to unlock missions.
        </section>
      );
    }

    if (activeTab === 'wallet') {
      return (
        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Wallet</p>
          <p className="mt-2 text-lg font-bold text-white">
            Current Ki: {Math.floor(balanceKi).toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Passive income: {passiveKiPerSecond.toFixed(2)} Ki/s
          </p>
        </section>
      );
    }

    return (
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <GokuClicker
          balanceKi={balanceKi}
          energy={energy}
          energyMax={energyMax}
          totalKi={totalKi}
          levelName={level.name}
          levelMultiplier={levelMultiplier}
          onClickKi={handleClickKi}
        />
        <MiningStore
          cards={demoCards}
          userCards={userCards}
          balanceKi={balanceKi}
          onPurchaseCard={handlePurchaseCard}
        />
      </section>
    );
  };

  return (
    <main className="min-h-screen px-3 pt-4 pb-24 text-white sm:px-4 sm:pt-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <header className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-xl backdrop-blur sm:p-5">
          <p className="text-[11px] uppercase tracking-[0.3em] text-orange-300/80">Dragon Ball $Ki</p>
          <h1 className="mt-1 text-2xl font-black sm:text-3xl">Ki Battle Dashboard</h1>
          <p className="mt-2 text-sm text-slate-300">
            واجهة أخف وأكثر ترتيبًا مع أزرار أصغر واستجابة أفضل لكل أحجام الشاشات.
          </p>
          {showOfflinePopup ? (
            <div className="mt-3 rounded-2xl border border-orange-400/30 bg-orange-500/10 p-3 text-sm text-orange-100">
              You earned {offlineKiEarned} Ki while away.
              <button
                type="button"
                className="ml-3 rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.15em] text-white/80"
                onClick={() => setShowOfflinePopup(false)}
              >
                Close
              </button>
            </div>
          ) : null}
        </header>

        {renderTabContent()}

        <div className="text-[11px] text-slate-400">
          Levels: {LEVEL_THRESHOLDS.map((item) => item.name).join(' • ')}
        </div>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}
