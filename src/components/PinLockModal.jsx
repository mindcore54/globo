import React, { useState, useEffect } from 'react';

export default function PinLockModal({ player, roundNumber, onUnlock }) {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setEnteredPin('');
    setErrorMsg('');
    setErrorShake(false);
  }, [player?.id]);

  if (!player) return null;

  const handleDigit = (digit) => {
    if (enteredPin.length >= 4) return;
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
  };

  const handleDelete = () => {
    setErrorMsg('');
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <div
        className={`w-full max-w-md bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center gap-5 transition-transform ${
          errorShake ? 'animate-shake-hard border-rose-500' : ''
        }`}
      >
        <div className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full">
          🔒 Pantalla Privada · Ronda {roundNumber}
        </div>

        <div className="flex flex-col items-center text-center gap-2">
          <div className="text-6xl md:text-7xl drop-shadow-lg">{player.avatar}</div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white leading-snug">
            Turno de {player.avatar} {player.name}
          </h2>
          <p className="text-sm text-slate-400">
            Ingresa tu PIN de 4 dígitos para desbloquear tu turno
          </p>
        </div>

        {/* Indicadores de los 4 dígitos */}
        <div className="flex items-center justify-center gap-4 my-1">
          {[0, 1, 2, 3].map((idx) => {
            const filled = idx < enteredPin.length;
            return (
              <div
                key={idx}
                className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                  errorShake
                    ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                    : filled
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 scale-105'
                    : 'border-slate-700 bg-slate-950 text-slate-600'
                }`}
              >
                {filled ? '●' : ''}
              </div>
            );
          })}
        </div>

        <div className="h-5 text-sm font-semibold text-rose-400 text-center">
          {errorMsg}
        </div>

        {/* Teclado numérico grande */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 active:bg-indigo-600 border border-slate-700 text-2xl font-extrabold text-white shadow-md transition"
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
            className="h-16 rounded-2xl bg-slate-800/60 hover:bg-slate-700 active:scale-95 border border-slate-700 text-sm font-bold text-slate-300 transition"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 active:bg-indigo-600 border border-slate-700 text-2xl font-extrabold text-white shadow-md transition"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-rose-950/60 hover:bg-rose-900/70 active:scale-95 border border-rose-800/60 text-lg font-bold text-rose-200 transition"
          >
            Borrar
          </button>
        </div>
      </div>
    </div>
  );
}
