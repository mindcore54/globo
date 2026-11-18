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
        return 'bg-rose-500/15 border-rose-500/40 text-rose-200';
      case 'success':
        return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200';
      case 'card':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-100';
      case 'round':
        return 'bg-indigo-500/20 border-indigo-400/40 text-indigo-100 font-semibold';
      default:
        return 'bg-slate-800/70 border-slate-700/70 text-slate-200';
    }
  };

  return (
    <aside className="w-full md:w-72 lg:w-80 bg-slate-900/95 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col shrink-0 max-h-36 md:max-h-none">
      <div className="px-3.5 py-2 border-b border-slate-800 flex items-center justify-between shrink-0">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <span>📜</span>
          <span>Bitácora Pública</span>
        </h3>
        <span className="text-[11px] font-semibold text-slate-500">
          En vivo
        </span>
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1.5"
      >
        {logs.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-6">
            Sin eventos todavía.
          </div>
        ) : (
          logs.map((entry) => (
            <div
              key={entry.id}
              className={`text-xs rounded-xl px-2.5 py-2 border leading-snug ${getLogStyle(
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
