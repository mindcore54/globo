import React, { useState, useEffect, useCallback } from 'react';

export default function PinLockModal({ player, roundNumber, onUnlock }) {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setEnteredPin('');
    setErrorMsg('');
    setErrorShake(false);
  }, [player?.id]);

  const handleDigit = useCallback(
    (digit) => {
      if (!player || enteredPin.length >= 4) return;
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4) {
        if (nextPin === player.pin) {
          onUnlock();
        } else {
          setErrorShake(true);
          setErrorMsg('PIN incorrecto. Intenta de nuevo.');
          setTimeout(() => {
            setEnteredPin('');
            setErrorShake(false);
          }, 450);
        }
      }
    },
    [enteredPin, onUnlock, player]
  );

  const handleDelete = useCallback(() => {
    setErrorMsg('');
    setEnteredPin((prev) => prev.slice(0, -1));
  }, []);

  // Permitir ingresar PIN también con teclado físico en escritorio
  useEffect(() => {
    const onKeyDown = (e) => {
      if (/^\d$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDigit, handleDelete]);

  if (!player) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div
        className={`w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center gap-5 transition-transform ${
          errorShake ? 'animate-shake-hard border-rose-500' : ''
        }`}
      >
        <div className="text-xs font-black uppercase tracking-widest text-cyan-300 bg-cyan-500/15 border border-cyan-500/40 px-3.5 py-1 rounded-full">
          🔒 Ronda {roundNumber} · Pantalla Privada
        </div>

        <div className="flex flex-col items-center text-center gap-1.5">
          <div className="text-6xl drop-shadow-lg mb-1">{player.avatar}</div>
          <h2 className="text-2xl font-black text-slate-100 leading-snug">
            Turno de <span className="text-cyan-400">{player.name}</span>
          </h2>
          <p className="text-sm text-slate-400">
            Ingresa tu PIN de 4 dígitos
          </p>
        </div>

        {/* Indicadores ocultos de 4 dígitos */}
        <div className="flex items-center justify-center gap-3 my-1">
          {[0, 1, 2, 3].map((idx) => {
            const filled = idx < enteredPin.length;
            return (
              <div
                key={idx}
                className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                  errorShake
                    ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                    : filled
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 scale-105 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                    : 'border-slate-600 bg-slate-800 text-slate-600'
                }`}
              >
                {filled ? '●' : ''}
              </div>
            );
          })}
        </div>

        <div className="h-5 text-sm font-bold text-rose-400 text-center">
          {errorMsg}
        </div>

        {/* Teclado numérico táctil grande */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:translate-y-[2px] active:bg-cyan-600 border border-slate-600 text-2xl font-black text-white shadow-[0_3px_0_#0f172a] transition"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setEnteredPin('');
              setErrorMsg('');
            }}
            className="h-14 rounded-2xl bg-slate-800/70 hover:bg-slate-700 active:translate-y-[2px] border border-slate-700 text-xs font-black uppercase text-slate-300 transition"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:translate-y-[2px] active:bg-cyan-600 border border-slate-600 text-2xl font-black text-white shadow-[0_3px_0_#0f172a] transition"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-rose-950/70 hover:bg-rose-900/80 active:translate-y-[2px] border border-rose-700/70 text-sm font-black uppercase text-rose-200 transition"
          >
            Borrar
          </button>
        </div>
      </div>
    </div>
  );
}
