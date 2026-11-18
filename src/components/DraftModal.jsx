import React, { useState, useEffect, useMemo } from 'react';
import { playButtonSound, playCardSelectSound } from '../utils/soundEffects';

const TARGET_HAND_SIZE = 3;

export default function DraftModal({
  player,
  draftCards,
  previousHand = [],
  onConfirmDraft,
}) {
  // Máximo 3 cartas de la ronda anterior (deduplicadas por ID)
  const uniquePreviousHand = useMemo(() => {
    const seen = new Set();
    return previousHand
      .filter((card) => {
        if (seen.has(card.id)) return false;
        seen.add(card.id);
        return true;
      })
      .slice(0, TARGET_HAND_SIZE);
  }, [previousHand]);

  const [step, setStep] = useState('select'); // 'decide' | 'select'
  const [decideKeepIds, setDecideKeepIds] = useState([]);
  const [fixedPool, setFixedPool] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (!player || !draftCards || draftCards.length === 0) return;

    if (uniquePreviousHand.length > 0) {
      setStep('decide');
      setDecideKeepIds(uniquePreviousHand.map((c) => c.instanceId));
      setFixedPool([]);
      setSelectedIds([]);
    } else {
      setStep('select');
      setDecideKeepIds([]);
      setFixedPool(draftCards.slice(0, 5));
      setSelectedIds([]);
    }
  }, [player?.id, draftCards, uniquePreviousHand]);

  if (!player || !draftCards || draftCards.length === 0) return null;

  const prevInstanceIdSet = new Set(uniquePreviousHand.map((c) => c.instanceId));

  // Paso 1: Toggle de qué cartas anteriores conservar
  const toggleDecideCard = (instanceId) => {
    setDecideKeepIds((prev) => {
      const exists = prev.includes(instanceId);
      playCardSelectSound(!exists);
      return exists ? prev.filter((id) => id !== instanceId) : [...prev, instanceId];
    });
  };

  // Paso 1 (con 3 cartas): Conservar todas inmediatamente sin abrir la ventana de 5 cartas
  const handleKeepAllThreeImmediately = () => {
    const kept = uniquePreviousHand.filter((c) =>
      decideKeepIds.includes(c.instanceId)
    );
    if (kept.length !== TARGET_HAND_SIZE) return;
    playButtonSound();
    onConfirmDraft(kept, TARGET_HAND_SIZE);
  };

  // Paso 1 -> Paso 2: Fija las 5 cartas de la ventana de selección (no cambian al desmarcar)
  const handleGoToSelectWindow = (overrideKeepCards = null) => {
    playButtonSound();
    const keptToFix =
      overrideKeepCards !== null
        ? overrideKeepCards
        : uniquePreviousHand.filter((c) => decideKeepIds.includes(c.instanceId));

    const newNeeded = Math.max(0, 5 - keptToFix.length);
    const pool = [...keptToFix, ...draftCards.slice(0, newNeeded)];

    setFixedPool(pool);
    setSelectedIds(keptToFix.map((c) => c.instanceId));
    setStep('select');
  };

  // Paso 2: Solo selecciona/deselecciona dentro de las 5 cartas fijas (nunca elimina cartas del grid)
  const toggleSelectCard = (instanceId) => {
    setSelectedIds((prev) => {
      if (prev.includes(instanceId)) {
        playCardSelectSound(false);
        return prev.filter((id) => id !== instanceId);
      }
      if (prev.length >= TARGET_HAND_SIZE) {
        return prev;
      }
      playCardSelectSound(true);
      return [...prev, instanceId];
    });
  };

  const handleConfirmSelection = () => {
    if (selectedIds.length !== TARGET_HAND_SIZE) return;
    playButtonSound();
    const chosen = fixedPool.filter((c) => selectedIds.includes(c.instanceId));
    const keptCount = chosen.filter((c) =>
      prevInstanceIdSet.has(c.instanceId)
    ).length;
    onConfirmDraft(chosen, keptCount);
  };

  // ============================================================================
  // PRIMERA VENTANA: Decidir si conservar o cambiar cartas de la ronda anterior
  // ============================================================================
  if (step === 'decide') {
    const keptCount = decideKeepIds.length;
    const hasThreePrev = uniquePreviousHand.length === TARGET_HAND_SIZE;
    const missingForThree = Math.max(0, TARGET_HAND_SIZE - keptCount);

    return (
      <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-3xl bg-white border-4 border-cyan-500 rounded-[2rem] p-5 md:p-7 shadow-2xl flex flex-col gap-5 text-slate-800">
          <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
            <span className="text-4xl">{player.avatar}</span>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-cyan-900 uppercase tracking-tight">
                Cartas de la Ronda Anterior — {player.name}
              </h2>
              <p className="text-sm font-medium text-slate-600">
                {hasThreePrev
                  ? 'Puedes conservar tus 3 cartas directamente o pasar a cambiar alguna en el Draft.'
                  : `Tienes ${uniquePreviousHand.length} carta(s) de la ronda anterior. Decide si conservarlas para completar ${TARGET_HAND_SIZE} o descartarlas.`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 py-2">
            {uniquePreviousHand.map((card) => {
              const isKept = decideKeepIds.includes(card.instanceId);
              return (
                <button
                  key={card.instanceId}
                  type="button"
                  onClick={() => toggleDecideCard(card.instanceId)}
                  className={`relative w-40 sm:w-44 rounded-2xl border-[3px] p-4 flex flex-col items-center justify-between text-center min-h-[170px] transition-all ${
                    card.tailwindClasses
                  } ${
                    isKept
                      ? 'ring-4 ring-cyan-400 scale-[1.03] shadow-lg'
                      : 'opacity-50 grayscale-[35%] hover:opacity-80'
                  }`}
                >
                  <span
                    className={`absolute -top-2.5 -right-2.5 font-black text-xs px-2.5 py-0.5 rounded-full shadow ${
                      isKept
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-400 text-white'
                    }`}
                  >
                    {isKept ? '✓ Conservar' : '✕ Descartar'}
                  </span>
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

          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t-2 border-slate-100">
            {hasThreePrev ? (
              <>
                {keptCount === TARGET_HAND_SIZE && (
                  <button
                    type="button"
                    onClick={handleKeepAllThreeImmediately}
                    className="flex-1 py-3.5 px-5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-sm md:text-base uppercase border-2 border-emerald-300 shadow-[0_4px_0_#047857] active:translate-y-[2px] active:shadow-none transition"
                  >
                    ✅ Conservar mis 3 Cartas
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleGoToSelectWindow()}
                  className="flex-1 py-3.5 px-5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-black text-sm md:text-base uppercase border-2 border-yellow-300 shadow-[0_4px_0_rgb(202,138,4)] active:translate-y-[2px] active:shadow-none transition"
                >
                  {keptCount === TARGET_HAND_SIZE
                    ? '🔄 Cambiar Alguna Carta'
                    : keptCount > 0
                    ? `🔄 Conservar ${keptCount} y Elegir ${missingForThree} Más`
                    : '🗑️ Descartar y Ver 5 Cartas'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleGoToSelectWindow()}
                  className="flex-1 py-3.5 px-5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-black text-sm md:text-base uppercase border-2 border-yellow-300 shadow-[0_4px_0_rgb(202,138,4)] active:translate-y-[2px] active:shadow-none transition"
                >
                  {keptCount > 0
                    ? `✅ Conservar ${keptCount} y Elegir ${missingForThree} Más`
                    : '🔄 Ir a Selección (5 Cartas Nuevas)'}
                </button>
                {keptCount > 0 && (
                  <button
                    type="button"
                    onClick={() => handleGoToSelectWindow([])}
                    className="flex-1 py-3.5 px-5 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black text-sm md:text-base uppercase border-2 border-red-400 shadow-[0_4px_0_#991b1b] active:translate-y-[2px] active:shadow-none transition"
                  >
                    🗑️ Descartar Todas (5 Cartas Nuevas)
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // SEGUNDA VENTANA: Selección de 3 cartas sobre 5 cartas fijas
  // ============================================================================
  return (
    <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white border-4 border-cyan-500 rounded-[2rem] p-5 md:p-7 shadow-2xl flex flex-col gap-5 text-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b-2 border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{player.avatar}</span>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-cyan-900 uppercase tracking-tight">
                Draft de Ronda — {player.name}
              </h2>
              <p className="text-sm font-medium text-slate-600">
                Elige <strong className="text-cyan-700">{TARGET_HAND_SIZE} cartas</strong> de estas 5 para tu mano inicial. Las demás se descartarán al confirmar.
              </p>
            </div>
          </div>

          <div className="bg-cyan-50 border-2 border-cyan-200 rounded-2xl px-4 py-2 text-center shrink-0">
            <span className="text-[10px] text-cyan-700 uppercase block font-black tracking-widest">
              Seleccionadas
            </span>
            <span className="text-2xl font-black text-cyan-900">
              {selectedIds.length} / {TARGET_HAND_SIZE}
            </span>
          </div>
        </div>

        {/* Grid de 5 cartas fijas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {fixedPool.map((card) => {
            const isSelected = selectedIds.includes(card.instanceId);
            const isFromPrevRound = prevInstanceIdSet.has(card.instanceId);
            const isDisabled = !isSelected && selectedIds.length >= TARGET_HAND_SIZE;

            return (
              <button
                key={card.instanceId}
                type="button"
                disabled={isDisabled}
                onClick={() => toggleSelectCard(card.instanceId)}
                className={`relative flex flex-col items-center justify-between text-center p-3.5 rounded-2xl border-[3px] transition-all min-h-[175px] ${
                  card.tailwindClasses
                } ${
                  isSelected
                    ? isFromPrevRound
                      ? 'ring-4 ring-cyan-400 scale-[1.03] shadow-lg -translate-y-1'
                      : 'ring-4 ring-yellow-400 scale-[1.03] shadow-lg -translate-y-1'
                    : isDisabled
                    ? 'opacity-45 cursor-not-allowed'
                    : 'hover:scale-[1.02] active:scale-95 shadow-sm'
                }`}
              >
                {isSelected && (
                  <span
                    className={`absolute -top-2.5 -right-2.5 font-black text-xs px-2.5 py-0.5 rounded-full shadow ${
                      isFromPrevRound
                        ? 'bg-cyan-500 text-white'
                        : 'bg-yellow-400 text-yellow-950'
                    }`}
                  >
                    {isFromPrevRound ? '🔄 Conservada' : '✓ Elegida'}
                  </span>
                )}

                {!isSelected && isFromPrevRound && (
                  <span className="absolute -top-2.5 -right-2.5 bg-slate-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow">
                    Ronda anterior
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
            disabled={selectedIds.length !== TARGET_HAND_SIZE}
            onClick={handleConfirmSelection}
            className="w-full md:w-auto px-8 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed text-yellow-950 font-black text-base uppercase tracking-wide border-2 border-yellow-300 shadow-[0_4px_0_rgb(202,138,4)] active:translate-y-[2px] active:shadow-none transition"
          >
            {selectedIds.length === TARGET_HAND_SIZE
              ? `✅ Confirmar Mano Inicial (${TARGET_HAND_SIZE} Cartas)`
              : `Selecciona ${TARGET_HAND_SIZE - selectedIds.length} carta(s) más`}
          </button>
        </div>
      </div>
    </div>
  );
}
