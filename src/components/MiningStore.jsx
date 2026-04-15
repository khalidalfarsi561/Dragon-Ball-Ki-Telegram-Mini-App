import { useMemo } from 'react';

const formatKi = (value) => new Intl.NumberFormat().format(Math.max(0, Math.floor(Number(value) || 0)));

const RARITY_DEFS = [
  {
    id: 'common',
    label: 'Common',
    glow: 'from-slate-400/25 via-slate-500/10 to-slate-400/0',
    badge: 'border-slate-400/30 bg-slate-500/10 text-slate-200',
    accent: 'text-slate-200',
    ring: 'shadow-slate-950/20',
    threshold: 0,
  },
  {
    id: 'rare',
    label: 'Rare',
    glow: 'from-blue-400/25 via-cyan-500/10 to-blue-400/0',
    badge: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200',
    accent: 'text-cyan-100',
    ring: 'shadow-cyan-500/10',
    threshold: 250,
  },
  {
    id: 'epic',
    label: 'Epic',
    glow: 'from-fuchsia-500/25 via-purple-500/10 to-fuchsia-500/0',
    badge: 'border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-100',
    accent: 'text-fuchsia-100',
    ring: 'shadow-fuchsia-500/10',
    threshold: 1000,
  },
  {
    id: 'legendary',
    label: 'Legendary',
    glow: 'from-amber-400/25 via-orange-500/10 to-amber-400/0',
    badge: 'border-amber-300/30 bg-amber-500/10 text-amber-100',
    accent: 'text-amber-100',
    ring: 'shadow-amber-500/10',
    threshold: 5000,
  },
  {
    id: 'god_tier',
    label: 'God Tier',
    glow: 'from-emerald-300/25 via-gold-400/10 to-emerald-300/0',
    badge: 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100',
    accent: 'text-emerald-100',
    ring: 'shadow-emerald-500/10',
    threshold: 20000,
  },
];

const getFallbackRarity = (cost = 0) => {
  const value = Number(cost) || 0;
  let rarity = RARITY_DEFS[0];

  for (const entry of RARITY_DEFS) {
    if (value >= entry.threshold) rarity = entry;
  }

  return rarity;
};

const resolveRarity = (card = {}) => {
  const raw = String(card.rarity || card.rarity_level || card.tier || '').trim().toLowerCase();
  const normalized = raw.replace(/\s+/g, '_');

  const explicit = RARITY_DEFS.find(
    (entry) =>
      entry.id === normalized ||
      entry.label.toLowerCase().replace(/\s+/g, '_') === normalized
  );

  return explicit || getFallbackRarity(card.base_cost);
};

export default function MiningStore({
  cards = [],
  userCards = [],
  balanceKi = 0,
  onPurchaseCard,
  loadingText = 'Gathering Ki... (Loading)',
}) {
  const ownedMap = useMemo(() => {
    const map = new Map();
    userCards.forEach((item) => {
      if (item?.card_id) map.set(item.card_id, item);
    });
    return map;
  }, [userCards]);

  const cardRows = useMemo(
    () =>
      cards.map((card) => {
        const owned = ownedMap.get(card.id);
        const level = owned?.current_level || 0;
        const incomePerHour = Number(card.base_income_per_hour) || 0;
        const incomePerSecond = incomePerHour / 3600;
        const rarity = resolveRarity(card);
        return {
          ...card,
          owned,
          level,
          incomePerSecond,
          cost: Number(card.base_cost) || 0,
          rarity,
        };
      }),
    [cards, ownedMap]
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/85 shadow-xl backdrop-blur">
      <div className="relative border-b border-white/5 bg-gradient-to-br from-white/8 via-white/4 to-transparent px-4 py-4 sm:px-5">
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-orange-200/70">Mining Store</p>
            <h3 className="mt-1 text-xl font-black text-white sm:text-2xl">Passive Income</h3>
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">Buy upgrades to generate Ki automatically.</p>
          </div>
          <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-[0.12em] text-amber-100/70">Balance</p>
            <p className="text-lg font-black text-amber-100">{formatKi(balanceKi)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 sm:px-5">
        <p className="text-xs text-slate-400 sm:text-sm">
          Purchase cards to increase passive Ki generation. {balanceKi <= 0 ? loadingText : ''}
        </p>
      </div>

      <div className="grid gap-3 px-4 pb-4 sm:px-5 sm:pb-5">
        {cardRows.map((card) => {
          const canAfford = balanceKi >= card.cost;
          const ownedLabel = card.level > 0 ? `Owned x${card.level}` : 'Not owned';

          return (
            <article
              key={card.id}
              className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${card.rarity.glow} p-[1px] ${card.rarity.ring} transition hover:border-white/20`}
            >
              <div className="rounded-2xl bg-slate-950/95 p-3 sm:p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-semibold text-white">{card.name}</h4>
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${card.rarity.badge}`}>
                          {card.rarity.label}
                        </span>
                      </div>
                      <p className="max-w-2xl text-xs leading-5 text-slate-300 sm:text-sm">{card.description}</p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-right">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Income</p>
                      <p className={`text-xs font-semibold sm:text-sm ${card.rarity.accent}`}>{formatKi(card.incomePerSecond)} Ki/s</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                      {card.category || 'Support'}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                      Cost: {formatKi(card.cost)} Ki
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                      {ownedLabel}
                    </span>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onPurchaseCard?.(card)}
                      disabled={!canAfford}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                        canAfford
                          ? 'border border-orange-300/30 bg-gradient-to-r from-orange-500 via-amber-400 to-gold-400 text-slate-950 hover:brightness-110'
                          : 'cursor-not-allowed border border-slate-700 bg-slate-800 text-slate-500'
                      }`}
                    >
                      {canAfford ? 'Purchase' : 'Need more Ki'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {cardRows.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/5 p-6 text-center text-slate-400">
            {loadingText}
          </div>
        ) : null}
      </div>
    </section>
  );
}
