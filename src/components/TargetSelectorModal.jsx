import React from 'react';

export default function TargetSelectorModal({
  pendingCard,
  candidates,
  onSelectTarget,
  onCancel,
}) {
  if (!pendingCard) return null;

  const isSteal = pendingCard.requiresTarget === 'steal';

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-slate-700 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <span className="text-4xl">{pendingCard.emoji}</span>
          <div>
            <h3 className="text-xl font-extrabold text-white">
              {pendingCard.name} — Elige un Objetivo
            </h3>
            <p className="text-sm text-slate-400">
              {isSteal
                ? 'Selecciona un jugador vivo con cartas para robarle 1 carta al azar.'
                : 'Selecciona al jugador vivo que recibirá el turno al finalizar tus impulsos.'}
            </p>
          </div>
        </div>

        {candidates.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-sm">
            No hay jugadores elegibles disponibles en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto">
            {candidates.map((target) => (
              <button
                key={target.id}
                type="button"
                onClick={() => onSelectTarget(target)}
                className="flex items-center justify-between bg-slate-800 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-400 rounded-2xl p-3 text-left transition active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{target.avatar}</span>
                  <div>
                    <div className="font-bold text-white">{target.name}</div>
                    <div className="text-xs text-slate-300">
                      {Array.from({ length: target.lives })
                        .map(() => '❤️')
                        .join('')}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold bg-slate-950/80 text-amber-300 px-2.5 py-1 rounded-lg border border-slate-700">
                  🃏 x{target.hand.length}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
