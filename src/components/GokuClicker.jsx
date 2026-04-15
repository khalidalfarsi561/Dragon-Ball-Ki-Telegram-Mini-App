import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const formatKi = (value) => new Intl.NumberFormat().format(Math.max(0, Math.floor(Number(value) || 0)));

export default function GokuClicker({
  balanceKi = 0,
  energy = 100,
  energyMax = 100,
  totalKi = 0,
  levelName = 'Saiyan',
  levelMultiplier = 1,
  onClickKi,
  loadingText = 'Gathering Ki... (Loading)',
}) {
  const [floaters, setFloaters] = useState([]);

  const energyPercent = useMemo(
    () => Math.max(0, Math.min(100, (energy / energyMax) * 100)),
    [energy, energyMax]
  );

  const handleClick = useCallback(
    (event) => {
      if (!onClickKi) return;
      const kiGain = levelMultiplier;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setFloaters((current) => [
        ...current,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          x,
          y,
          value: `+${formatKi(kiGain)} Ki`,
        },
      ]);

      onClickKi(1);

      window.setTimeout(() => {
        setFloaters((current) => current.slice(1));
      }, 900);
    },
    [levelMultiplier, onClickKi]
  );

  const isDisabled = energy <= 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-slate-950 via-blue-950/60 to-slate-900 p-4 shadow-xl sm:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.12),transparent_28%)]" />
      <div className="relative z-10">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-orange-300/80">Dragon Ball Ki</p>
            <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">{levelName}</h2>
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">Tap to collect Ki and level up faster.</p>
          </div>
          <div className="rounded-2xl border border-amber-300/20 bg-black/20 px-3 py-2 text-right shadow-md shadow-black/20">
            <p className="text-[10px] uppercase tracking-[0.15em] text-amber-200/70">Balance</p>
            <p className="mt-1 text-xl font-black text-amber-200">{formatKi(balanceKi)}</p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-slate-200 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <p className="text-[10px] uppercase tracking-[0.1em] text-slate-400">Ki</p>
            <p className="mt-1 text-base font-bold text-white">{formatKi(totalKi)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <p className="text-[10px] uppercase tracking-[0.1em] text-slate-400">Energy</p>
            <p className="mt-1 text-base font-bold text-white">{Math.floor(energy)}/{energyMax}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <p className="text-[10px] uppercase tracking-[0.1em] text-slate-400">Multiplier</p>
            <p className="mt-1 text-base font-bold text-white">x{levelMultiplier}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <p className="text-[10px] uppercase tracking-[0.1em] text-slate-400">State</p>
            <p className="mt-1 text-base font-bold text-orange-300">{isDisabled ? loadingText : 'Ready'}</p>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.1em] text-slate-300/70">
            <span>Energy bar</span>
            <span>{Math.round(energyPercent)}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 shadow-[0_0_18px_rgba(251,191,36,0.4)] transition-all duration-300"
              style={{ width: `${energyPercent}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleClick}
          disabled={isDisabled}
          className="relative mx-auto flex aspect-square w-full max-w-[16rem] items-center justify-center overflow-hidden rounded-full border-2 border-orange-400/35 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.32),rgba(15,23,42,0.92)_58%)] text-center shadow-[0_0_50px_rgba(251,191,36,0.16)] transition-transform duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="absolute inset-0 rounded-full border border-orange-300/20" />
          <div className="absolute inset-3 rounded-full border border-blue-400/20" />
          <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-orange-200/80">Tap</p>
            <p className="mt-1 text-4xl font-black text-white drop-shadow-[0_0_16px_rgba(255,255,255,0.3)] sm:text-5xl">
              GOKU
            </p>
            <p className="mt-2 text-sm font-semibold text-amber-200">+{formatKi(levelMultiplier)} Ki</p>
          </div>

          <AnimatePresence>
            {floaters.map((floater) => (
              <motion.span
                key={floater.id}
                initial={{ opacity: 0, y: 0, scale: 0.9 }}
                animate={{ opacity: 1, y: -70, scale: 1.1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="pointer-events-none absolute z-20 text-lg font-bold text-amber-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]"
                style={{ left: floater.x, top: floater.y }}
              >
                {floater.value}
              </motion.span>
            ))}
          </AnimatePresence>
        </button>
      </div>
    </section>
  );
}
