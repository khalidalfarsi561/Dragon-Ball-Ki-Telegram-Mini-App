import { useMemo, useState } from 'react';
import GokuClicker from './components/GokuClicker';
import MiningStore from './components/MiningStore';
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

  const balanceKi = 1000;
  const totalKi = 2500;
  const energy = 100;
  const energyMax = 100;
  const level = useMemo(() => getLevelByKi(totalKi), [totalKi]);
  const offlineKiEarned = 180;
  const levelMultiplier = level?.multiplier || 1;
  const userCards = [];

  return (
    <main className="min-h-screen px-4 py-8 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-orange-500/10 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-orange-300/80">Dragon Ball $Ki</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">Mini App is ready</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            Tap Goku to gather Ki and invest in passive mining upgrades.
          </p>
          {showOfflinePopup ? (
            <div className="mt-4 rounded-2xl border border-orange-400/30 bg-orange-500/10 p-4 text-sm text-orange-100">
              You earned {offlineKiEarned} Ki while away.
              <button
                type="button"
                className="ml-3 rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80"
                onClick={() => setShowOfflinePopup(false)}
              >
                Close
              </button>
            </div>
          ) : null}
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <GokuClicker
            balanceKi={balanceKi}
            energy={energy}
            energyMax={energyMax}
            totalKi={totalKi}
            levelName={level.name}
            levelMultiplier={levelMultiplier}
            onClickKi={() => {}}
          />
          <MiningStore cards={demoCards} userCards={userCards} balanceKi={balanceKi} />
        </section>

        <footer className="flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
          {['home', 'mining', 'quests', 'wallet'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold capitalize ${
                activeTab === tab ? 'bg-orange-500 text-slate-950' : 'text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </footer>

        <div className="text-xs text-slate-400">
          Levels: {LEVEL_THRESHOLDS.map((item) => item.name).join(' • ')}
        </div>
      </div>
    </main>
  );
}
