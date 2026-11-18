import React, { useState } from 'react';
import { AVATARS } from '../data/gameData';

export default function SetupScreen({ onStartGame, initialPlayers = [] }) {
  const [players, setPlayers] = useState(initialPlayers);
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const livesPerPlayer = players.length >= 4 ? 2 : 3;

  const handleDigit = (digit) => {
    setError('');
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setError('');
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClearPin = () => {
    setError('');
    setPin('');
  };

  const handleAddPlayer = (e) => {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Ingresa un nombre para el jugador.');
      return;
    }
    if (players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Ya existe un jugador con ese nombre.');
      return;
    }
    if (pin.length !== 4) {
      setError('El PIN secreto debe tener exactamente 4 dígitos.');
      return;
    }
    if (players.length >= 8) {
      setError('Máximo 8 jugadores por partida.');
      return;
    }

    const newPlayer = {
      id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      avatar: selectedAvatar,
      pin,
    };

    const nextPlayers = [...players, newPlayer];
    setPlayers(nextPlayers);
    setName('');
    setPin('');
    setError('');

    // Sugerir el siguiente avatar no usado si existe
    const usedAvatars = new Set(nextPlayers.map((p) => p.avatar));
    const nextAvailable = AVATARS.find((av) => !usedAvatars.has(av));
    if (nextAvailable) {
      setSelectedAvatar(nextAvailable);
    }
  };

  const handleRemovePlayer = (id) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const canStart = players.length >= 2 && players.length <= 8;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 md:p-7 flex flex-col gap-5">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl md:text-5xl">🎈</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Globo Boom — Pass &amp; Play
              </h1>
              <p className="text-sm text-slate-400">
                Configura de 2 a 8 jugadores con su PIN secreto para proteger sus cartas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-2xl text-sm">
            <span className="text-slate-300 font-medium">Vidas por jugador:</span>
            <span className="text-lg tracking-wider">
              {Array.from({ length: livesPerPlayer }).map((_, i) => (
                <span key={i}>❤️</span>
              ))}
            </span>
            <span className="text-xs text-slate-400 ml-1">
              ({players.length >= 4 ? '4+ jug.' : '2-3 jug.'})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulario de registro + Teclado PIN */}
          <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-amber-300">
                Nuevo Jugador ({players.length}/8)
              </h2>
              {players.length >= 8 && (
                <span className="text-xs font-semibold bg-rose-500/20 text-rose-300 px-2.5 py-1 rounded-full">
                  Cupo lleno
                </span>
              )}
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Nombre del jugador
              </label>
              <input
                type="text"
                maxLength={16}
                value={name}
                onChange={(e) => {
                  setError('');
                  setName(e.target.value);
                }}
                placeholder="Ej. Carlos, Ana..."
                disabled={players.length >= 8}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none rounded-xl px-4 py-2.5 text-base font-semibold text-white placeholder-slate-500"
              />
            </div>

            {/* Selector de Avatar */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Elige tu Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((avatar) => {
                  const isSelected = selectedAvatar === avatar;
                  return (
                    <button
                      key={avatar}
                      type="button"
                      disabled={players.length >= 8}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`text-2xl md:text-3xl py-2 rounded-xl border-2 transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 scale-105 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {avatar}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PIN Secreto con teclado numérico */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 flex flex-col items-center sm:items-start">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  PIN Secreto (4 dígitos)
                </span>
                <p className="text-xs text-slate-500 mb-2">
                  Solo tú debes conocerlo al pasarse la tablet.
                </p>
                <div className="flex items-center gap-2.5 my-1">
                  {[0, 1, 2, 3].map((idx) => {
                    const digit = pin[idx];
                    return (
                      <div
                        key={idx}
                        className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-colors ${
                          digit
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-slate-950 border-slate-700 text-slate-600'
                        }`}
                      >
                        {digit ? '●' : ''}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Teclado numérico compacto */}
              <div className="grid grid-cols-3 gap-1.5 w-full sm:w-52">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    disabled={players.length >= 8}
                    onClick={() => handleDigit(d)}
                    className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-lg py-2 rounded-xl border border-slate-700 transition"
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={players.length >= 8}
                  onClick={handleClearPin}
                  className="bg-slate-800/70 hover:bg-slate-700 active:scale-95 text-slate-300 font-semibold text-xs py-2 rounded-xl border border-slate-700 transition"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  disabled={players.length >= 8}
                  onClick={() => handleDigit('0')}
                  className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-lg py-2 rounded-xl border border-slate-700 transition"
                >
                  0
                </button>
                <button
                  type="button"
                  disabled={players.length >= 8}
                  onClick={handleBackspace}
                  className="bg-rose-950/60 hover:bg-rose-900/70 active:scale-95 text-rose-200 font-semibold text-sm py-2 rounded-xl border border-rose-800/60 transition"
                >
                  ⌫
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm font-medium text-rose-300 bg-rose-500/15 border border-rose-500/40 rounded-xl px-3.5 py-2">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={players.length >= 8}
              onClick={handleAddPlayer}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-base text-white shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition"
            >
              ➕ Agregar Jugador ({selectedAvatar})
            </button>
          </div>

          {/* Lista de jugadores registrados y botón de Inicio */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 md:p-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-100">
                  Jugadores en Mesa
                </h2>
                <span className="text-xs font-semibold text-slate-400">
                  Mín. 2 · Máx. 8
                </span>
              </div>

              {players.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                  <span className="text-4xl mb-2">👥</span>
                  <p className="text-sm font-medium">
                    Aún no hay jugadores registrados.
                  </p>
                  <p className="text-xs mt-1">
                    Agrega al menos 2 para comenzar.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500 w-4">
                          #{index + 1}
                        </span>
                        <span className="text-2xl">{player.avatar}</span>
                        <div>
                          <div className="font-bold text-slate-100 leading-tight">
                            {player.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            PIN: •••• ·{' '}
                            {Array.from({ length: livesPerPlayer })
                              .map(() => '❤️')
                              .join('')}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(player.id)}
                        className="text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/50 hover:bg-rose-900/50 px-2.5 py-1.5 rounded-lg transition"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-slate-800">
              <div className="text-xs text-slate-400 text-center">
                Al iniciar, el orden en la mesa, quien empieza y el sentido de giro se sortean al azar.
              </div>
              <button
                type="button"
                disabled={!canStart}
                onClick={() => onStartGame(players)}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-extrabold text-lg shadow-xl shadow-emerald-500/20 active:scale-[0.99] transition"
              >
                {canStart
                  ? `🚀 Iniciar Partida (${players.length} Jugadores)`
                  : `Faltan ${Math.max(0, 2 - players.length)} jugador(es)`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
