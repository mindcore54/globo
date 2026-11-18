import React from 'react';

export default function VictoryScreen({ winner, roundNumber, onPlayAgain, onBackToSetup }) {
  if (!winner) return null;

  return (
    <div className="min-h-screen w-full bg-cyan-400 bg-moving-stripes flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg bg-white border-4 border-yellow-400 rounded-[2rem] p-8 shadow-2xl flex flex-col items-center text-center gap-5">
        <div className="text-xs font-black uppercase tracking-widest bg-yellow-300 text-yellow-950 border-2 border-yellow-400 px-4 py-1.5 rounded-full shadow-sm">
          🏆 ¡Victoria tras {roundNumber} Ronda(s)!
        </div>

        <div className="text-8xl drop-shadow-xl animate-bounce mt-2">
          {winner.avatar}
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-black text-cyan-950 uppercase">
            ¡{winner.name} Gana la Partida!
          </h1>
          <p className="text-slate-600 font-bold mt-1.5 text-sm">
            Sobrevivió con {winner.lives} {winner.lives === 1 ? 'vida' : 'vidas'}{' '}
            {Array.from({ length: winner.lives })
              .map(() => '❤️')
              .join('')}
          </p>
        </div>

        <div className="w-full flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-slate-100">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-black text-base uppercase border-2 border-yellow-300 shadow-[0_4px_0_rgb(202,138,4)] active:translate-y-[2px] active:shadow-none transition"
          >
            🔄 Revancha
          </button>
          <button
            type="button"
            onClick={onBackToSetup}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-white font-black text-base uppercase border-2 border-cyan-400 shadow-[0_4px_0_#155e75] active:translate-y-[2px] active:shadow-none transition"
          >
            ⚙️ Cambiar Jugadores
          </button>
        </div>
      </div>
    </div>
  );
}
