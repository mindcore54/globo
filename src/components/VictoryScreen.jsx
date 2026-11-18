import React from 'react';

export default function VictoryScreen({ winner, roundNumber, onPlayAgain, onBackToSetup }) {
  if (!winner) return null;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-400/70 rounded-3xl p-8 shadow-2xl shadow-amber-500/10 flex flex-col items-center text-center gap-5">
        <div className="text-xs font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-400/40 px-4 py-1.5 rounded-full">
          🏆 ¡Victoria tras {roundNumber} Ronda(s)!
        </div>

        <div className="text-8xl drop-shadow-xl animate-bounce mt-2">
          {winner.avatar}
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white">
            ¡{winner.name} Gana la Partida!
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Sobrevivió con {winner.lives} {winner.lives === 1 ? 'vida' : 'vidas'}{' '}
            {Array.from({ length: winner.lives })
              .map(() => '❤️')
              .join('')}
          </p>
        </div>

        <div className="w-full flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-base shadow-lg active:scale-95 transition"
          >
            🔄 Revancha (Mismos Jugadores)
          </button>
          <button
            type="button"
            onClick={onBackToSetup}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base border border-slate-700 active:scale-95 transition"
          >
            ⚙️ Cambiar Jugadores
          </button>
        </div>
      </div>
    </div>
  );
}
