import React, { useState, useEffect } from 'react';

export default function DraftModal({ player, draftCards, onConfirmDraft }) {
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setSelectedIds([]);
  }, [player?.id, draftCards]);

  if (!player || !draftCards || draftCards.length === 0) return null;

  const toggleCard = (instanceId) => {
    setSelectedIds((prev) => {
      if (prev.includes(instanceId)) {
        return prev.filter((id) => id !== instanceId);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, instanceId];
    });
  };

  const handleConfirm = () => {
    if (selectedIds.length !== 2) return;
    const chosen = draftCards.filter((c) => selectedIds.includes(c.instanceId));
    onConfirmDraft(chosen);
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 md:p-7 shadow-2xl flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{player.avatar}</span>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white">
                Draft Inicial de Ronda — {player.name}
              </h2>
              <p className="text-sm text-slate-400">
                Elige <strong className="text-amber-300">2 cartas</strong> para tu mano inicial. Las otras 3 se descartarán.
              </p>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 text-center">
            <span className="text-xs text-slate-400 uppercase block font-semibold">
              Seleccionadas
            </span>
            <span className="text-xl font-black text-amber-300">
              {selectedIds.length} / 2
            </span>
          </div>
        </div>

        {/* Grid de 5 cartas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {draftCards.map((card) => {
            const isSelected = selectedIds.includes(card.instanceId);
            const isDisabled = !isSelected && selectedIds.length >= 2;

            return (
              <button
                key={card.instanceId}
                type="button"
                disabled={isDisabled}
                onClick={() => toggleCard(card.instanceId)}
                className={`relative flex flex-col items-center justify-between text-center p-3.5 rounded-2xl border-2 transition-all min-h-[170px] ${
                  card.tailwindClasses
                } ${
                  isSelected
                    ? 'ring-4 ring-amber-400 scale-[1.03] shadow-xl -translate-y-1'
                    : isDisabled
                    ? 'opacity-45 cursor-not-allowed'
                    : 'hover:scale-[1.02] active:scale-95'
                }`}
              >
                {isSelected && (
                  <span className="absolute -top-2.5 -right-2.5 bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full shadow">
                    ✓ Elegida
                  </span>
                )}

                <span className="text-4xl my-1">{card.emoji}</span>
                <div className="font-extrabold text-sm leading-tight">
                  {card.name}
                </div>
                <p className="text-xs opacity-85 leading-snug mt-1">
                  {card.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={selectedIds.length !== 2}
            onClick={handleConfirm}
            className="w-full md:w-auto px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-extrabold text-base shadow-lg active:scale-95 transition"
          >
            {selectedIds.length === 2
              ? '✅ Confirmar Mano Inicial (2 Cartas)'
              : `Selecciona ${2 - selectedIds.length} carta(s) más`}
          </button>
        </div>
      </div>
    </div>
  );
}
