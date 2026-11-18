import React, { useState } from 'react';

export default function BalloonArena({
  riskPercent,
  impulsesRemaining,
  impulsesCompleted,
  holdProgress,
  isHolding,
  isExploding,
  disabled,
  pendingEndEffects,
  freezeNextImpulse,
  shieldActive,
  heavyAirActive,
  players,
  ultimaCartaJugada,
  onStartHold,
  onEndHold,
}) {
  const [balloonEmoji, setBalloonEmoji] = useState('🎈');

  const isShaking = riskPercent > 35 && !isExploding;

  // Escala dinámica entre 1.0 (0.5%) y 1.65 (99%) más un ligero pulso al mantener presionado
  const baseScale = 1 + Math.min(riskPercent, 99) * 0.0062;
  const holdBonusScale = isHolding ? (holdProgress / 100) * 0.14 : 0;
  const totalScale = isExploding ? 1.5 : Number((baseScale + holdBonusScale).toFixed(3));

  const totalTurnImpulses = impulsesCompleted + impulsesRemaining;

  const getRiskColorClass = () => {
    if (riskPercent >= 50) return 'text-rose-400';
    if (riskPercent >= 25) return 'text-amber-300';
    return 'text-emerald-300';
  };

  const getEffectBadges = () => {
    const badges = [];

    if (shieldActive) {
      badges.push({
        key: 'shield',
        text: '🛡️ Escudo de Goma Activo',
        style: 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200',
      });
    }
    if (freezeNextImpulse) {
      badges.push({
        key: 'ice',
        text: '🧊 Hielo Seco (Próx. impulso sin +%)',
        style: 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200',
      });
    }
    if (heavyAirActive) {
      badges.push({
        key: 'heavy-now',
        text: '⚠️ Aire Pesado Activo (x2 riesgo)',
        style: 'bg-rose-500/25 border-rose-400 text-rose-200',
      });
    }

    if (pendingEndEffects?.extraBlows > 0) {
      badges.push({
        key: 'c6',
        text: `🌬️ +${pendingEndEffects.extraBlows} Soplido Extra al sig.`,
        style: 'bg-rose-500/20 border-rose-400/60 text-rose-200',
      });
    }
    if (pendingEndEffects?.doubleTurn) {
      badges.push({
        key: 'c7',
        text: '😈 Doble Turno (6 impulsos al sig.)',
        style: 'bg-rose-500/20 border-rose-400/60 text-rose-200',
      });
    }
    if (pendingEndEffects?.pinCount > 0) {
      badges.push({
        key: 'c8',
        text: `📌 +${pendingEndEffects.pinCount * 10}% Alfiler al terminar`,
        style: 'bg-rose-500/20 border-rose-400/60 text-rose-200',
      });
    }
    if (pendingEndEffects?.heavyAirNext) {
      badges.push({
        key: 'c9',
        text: '⚠️ Aire Pesado al siguiente',
        style: 'bg-rose-500/20 border-rose-400/60 text-rose-200',
      });
    }
    if (pendingEndEffects?.sniperTargetId) {
      const target = players.find((p) => p.id === pendingEndEffects.sniperTargetId);
      badges.push({
        key: 'c11',
        text: `🎯 Francotirador → ${target ? target.name : 'Objetivo'}`,
        style: 'bg-rose-500/20 border-rose-400/60 text-rose-200',
      });
    }
    if (pendingEndEffects?.reverseCount % 2 === 1) {
      badges.push({
        key: 'c12',
        text: '🔄 Reversa lista al terminar',
        style: 'bg-amber-500/20 border-amber-400/60 text-amber-200',
      });
    }

    return badges;
  };

  const badges = getEffectBadges();

  return (
    <section className="flex-1 flex flex-col items-center justify-between p-3 md:p-5 relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Barra superior: Indicadores grandes de Riesgo, Impulsos y selector de skin */}
      <div className="w-full max-w-2xl flex flex-col items-center gap-2 z-10">
        <div className="w-full grid grid-cols-2 gap-3">
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-2.5 flex flex-col items-center justify-center shadow-lg">
            <span className="text-[11px] md:text-xs uppercase tracking-wider text-slate-400 font-bold">
              Riesgo de Explosión
            </span>
            <span className={`text-2xl md:text-4xl font-black tabular-nums ${getRiskColorClass()}`}>
              {riskPercent.toFixed(1)}%
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-2.5 flex flex-col items-center justify-center shadow-lg">
            <span className="text-[11px] md:text-xs uppercase tracking-wider text-slate-400 font-bold">
              Impulsos restantes
            </span>
            <span className="text-2xl md:text-4xl font-black text-indigo-300 tabular-nums">
              {impulsesRemaining}
            </span>
          </div>
        </div>

        {/* Info secundaria: última carta jugada + selector visual 🎈 / 🐡 */}
        <div className="w-full flex items-center justify-between text-xs text-slate-400 px-1">
          <div className="flex items-center gap-1.5">
            <span>Última carta (🪞):</span>
            {ultimaCartaJugada ? (
              <span className="font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                {ultimaCartaJugada.emoji} {ultimaCartaJugada.name}
              </span>
            ) : (
              <span className="italic text-slate-500">Ninguna aún</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setBalloonEmoji((prev) => (prev === '🎈' ? '🐡' : '🎈'))}
            className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded-lg text-slate-200 font-semibold transition"
            title="Cambiar aspecto del globo"
          >
            Modo: {balloonEmoji === '🎈' ? '🎈 Globo' : '🐡 Pez Globo'}
          </button>
        </div>

        {/* Badges de efectos activos y pendientes de fin de turno */}
        {badges.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-0.5">
            {badges.map((b) => (
              <span
                key={b.key}
                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${b.style}`}
              >
                {b.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Zona Central del Globo Interactivo */}
      <div className="flex-1 flex flex-col items-center justify-center w-full relative my-2">
        {/* Halo de tensión cuando el riesgo es alto */}
        {riskPercent > 35 && !isExploding && (
          <div className="absolute w-52 h-52 md:w-64 md:h-64 rounded-full bg-rose-500/15 blur-2xl animate-pulse pointer-events-none" />
        )}

        <button
          type="button"
          disabled={disabled || isExploding}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            onStartHold();
          }}
          onMouseUp={onEndHold}
          onMouseLeave={onEndHold}
          onTouchStart={(e) => {
            e.preventDefault();
            onStartHold();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onEndHold();
          }}
          onTouchCancel={onEndHold}
          onContextMenu={(e) => e.preventDefault()}
          style={{ transform: `scale(${totalScale})` }}
          className={`relative select-none touch-none focus:outline-none transition-transform duration-150 flex flex-col items-center justify-center rounded-full p-6 cursor-pointer disabled:cursor-not-allowed ${
            isHolding ? 'drop-shadow-[0_0_35px_rgba(251,191,36,0.45)]' : 'drop-shadow-[0_0_20px_rgba(99,102,241,0.25)]'
          }`}
        >
          <span
            className={`text-8xl md:text-9xl leading-none block ${
              isExploding
                ? 'animate-explosion-pop'
                : isShaking
                ? 'animate-shake-hard'
                : ''
            }`}
          >
            {isExploding ? '💥' : balloonEmoji}
          </span>
        </button>

        <p className="mt-4 text-xs md:text-sm font-bold tracking-wide text-slate-300 bg-slate-900/75 border border-slate-800 px-4 py-1.5 rounded-full">
          {isExploding
            ? '💥 ¡EL GLOBO EXPLOTÓ!'
            : isHolding
            ? '💨 ¡Mantén presionado para completar el impulso!'
            : '👆 Mantén presionado el globo (0.8s = 1 impulso)'}
        </p>
      </div>

      {/* Barra de Progreso Continua (0.8s) + Escalones de impulsos del turno */}
      <div className="w-full max-w-xl flex flex-col gap-2 z-10">
        {/* Barra continua 0% -> 100% */}
        <div className="w-full bg-slate-800/90 border border-slate-700 rounded-full h-5 overflow-hidden p-0.5 shadow-inner relative">
          <div
            className={`h-full rounded-full transition-none ${
              holdProgress > 80
                ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                : 'bg-gradient-to-r from-sky-400 to-emerald-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, holdProgress))}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white drop-shadow">
            {isHolding ? `Inflando... ${Math.round(holdProgress)}%` : 'Listo para inflar (0.8s)'}
          </span>
        </div>

        {/* Escalones visuales del turno */}
        {totalTurnImpulses > 0 && (
          <div className="flex items-center gap-1.5 w-full">
            {Array.from({ length: totalTurnImpulses }).map((_, idx) => {
              const isDone = idx < impulsesCompleted;
              const isActiveStep = idx === impulsesCompleted && isHolding;
              return (
                <div
                  key={idx}
                  className={`flex-1 h-2.5 rounded-full transition-colors ${
                    isDone
                      ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                      : isActiveStep
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
