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
    <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white border-4 border-cyan-500 rounded-[2rem] p-5 md:p-7 shadow-2xl flex flex-col gap-4 text-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b-2 border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{player.avatar}</span>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-cyan-900 uppercase tracking-tight">
                Draft de Ronda — {player.name}
              </h2>
              <p className="text-sm font-medium text-slate-600">
                {uniquePreviousHand.length > 0 ? (
                  <>
                    Decide si <strong className="text-cyan-700">conservas</strong> tus cartas anteriores o las <strong className="text-red-500">descartas</strong>, y completa <strong className="text-amber-600">2 cartas</strong> en total.
                  </>
                ) : (
                  <>
                    Elige <strong className="text-cyan-700">2 cartas</strong> para tu mano inicial. Las otras 3 se descartarán.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="bg-cyan-50 border-2 border-cyan-200 rounded-2xl px-4 py-2 text-center shrink-0">
            <span className="text-[10px] text-cyan-700 uppercase block font-black tracking-widest">
              Seleccionadas
            </span>
            <span className="text-2xl font-black text-cyan-900">
              {totalSelectedCount} / 2
            </span>
          </div>
        </div>

        {/* Selector de cartas de la ronda anterior (conservar o descartar) */}
        {uniquePreviousHand.length > 0 && (
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 mr-1">
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 transition flex items-center gap-1.5 ${
                      isKept
                        ? 'bg-cyan-500 border-cyan-600 text-white shadow-sm'
                        : disableKeepMore
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-white border-slate-300 text-slate-600 hover:border-cyan-400'
                    }`}
                  >
                    <span>{card.emoji}</span>
                    <span>{card.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/15">
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
                className="shrink-0 text-xs font-black text-white bg-red-500 hover:bg-red-600 px-3.5 py-1.5 rounded-xl shadow-[0_3px_0_#991b1b] active:translate-y-[2px] active:shadow-none transition uppercase"
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
              className={`relative flex flex-col items-center justify-between text-center p-3.5 rounded-2xl border-[3px] transition-all min-h-[170px] ${card.tailwindClasses} ring-4 ring-cyan-400 scale-[1.03] shadow-lg -translate-y-1`}
            >
              <span className="absolute -top-2.5 -right-2.5 bg-cyan-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow">
                🔄 Conservada
              </span>

              <span className="text-4xl my-1">{card.emoji}</span>
              <div className="font-black text-sm leading-tight">
                {card.name}
              </div>
              <p className="text-xs font-medium opacity-85 leading-snug mt-1">
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
                className={`relative flex flex-col items-center justify-between text-center p-3.5 rounded-2xl border-[3px] transition-all min-h-[170px] ${
                  card.tailwindClasses
                } ${
                  isSelected
                    ? 'ring-4 ring-yellow-400 scale-[1.03] shadow-lg -translate-y-1'
                    : isDisabled
                    ? 'opacity-45 cursor-not-allowed'
                    : 'hover:scale-[1.02] active:scale-95 shadow-sm'
                }`}
              >
                {isSelected && (
                  <span className="absolute -top-2.5 -right-2.5 bg-yellow-400 text-yellow-950 font-black text-xs px-2.5 py-0.5 rounded-full shadow">
                    ✓ Elegida
                  </span>
                )}

                <span className="text-4xl my-1">{card.emoji}</span>
                <div className="font-black text-sm leading-tight">
                  {card.name}
                </div>
                <p className="text-xs font-medium opacity-85 leading-snug mt-1">
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
            className="w-full md:w-auto px-8 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed text-yellow-950 font-black text-base uppercase tracking-wide border-2 border-yellow-300 shadow-[0_4px_0_rgb(202,138,4)] active:translate-y-[2px] active:shadow-none transition"
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
