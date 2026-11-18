import React from 'react';
import { playButtonSound } from '../utils/soundEffects';

export default function DefeatModal({
  defeatedPlayer,
  roundNumber,
  explodedRisk,
  aliveCount,
  onContinue,
}) {
  if (!defeatedPlayer) return null;

  const isGameOver = aliveCount <= 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-4 border-red-500 rounded-[2rem] p-6 md:p-8 shadow-2xl flex flex-col items-center text-center gap-4 text-slate-800">
        <div className="text-xs font-black uppercase tracking-widest bg-red-100 text-red-700 border-2 border-red-300 px-4 py-1.5 rounded-full">
          💀 Jugador Eliminado · Ronda {roundNumber}
        </div>

        <div className="relative mt-1">
          <span className="text-8xl block grayscale opacity-85 drop-shadow-lg">
            {defeatedPlayer.avatar}
          </span>
          <span className="absolute -bottom-2 -right-3 text-4xl animate-bounce">
            💀
          </span>
        </div>

        <div>
          <h2 className="text-3xl font-black text-red-600 uppercase tracking-tight">
            ¡DERROTA!
          </h2>
          <p className="text-lg font-black text-slate-800 uppercase mt-0.5">
            {defeatedPlayer.name} se quedó sin vidas
          </p>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            El globo explotó con <strong className="text-red-600">{explodedRisk.toFixed(1)}%</strong> de riesgo (0 / 3 ❤️).
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            playButtonSound();
            onContinue();
          }}
          className="w-full mt-2 py-4 px-6 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-black text-base uppercase tracking-wide border-2 border-yellow-300 shadow-[0_5px_0_rgb(202,138,4)] active:translate-y-[2px] active:shadow-none transition"
        >
          {isGameOver
            ? '🏆 Ver Ganador de la Partida'
            : '➡️ Continuar Partida'}
        </button>
      </div>
    </div>
  );
}
