import React, { useState, useEffect, useMemo } from 'react';

export default function DraftModal({
  player,
  draftCards,
  previousHand = [],
  onConfirmDraft,
}) {
  // Deduplicar por ID por si el jugador terminó la ronda anterior con copias repetidas
  const uniquePreviousHand = useMemo(() => {
    const seen = new Set();
    return previousHand.filter((card) => {
      if (seen.has(card.id)) return false;
      seen.add(card.id);
      return true;
    });
  }, [previousHand]);

  const [keptIds, setKeptIds] = useState([]);
  const [selectedNewIds, setSelectedNewIds] = useState([]);

  useEffect(() => {
    // Por defecto conservamos hasta 2 cartas de la ronda anterior; el jugador puede descartarlas
    const initialKept = uniquePreviousHand.slice(0, 2).map((c) => c.instanceId);
    setKeptIds(initialKept);
    setSelectedNewIds([]);
  }, [player?.id, draftCards, uniquePreviousHand]);

  if (!player || !draftCards || draftCards.length === 0) return null;

  const keptCards = uniquePreviousHand.filter((c) => keptIds.includes(c.instanceId));
  const newCardsCount = Math.max(0, 5 - keptCards.length);
  const visibleNewCards = draftCards.slice(0, newCardsCount);

  const totalSelectedCount = keptCards.length + selectedNewIds.length;

  const toggleKeepPrevious = (instanceId) => {
    setKeptIds((prevKept) => {
      let nextKept;
      if (prevKept.includes(instanceId)) {
        nextKept = prevKept.filter((id) => id !== instanceId);
      } else {
        if (prevKept.length >= 2) return prevKept;
        nextKept = [...prevKept, instanceId];
      }

      const nextVisibleNewIds = new Set(
        draftCards.slice(0, Math.max(0, 5 - nextKept.length)).map((c) => c.instanceId)
      );
      setSelectedNewIds((prevNew) =>
        prevNew
          .filter((id) => nextVisibleNewIds.has(id))
          .slice(0, Math.max(0, 2 - nextKept.length))
      );

      return nextKept;
    });
  };

  const handleDiscardAllPrevious = () => {
    setKeptIds([]);
  };

  const toggleNewCard = (instanceId) => {
    setSelectedNewIds((prevNew) => {
      if (prevNew.includes(instanceId)) {
        return prevNew.filter((id) => id !== instanceId);
      }
      if (keptCards.length + prevNew.length >= 2) {
        return prevNew;
      }
      return [...prevNew, instanceId];
    });
  };

  const handleConfirm = () => {
    if (totalSelectedCount !== 2) return;
    const chosenNew = visibleNewCards.filter((c) =>
      selectedNewIds.includes(c.instanceId)
    );
    onConfirmDraft([...keptCards, ...chosenNew], keptCards.length);
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 md:p-7 shadow-2xl flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{player.avatar}</span>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white">
                Draft Inicial de Ronda — {player.name}
              </h2>
              <p className="text-sm text-slate-400">
                {uniquePreviousHand.length > 0 ? (
                  <>
                    Elige si quieres <strong className="text-sky-300">conservar</strong> tus cartas anteriores o <strong className="text-rose-300">descartarlas</strong>, y completa <strong className="text-amber-300">2 cartas</strong> en total.
                  </>
                ) : (
                  <>
                    Elige <strong className="text-amber-300">2 cartas</strong> para tu mano inicial. Las otras 3 se descartarán.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 text-center shrink-0">
            <span className="text-xs text-slate-400 uppercase block font-semibold">
              Seleccionadas
            </span>
            <span className="text-xl font-black text-amber-300">
              {totalSelectedCount} / 2
            </span>
          </div>
        </div>

        {/* Selector de cartas de la ronda anterior (conservar o descartar) */}
        {uniquePreviousHand.length > 0 && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
                Ronda anterior:
              </span>
              {uniquePreviousHand.map((card) => {
                const isKept = keptIds.includes(card.instanceId);
                const disableKeepMore = !isKept && keptIds.length >= 2;
                return (
                  <button
                    key={card.instanceId}
                    type="button"
                    disabled={disableKeepMore}
                    onClick={() => toggleKeepPrevious(card.instanceId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                      isKept
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                        : disableKeepMore
                        ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <span>{card.emoji}</span>
                    <span>{card.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30">
                      {isKept ? 'Conservar ✓' : 'Descartada'}
                    </span>
                  </button>
                );
              })}
            </div>

            {keptCards.length > 0 && (
              <button
                type="button"
                onClick={handleDiscardAllPrevious}
                className="shrink-0 text-xs font-bold text-rose-300 hover:text-rose-200 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 px-3 py-1.5 rounded-xl transition"
              >
                🗑️ Descartar todas
              </button>
            )}
          </div>
        )}

        {/* Ventana de selección de 5 cartas (K conservadas + (5-K) nuevas únicas) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {keptCards.map((card) => (
            <button
              key={`kept_${card.instanceId}`}
              type="button"
              onClick={() => toggleKeepPrevious(card.instanceId)}
              title="Toca para descartar esta carta y ver una nueva"
              className={`relative flex flex-col items-center justify-between text-center p-3.5 rounded-2xl border-2 transition-all min-h-[170px] ${card.tailwindClasses} ring-4 ring-sky-400 scale-[1.03] shadow-xl -translate-y-1`}
            >
              <span className="absolute -top-2.5 -right-2.5 bg-sky-400 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full shadow">
                🔄 Conservada
              </span>

              <span className="text-4xl my-1">{card.emoji}</span>
              <div className="font-extrabold text-sm leading-tight">
                {card.name}
              </div>
              <p className="text-xs opacity-85 leading-snug mt-1">
                {card.description}
              </p>
              <span className="text-[10px] font-bold opacity-70 mt-1">
                (Toca para descartar)
              </span>
            </button>
          ))}

          {visibleNewCards.map((card) => {
            const isSelected = selectedNewIds.includes(card.instanceId);
            const isDisabled = !isSelected && totalSelectedCount >= 2;

            return (
              <button
                key={card.instanceId}
                type="button"
                disabled={isDisabled}
                onClick={() => toggleNewCard(card.instanceId)}
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

        <div className="flex justify-end pt-1">
          <button
            type="button"
            disabled={totalSelectedCount !== 2}
            onClick={handleConfirm}
            className="w-full md:w-auto px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-extrabold text-base shadow-lg active:scale-95 transition"
          >
            {totalSelectedCount === 2
              ? '✅ Confirmar Mano Inicial (2 Cartas)'
              : `Selecciona ${2 - totalSelectedCount} carta(s) más`}
          </button>
        </div>
      </div>
    </div>
  );
}
