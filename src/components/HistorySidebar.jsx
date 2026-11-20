import React, { useEffect, useRef } from 'react';

export default function HistorySidebar({ logs }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [logs]);

  const getLogStyle = (type) => {
    switch (type) {
      case 'danger':
        return 'bg-rose-100/95 border-rose-400 text-rose-950';
      case 'success':
        return 'bg-emerald-100/95 border-emerald-400 text-emerald-950';
      case 'card':
        return 'bg-amber-100/95 border-amber-400 text-amber-950';
      case 'round':
        return 'bg-cyan-100/95 border-cyan-500 text-cyan-950 font-black';
      default:
        return 'bg-white/85 border-white text-slate-800';
    }
  };

  return (
    <aside className="w-full md:w-72 lg:w-80 min-h-0 bg-white/50 backdrop-blur-xl border-t-4 md:border-t-0 md:border-l-4 border-white/60 flex flex-col shrink-0 max-h-28 sm:max-h-32 md:max-h-none shadow-inner">
      <div className="px-3.5 py-2 border-b-2 border-white/60 flex items-center justify-between shrink-0">
        <h3 className="text-xs font-black uppercase tracking-widest text-cyan-950 flex items-center gap-1.5">
          <span>📜</span>
          <span>Bitácora Pública</span>
        </h3>
        <span className="text-[10px] font-black uppercase bg-white/80 text-cyan-900 px-2 py-0.5 rounded-full border border-white">
          En vivo
        </span>
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1.5 custom-scrollbar"
      >
        {logs.length === 0 ? (
          <div className="text-xs font-bold text-cyan-950/60 text-center py-6">
            Sin eventos todavía.
          </div>
        ) : (
          logs.map((entry) => (
            <div
              key={entry.id}
              className={`text-xs rounded-2xl px-3 py-2 border-2 leading-snug shadow-sm font-semibold ${getLogStyle(
                entry.type
              )}`}
            >
              <span className="text-[10px] opacity-60 mr-1.5 font-mono">
                {entry.time}
              </span>
              <span>{entry.text}</span>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
