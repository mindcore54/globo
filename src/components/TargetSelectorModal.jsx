import React from 'react';
import { playButtonSound, playCardSelectSound } from '../utils/soundEffects';

export default function TargetSelectorModal({
  pendingCard,
  candidates,
  onSelectTarget,
  onCancel,
}) {
  if (!pendingCard) return null;

  const isSteal = pendingCard.requiresTarget === 'steal';
  const isSilence = pendingCard.requiresTarget === 'silence';

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border-4 border-cyan-500 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col gap-4 text-slate-800">
        <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-3">
          <span className="text-4xl">{pendingCard.emoji}</span>
          <div>
            <h3 className="text-xl font-black text-cyan-900 uppercase">
              {pendingCard.name} — Objetivo
            </h3>
            <p className="text-sm font-medium text-slate-500">
              {isSteal
                ? 'Selecciona un jugador vivo con cartas para robarle 1 carta al azar.'
                : isSilence
                ? 'Selecciona al jugador vivo cuyas cartas quedarán silenciadas en su próximo turno.'
                : 'Selecciona al jugador vivo que recibirá el turno al finalizar tus impulsos.'}
            </p>
          </div>
        </div>

        {candidates.length === 0 ? (
          <div className="py-6 text-center text-slate-500 font-semibold text-sm">
            No hay jugadores elegibles disponibles en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto custom-scrollbar">
            {candidates.map((target) => (
              <button
                key={target.id}
                type="button"
                onClick={() => {
                  playCardSelectSound(true);
                  onSelectTarget(target);
                }}
                className="flex items-center justify-between bg-slate-50 hover:bg-yellow-100 border-2 border-slate-200 hover:border-yellow-500 rounded-2xl p-3 text-left transition active:scale-95 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{target.avatar}</span>
                  <div>
                    <div className="font-black text-cyan-950 uppercase">
                      {target.name}
                    </div>
                    <div className="text-xs">
                      {Array.from({ length: target.lives })
                        .map(() => '❤️')
                        .join('')}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black bg-cyan-100 text-cyan-900 px-2.5 py-1 rounded-xl border border-cyan-300">
                  🃏 x{target.hand.length}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t-2 border-slate-100">
          <button
            type="button"
            onClick={() => {
              playButtonSound();
              onCancel();
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-sm uppercase transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
