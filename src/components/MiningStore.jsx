import { useMemo } from 'react';

const formatKi = (value) => new Intl.NumberFormat().format(Math.max(0, Math.floor(Number(value) || 0)));

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
        return {
          ...card,
          owned,
          level,
          incomePerSecond,
          cost: Number(card.base_cost) || 0,
        };
      }),
    [cards, ownedMap]
  );

  return (
    <section className="rounded-3xl border border-blue-500/30 bg-slate-950/80 p-6 shadow-2xl shadow-blue-500/10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-orange-300/80">Mining Store</p>
          <h3 className="mt-1 text-2xl font-bold text-white">Passive Income</h3>
        </div>
        <div className="rounded-2xl border border-gold-400/30 bg-gold-500/10 px-4 py-2 text-right">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold-200/80">Balance</p>
          <p className="text-lg font-semibold text-gold-200">{formatKi(balanceKi)}</p>
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-400">
        Purchase cards to increase passive Ki generation. {balanceKi <= 0 ? loadingText : ''}
      </p>

      <div className="grid gap-4">
        {cardRows.map((card) => {
          const canAfford = balanceKi >= card.cost;
          const ownedLabel = card.level > 0 ? `Owned x${card.level}` : 'Not owned';
          return (
            <article
              key={card.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-orange-400/30 hover:bg-white/8"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-lg font-semibold text-white">{card.name}</h4>
                    <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-blue-200">
                      {card.category || 'Support'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{card.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>Income: {formatKi(card.incomePerSecond)} Ki/s</span>
                    <span>Cost: {formatKi(card.cost)} Ki</span>
                    <span>{ownedLabel}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onPurchaseCard?.(card)}
                  disabled={!canAfford}
                  className="rounded-2xl border border-orange-400/30 bg-gradient-to-r from-orange-500 to-gold-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
                >
                  {canAfford ? 'Purchase' : 'Need more Ki'}
                </button>
              </div>
            </article>
          );
        })}

        {cardRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-slate-400">
            {loadingText}
          </div>
        ) : null}
      </div>
    </section>
  );
}