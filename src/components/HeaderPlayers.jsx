import React from 'react';

export default function HeaderPlayers({
  players,
  currentPlayerIndex,
  direction,
  roundNumber,
}) {
  const isClockwise = direction === 1;

  return (
    <header className="w-full bg-white/30 backdrop-blur-xl border-b-4 border-white/50 px-3 py-2 flex items-center justify-between gap-3 shrink-0 shadow-sm">
      {/* Badge de Ronda y Sentido de Giro */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="px-2 py-0.5 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-widest text-white font-black drop-shadow-[0_2px_0_rgba(0,0,0,0.2)] leading-none">
            RONDA
          </span>
          <span className="text-2xl font-black text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.22)] leading-tight">
            {roundNumber}
          </span>
        </div>

        <div
          className={`rounded-2xl px-3 py-1.5 border-2 font-black text-xs md:text-sm flex items-center gap-1.5 shadow-sm transition-colors ${
            isClockwise
              ? 'bg-white/85 border-cyan-800 text-cyan-950'
              : 'bg-yellow-300 border-yellow-700 text-yellow-950'
          }`}
        >
          <span className="text-lg leading-none">
            {isClockwise ? '↻' : '↺'}
          </span>
          <span className="uppercase tracking-tight">
            {isClockwise ? 'Giro Horario' : 'Giro Antihorario'}
          </span>
        </div>
      </div>

      {/* Fila horizontal de tarjetas de jugadores en orden de mesa */}
      <div className="flex items-center gap-2 overflow-x-auto py-0.5 flex-1 justify-start lg:justify-center custom-scrollbar">
        {players.map((player, index) => {
          const isCurrent = index === currentPlayerIndex && player.lives > 0;
          const isEliminated = player.lives <= 0;

          return (
            <div
              key={player.id}
              className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-2xl border-[3px] transition-all ${
                isEliminated
                  ? 'bg-white/40 border-slate-400/70 opacity-60 grayscale'
                  : isCurrent
                  ? 'bg-yellow-300 border-yellow-600 ring-2 ring-white shadow-lg scale-[1.04]'
                  : 'bg-white/85 border-cyan-800 shadow-sm'
              }`}
            >
              <span className="text-2xl leading-none">{player.avatar}</span>

              <div className="flex flex-col min-w-[68px]">
                <span
                  className={`text-xs md:text-sm font-black uppercase truncate max-w-[95px] ${
                    isEliminated
                      ? 'text-slate-600 line-through'
                      : isCurrent
                      ? 'text-yellow-950'
                      : 'text-cyan-950'
                  }`}
                >
                  {player.name}
                </span>

                {isEliminated ? (
                  <span className="text-[11px] font-black text-red-600 uppercase">
                    💀 Eliminado
                  </span>
                ) : (
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="tracking-tighter">
                      {Array.from({ length: player.lives })
                        .map(() => '❤️')
                        .join('')}
                    </span>
                    <span className="font-black text-cyan-950 bg-cyan-100/90 px-1.5 py-0.5 rounded-lg border border-cyan-700/30">
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
