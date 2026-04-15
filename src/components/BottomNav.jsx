const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'mining', label: 'Mining', icon: '⛏' },
  { id: 'quests', label: 'Quests', icon: '⚔' },
  { id: 'wallet', label: 'Wallet', icon: '◈' },
];

const Icon = ({ id }) => {
  if (id === 'home') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10.75V20h13V10.75" />
        <path d="M9.5 20v-6h5v6" />
      </svg>
    );
  }

  if (id === 'mining') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m14.5 3.5 6 6-10.5 10.5H4v-6L14.5 3.5Z" />
        <path d="m13 5 6 6" />
        <path d="m7 17 3 3" />
      </svg>
    );
  }

  if (id === 'quests') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3 4.5 7v5.5c0 4.5 3 7.8 7.5 8.5 4.5-.7 7.5-4 7.5-8.5V7L12 3Z" />
        <path d="M9 12.5 11 14.5 15 10.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7.5A3.5 3.5 0 0 1 7.5 4h9A3.5 3.5 0 0 1 20 7.5v9a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 16.5v-9Z" />
      <path d="M8 9.5h8" />
      <path d="M8 13h8" />
      <path d="M9 17h6" />
    </svg>
  );
};

export default function BottomNav({ activeTab = 'home', onTabChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
      <div className="mx-auto max-w-md rounded-[1.75rem] border border-white/10 bg-slate-950/90 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.55)] backdrop-blur-xl">
        <div className="grid grid-cols-4 gap-2">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange?.(item.id)}
                className={`group flex flex-col items-center justify-center gap-1 rounded-[1.15rem] px-3 py-3 text-xs font-semibold transition ${
                  active
                    ? 'bg-gradient-to-b from-orange-400 to-amber-300 text-slate-950 shadow-lg shadow-orange-500/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                  active ? 'border-white/15 bg-white/20' : 'border-white/5 bg-white/5 group-hover:border-white/10'
                }`}>
                  <Icon id={item.id} />
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}