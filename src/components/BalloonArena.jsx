import React, { useState } from 'react';
import { playButtonSound } from '../utils/soundEffects';

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
  const totalScale = isExploding
    ? 1.5
    : Number((baseScale + holdBonusScale).toFixed(3));

  const totalTurnImpulses = impulsesCompleted + impulsesRemaining;

  const getRiskColorClass = () => {
    if (riskPercent >= 50) return 'text-red-600';
    if (riskPercent >= 25) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getEffectBadges = () => {
    const badges = [];

    if (shieldActive) {
      badges.push({
        key: 'shield',
        text: '🛡️ Escudo de Goma Activo',
        style: 'bg-emerald-100 border-emerald-600 text-emerald-950',
      });
    }
    if (freezeNextImpulse) {
      badges.push({
        key: 'ice',
        text: '🧊 Hielo Seco (Próx. impulso sin +%)',
        style: 'bg-cyan-100 border-cyan-600 text-cyan-950',
      });
    }
    if (heavyAirActive) {
      badges.push({
        key: 'heavy-now',
        text: '⚠️ Aire Pesado Activo (x2 riesgo)',
        style: 'bg-rose-100 border-rose-600 text-rose-950',
      });
    }

    if (pendingEndEffects?.extraBlows > 0) {
      badges.push({
        key: 'c6',
        text: `🌬️ +${pendingEndEffects.extraBlows} Soplido Extra al sig.`,
        style: 'bg-rose-100 border-rose-600 text-rose-950',
      });
    }
    if (pendingEndEffects?.doubleTurn) {
      badges.push({
        key: 'c7',
        text: '😈 Doble Turno (6 impulsos al sig.)',
        style: 'bg-rose-100 border-rose-600 text-rose-950',
      });
    }
    if (pendingEndEffects?.pinCount > 0) {
      badges.push({
        key: 'c8',
        text: `📌 +${pendingEndEffects.pinCount * 10}% Alfiler al terminar`,
        style: 'bg-rose-100 border-rose-600 text-rose-950',
      });
    }
    if (pendingEndEffects?.heavyAirNext) {
      badges.push({
        key: 'c9',
        text: '⚠️ Aire Pesado al siguiente',
        style: 'bg-rose-100 border-rose-600 text-rose-950',
      });
    }
    if (pendingEndEffects?.sniperTargetId) {
      const target = players.find((p) => p.id === pendingEndEffects.sniperTargetId);
      badges.push({
        key: 'c11',
        text: `🎯 Francotirador → ${target ? target.name : 'Objetivo'}`,
        style: 'bg-rose-100 border-rose-600 text-rose-950',
      });
    }
    if (pendingEndEffects?.reverseCount % 2 === 1) {
      badges.push({
        key: 'c12',
        text: '🔄 Reversa lista al terminar',
        style: 'bg-amber-100 border-amber-600 text-amber-950',
      });
    }

    return badges;
  };

  const badges = getEffectBadges();

  return (
    <section className="flex-1 flex flex-col items-center justify-between p-3 md:p-5 relative overflow-hidden">
      {/* Barra superior: Indicadores grandes de Riesgo, Impulsos y selector de skin */}
      <div className="w-full max-w-2xl flex flex-col items-center gap-2 z-10">
        <div className="w-full grid grid-cols-2 gap-3">
          <div className="bg-white/85 backdrop-blur-md border-4 border-white rounded-3xl px-4 py-2 flex flex-col items-center justify-center shadow-lg">
            <span className="text-[11px] md:text-xs uppercase tracking-wider text-cyan-900/70 font-black">
              Riesgo de Explosión
            </span>
            <span
              className={`text-2xl md:text-4xl font-black tabular-nums ${getRiskColorClass()}`}
            >
              {riskPercent.toFixed(1)}%
            </span>
          </div>

          <div className="bg-white/85 backdrop-blur-md border-4 border-white rounded-3xl px-4 py-2 flex flex-col items-center justify-center shadow-lg">
            <span className="text-[11px] md:text-xs uppercase tracking-wider text-cyan-900/70 font-black">
              Impulsos restantes
            </span>
            <span className="text-2xl md:text-4xl font-black text-indigo-600 tabular-nums">
              {impulsesRemaining}
            </span>
          </div>
        </div>

        {/* Info secundaria: última carta jugada + selector visual 🎈 / 🐡 */}
        <div className="w-full flex items-center justify-between text-xs px-1 gap-2">
          <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm text-white font-bold px-3 py-1 rounded-full">
            <span>Última carta (🪞):</span>
            {ultimaCartaJugada ? (
              <span className="font-black text-yellow-200">
                {ultimaCartaJugada.emoji} {ultimaCartaJugada.name}
              </span>
            ) : (
              <span className="opacity-75 italic">Ninguna aún</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              playButtonSound();
              setBalloonEmoji((prev) => (prev === '🎈' ? '🐡' : '🎈'));
            }}
            className="bg-white/85 hover:bg-white border-2 border-white px-3 py-1 rounded-full text-cyan-950 font-black shadow-sm active:scale-95 transition"
            title="Cambiar aspecto del globo"
          >
            {balloonEmoji === '🎈' ? '🎈 Globo' : '🐡 Pez Globo'}
          </button>
        </div>

        {/* Badges de efectos activos y pendientes de fin de turno */}
        {badges.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-0.5">
            {badges.map((b) => (
              <span
                key={b.key}
                className={`text-xs font-black px-3 py-1 rounded-full border-2 shadow-sm ${b.style}`}
              >
                {b.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Zona Central del Globo Interactivo */}
      <div className="flex-1 flex flex-col items-center justify-center w-full relative my-2">
        {riskPercent > 35 && !isExploding && (
          <div className="absolute w-52 h-52 md:w-64 md:h-64 rounded-full bg-red-500/30 blur-2xl animate-pulse pointer-events-none" />
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
            isHolding
              ? 'drop-shadow-[0_0_35px_rgba(255,255,255,0.85)]'
              : 'drop-shadow-[0_14px_20px_rgba(0,0,0,0.22)]'
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

        <p className="mt-4 text-xs md:text-sm font-black uppercase tracking-wide text-cyan-950 bg-white/85 border-2 border-white px-4 py-1.5 rounded-full shadow-md">
          {isExploding
            ? '💥 ¡EL GLOBO EXPLOTÓ!'
            : isHolding
            ? '💨 ¡Mantén presionado para completar!'
            : '👆 Mantén presionado (0.8s = 1 impulso)'}
        </p>
      </div>

      {/* Barra de Progreso Continua (0.8s) + Escalones de impulsos del turno */}
      <div className="w-full max-w-xl flex flex-col gap-2 z-10">
        <div className="w-full bg-white/60 backdrop-blur-sm border-[3px] border-white rounded-full h-6 overflow-hidden p-0.5 shadow-md relative">
          <div
            className={`h-full rounded-full transition-none ${
              holdProgress > 80
                ? 'bg-gradient-to-r from-amber-400 to-red-500'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, holdProgress))}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black uppercase tracking-wide text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
            {isHolding
              ? `Inflando... ${Math.round(holdProgress)}%`
              : 'Listo para inflar (0.8s)'}
          </span>
        </div>

        {totalTurnImpulses > 0 && (
          <div className="flex items-center gap-1.5 w-full">
            {Array.from({ length: totalTurnImpulses }).map((_, idx) => {
              const isDone = idx < impulsesCompleted;
              const isActiveStep = idx === impulsesCompleted && isHolding;
              return (
                <div
                  key={idx}
                  className={`flex-1 h-3 rounded-full border-2 transition-colors ${
                    isDone
                      ? 'bg-emerald-400 border-white shadow-sm'
                      : isActiveStep
                      ? 'bg-yellow-300 border-white animate-pulse'
                      : 'bg-white/45 border-white/70'
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
