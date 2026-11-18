import React from 'react';

export default function HeaderPlayers({
  players,
  currentPlayerIndex,
  direction,
  roundNumber,
}) {
  const isClockwise = direction === 1;

  return (
    <header className="w-full bg-slate-900/95 border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-3 shrink-0">
      {/* Badge de Ronda y Sentido de Giro */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold leading-none">
            Ronda
          </span>
          <span className="text-base font-black text-white leading-tight">
            #{roundNumber}
          </span>
        </div>

        <div
          className={`rounded-xl px-3 py-1.5 border font-bold text-xs md:text-sm flex items-center gap-1.5 shadow-sm transition-colors ${
            isClockwise
              ? 'bg-sky-500/15 border-sky-400/50 text-sky-200'
              : 'bg-amber-500/15 border-amber-400/50 text-amber-200'
          }`}
        >
          <span className="text-lg leading-none">
            {isClockwise ? '↻' : '↺'}
          </span>
          <span>{isClockwise ? 'Giro Horario' : 'Giro Antihorario'}</span>
        </div>
      </div>

      {/* Fila horizontal de tarjetas de jugadores en orden de mesa */}
      <div className="flex items-center gap-2 overflow-x-auto py-0.5 flex-1 justify-start lg:justify-center">
        {players.map((player, index) => {
          const isCurrent = index === currentPlayerIndex && player.lives > 0;
          const isEliminated = player.lives <= 0;

          return (
            <div
              key={player.id}
              className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-2xl border-2 transition-all ${
                isEliminated
                  ? 'bg-slate-950/60 border-slate-800/70 opacity-50 grayscale'
                  : isCurrent
                  ? 'bg-indigo-600/25 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 scale-[1.03]'
                  : 'bg-slate-800/80 border-slate-700'
              }`}
            >
              <span className="text-2xl leading-none">{player.avatar}</span>

              <div className="flex flex-col min-w-[68px]">
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs md:text-sm font-extrabold truncate max-w-[90px] ${
                      isCurrent ? 'text-amber-300' : 'text-white'
                    }`}
                  >
                    {player.name}
                  </span>
                </div>

                {isEliminated ? (
                  <span className="text-[11px] font-bold text-rose-400">
                    💀 Eliminado
                  </span>
                ) : (
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="tracking-tighter">
                      {Array.from({ length: player.lives })
                        .map(() => '❤️')
                        .join('')}
                    </span>
                    <span className="font-bold text-slate-300 bg-slate-950/70 px-1.5 py-0.5 rounded-md border border-slate-700/80">
                      🃏 x{player.hand.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </header>
  );
}
