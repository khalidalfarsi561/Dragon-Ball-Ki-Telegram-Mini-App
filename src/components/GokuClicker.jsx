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
    <section className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-6 shadow-2xl shadow-orange-500/10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-orange-300/80">Dragon Ball Ki</p>
          <h2 className="mt-1 text-2xl font-bold text-white">{levelName}</h2>
        </div>
        <div className="rounded-2xl border border-gold-400/30 bg-gold-500/10 px-4 py-2 text-right">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold-200/80">Balance</p>
          <p className="text-xl font-semibold text-gold-200">{formatKi(balanceKi)}</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 text-sm text-slate-200 sm:grid-cols-4">
        <div className="rounded-2xl bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Ki</p>
          <p className="mt-1 font-semibold text-white">{formatKi(totalKi)}</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Energy</p>
          <p className="mt-1 font-semibold text-white">{Math.floor(energy)}/{energyMax}</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Multiplier</p>
          <p className="mt-1 font-semibold text-white">x{levelMultiplier}</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">State</p>
          <p className="mt-1 font-semibold text-orange-300">{isDisabled ? loadingText : 'Ready'}</p>
        </div>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 via-gold-400 to-yellow-300 transition-all duration-300"
          style={{ width: `${energyPercent}%` }}
        />
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className="relative mx-auto flex aspect-square w-full max-w-sm items-center justify-center overflow-hidden rounded-full border-4 border-orange-400/40 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.25),rgba(30,41,59,0.9)_60%)] text-center shadow-[0_0_80px_rgba(251,191,36,0.25)] transition-transform duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="absolute inset-0 animate-pulse rounded-full border border-orange-300/20" />
        <div className="absolute inset-6 rounded-full border border-blue-400/15" />
        <div className="relative z-10">
          <p className="text-sm uppercase tracking-[0.35em] text-orange-200">Tap to gather</p>
          <p className="mt-2 text-5xl font-black text-white drop-shadow-[0_0_16px_rgba(255,255,255,0.3)]">GOKU</p>
          <p className="mt-3 text-lg font-semibold text-gold-200">+{formatKi(levelMultiplier)} Ki</p>
        </div>

        <AnimatePresence>
          {floaters.map((floater) => (
            <motion.span
              key={floater.id}
              initial={{ opacity: 0, y: 0, scale: 0.9 }}
              animate={{ opacity: 1, y: -70, scale: 1.1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="pointer-events-none absolute z-20 text-lg font-bold text-gold-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]"
              style={{ left: floater.x, top: floater.y }}
            >
              {floater.value}
            </motion.span>
          ))}
        </AnimatePresence>
      </button>
    </section>
  );
}