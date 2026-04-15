import GokuClicker from "./components/GokuClicker";
import MiningStore from "./components/MiningStore";
import { COLLECTIONS } from "./lib/gameConstants";

const demoCards = [
  {
    id: "card-1",
    name: "Gravity Chamber",
    description: "Trains your warriors to generate passive Ki.",
    base_cost: 100,
    base_income_per_hour: 12,
    category: COLLECTIONS.CARDS,
  },
  {
    id: "card-2",
    name: "Capsule Machine",
    description: "Automates energy recovery and steady Ki flow.",
    base_cost: 500,
    base_income_per_hour: 75,
    category: COLLECTIONS.CARDS,
  },
];

export default function App() {
  const balanceKi = 1000;
  const totalKi = 2500;
  const energy = 100;
  const energyMax = 100;
  const levelName = "Saiyan";
  const levelMultiplier = 1;
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
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <GokuClicker
            balanceKi={balanceKi}
            energy={energy}
            energyMax={energyMax}
            totalKi={totalKi}
            levelName={levelName}
            levelMultiplier={levelMultiplier}
            onClickKi={() => {}}
          />
          <MiningStore cards={demoCards} userCards={userCards} balanceKi={balanceKi} />
        </section>
      </div>
    </main>
  );
}
