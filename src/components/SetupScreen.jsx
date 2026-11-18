import React, { useState } from 'react';
import { AVATARS } from '../data/gameData';
import { playButtonSound, playErrorSound } from '../utils/soundEffects';

export default function SetupScreen({ onStartGame, initialPlayers = [] }) {
  const [players, setPlayers] = useState(initialPlayers);
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    const initialUsed = new Set(initialPlayers.map((p) => p.avatar));
    return AVATARS.find((av) => !initialUsed.has(av)) || AVATARS[0];
  });
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const livesPerPlayer = 3;
  const usedAvatars = new Set(players.map((p) => p.avatar));

  const handleDigit = (digit) => {
    setError('');
    if (pin.length < 4) {
      playButtonSound();
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setError('');
    playButtonSound();
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClearPin = () => {
    setError('');
    playButtonSound();
    setPin('');
  };

  const handleAddPlayer = (e) => {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      playErrorSound();
      setError('Ingresa un nombre para el jugador.');
      return;
    }
    if (players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      playErrorSound();
      setError('Ya existe un jugador con ese nombre.');
      return;
    }
    if (pin.length !== 4) {
      playErrorSound();
      setError('El PIN secreto debe tener exactamente 4 dígitos.');
      return;
    }
    if (players.length >= 8) {
      playErrorSound();
      setError('Máximo 8 jugadores por partida.');
      return;
    }
    if (usedAvatars.has(selectedAvatar)) {
      playErrorSound();
      setError('Ese avatar ya está en uso. Elige otro.');
      return;
    }

    playButtonSound();
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

    const nextUsedAvatars = new Set(nextPlayers.map((p) => p.avatar));
    const nextAvailable = AVATARS.find((av) => !nextUsedAvatars.has(av));
    if (nextAvailable) {
      setSelectedAvatar(nextAvailable);
    }
  };

  const handleRemovePlayer = (id) => {
    playButtonSound();
    const nextPlayers = players.filter((p) => p.id !== id);
    setPlayers(nextPlayers);
    const nextUsedAvatars = new Set(nextPlayers.map((p) => p.avatar));
    if (nextUsedAvatars.has(selectedAvatar)) {
      const nextAvailable = AVATARS.find((av) => !nextUsedAvatars.has(av));
      if (nextAvailable) {
        setSelectedAvatar(nextAvailable);
      }
    }
  };

  const canStart = players.length >= 2 && players.length <= 8;

  return (
    <div className="min-h-screen w-full bg-cyan-400 bg-moving-stripes text-slate-900 flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto font-sans">
      <div className="w-full max-w-5xl bg-white/30 backdrop-blur-xl border-4 border-white/50 rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-cyan-900/20 p-5 md:p-8 flex flex-col gap-5">
        {/* Encabezado estilo arcade */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl md:text-5xl drop-shadow">🎈</span>
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.22)] uppercase">
                ¡Boom!
              </h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Formulario de registro + Teclado PIN */}
          <div className="lg:col-span-7 bg-white/45 border-2 border-white/70 rounded-3xl p-4 md:p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base md:text-lg font-black uppercase tracking-wide text-cyan-950">
                Nuevo Jugador ({players.length}/8)
              </h2>
              {players.length >= 8 && (
                <span className="text-xs font-black uppercase bg-red-500 text-white px-3 py-1 rounded-full shadow">
                  Cupo lleno
                </span>
              )}
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-cyan-950/80 font-black mb-1">
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
                placeholder="EJ. CARLOS, ANA..."
                disabled={players.length >= 8}
                className="w-full bg-white/85 border-2 border-white focus:border-cyan-600 focus:outline-none rounded-xl px-4 py-2.5 text-base font-black text-cyan-950 placeholder:text-cyan-900/35 shadow-sm transition"
              />
            </div>

            {/* Selector de Avatar */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-cyan-950/80 font-black mb-1.5">
                Elige tu Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((avatar) => {
                  const isUsed = usedAvatars.has(avatar);
                  const isSelected = selectedAvatar === avatar && !isUsed;
                  const isDisabled = players.length >= 8 || isUsed;
                  return (
                    <button
                      key={avatar}
                      type="button"
                      disabled={isDisabled}
                      title={
                        isUsed
                          ? 'Avatar ya elegido por otro jugador'
                          : `Elegir ${avatar}`
                      }
                      onClick={() => {
                        if (isDisabled) return;
                        playButtonSound();
                        setError('');
                        setSelectedAvatar(avatar);
                      }}
                      className={`relative text-2xl md:text-3xl py-2 rounded-2xl border-2 transition-all ${
                        isUsed
                          ? 'bg-slate-200/50 border-white/40 opacity-40 grayscale cursor-not-allowed'
                          : isSelected
                          ? 'bg-yellow-300 border-yellow-500 scale-105 shadow-[0_3px_0_rgb(202,138,4)] active:scale-95'
                          : 'bg-white/75 border-white hover:bg-white active:scale-95'
                      }`}
                    >
                      <span>{avatar}</span>
                      {isUsed && (
                        <span className="absolute -top-1.5 -right-1.5 bg-slate-700 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow">
                          🔒
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PIN Secreto con teclado numérico (oculto con ●) */}
            <div className="bg-white/60 border-2 border-white rounded-2xl p-3.5 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 flex flex-col items-center sm:items-start">
                <span className="text-xs uppercase tracking-wider text-cyan-950 font-black">
                  PIN Secreto (4 dígitos)
                </span>
                <p className="text-xs font-semibold text-cyan-900/70 mb-2">
                  Se oculta al escribir para proteger tus cartas.
                </p>
                <div className="flex items-center gap-2.5 my-1">
                  {[0, 1, 2, 3].map((idx) => {
                    const digit = pin[idx];
                    return (
                      <div
                        key={idx}
                        className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-black transition-all ${
                          digit
                            ? 'bg-cyan-600 border-cyan-800 text-white shadow-inner scale-105'
                            : 'bg-white/90 border-cyan-900/20 text-cyan-900/30'
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
                    className="bg-white hover:bg-cyan-50 active:translate-y-[2px] active:shadow-none text-cyan-950 font-black text-lg py-2 rounded-xl border-2 border-white shadow-[0_3px_0_rgba(8,145,178,0.28)] transition"
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={players.length >= 8}
                  onClick={handleClearPin}
                  className="bg-white/80 hover:bg-white active:translate-y-[2px] active:shadow-none text-cyan-900 font-extrabold text-xs py-2 rounded-xl border-2 border-white shadow-[0_3px_0_rgba(8,145,178,0.2)] transition"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  disabled={players.length >= 8}
                  onClick={() => handleDigit('0')}
                  className="bg-white hover:bg-cyan-50 active:translate-y-[2px] active:shadow-none text-cyan-950 font-black text-lg py-2 rounded-xl border-2 border-white shadow-[0_3px_0_rgba(8,145,178,0.28)] transition"
                >
                  0
                </button>
                <button
                  type="button"
                  disabled={players.length >= 8}
                  onClick={handleBackspace}
                  className="bg-red-400 hover:bg-red-500 active:translate-y-[2px] active:shadow-none text-white font-black text-sm py-2 rounded-xl border-2 border-red-300 shadow-[0_3px_0_#991b1b] transition"
                >
                  ⌫
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-center text-sm shadow">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={players.length >= 8}
              onClick={handleAddPlayer}
              className="w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-45 disabled:cursor-not-allowed font-black text-base text-white uppercase tracking-wide border-2 border-cyan-400 shadow-[0_4px_0_#155e75] active:translate-y-[2px] active:shadow-none transition"
            >
              + Agregar Jugador ({selectedAvatar})
            </button>
          </div>

          {/* Lista de jugadores registrados y botón de Inicio */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4 bg-white/45 border-2 border-white/70 rounded-3xl p-4 md:p-5 shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base md:text-lg font-black uppercase tracking-wide text-cyan-950">
                  Jugadores en Mesa
                </h2>
                <span className="text-xs font-black text-cyan-900/70 uppercase">
                  Mín. 2 · Máx. 8
                </span>
              </div>

              {players.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-cyan-950/60 border-2 border-dashed border-white/70 bg-white/30 rounded-2xl">
                  <span className="text-4xl mb-2">👥</span>
                  <p className="text-sm font-bold">
                    Aún no hay jugadores registrados.
                  </p>
                  <p className="text-xs mt-1 font-semibold">
                    Agrega al menos 2 para comenzar.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between bg-white/75 border-2 border-white rounded-2xl px-3.5 py-2.5 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-cyan-500 text-white font-black w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-inner shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-2xl leading-none">{player.avatar}</span>
                        <div>
                          <div className="font-black text-cyan-950 uppercase leading-tight">
                            {player.name}
                          </div>
                          <div className="text-xs font-bold text-cyan-900/65">
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
                        className="w-8 h-8 flex items-center justify-center bg-red-400 hover:bg-red-500 text-white rounded-full font-black shadow transition-transform hover:scale-110 shrink-0"
                        title="Quitar jugador"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2.5 pt-3 border-t-2 border-white/50">
              <div className="text-xs font-bold text-cyan-950/75 text-center">
                El orden en la mesa, quien inicia y el giro se sortean al azar.
              </div>
              <button
                type="button"
                disabled={!canStart}
                onClick={() => {
                  playButtonSound();
                  onStartGame(players);
                }}
                className="w-full py-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 disabled:bg-white/40 disabled:text-cyan-950/40 disabled:border-white/40 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed text-yellow-900 font-black text-lg uppercase tracking-wide border-2 border-yellow-300 shadow-[0_5px_0_rgb(202,138,4)] hover:shadow-[0_2px_0_rgb(202,138,4)] hover:translate-y-[3px] transition-all"
              >
                {canStart
                  ? `¡JUGAR AHORA! (${players.length} Jugadores)`
                  : `Faltan ${Math.max(0, 2 - players.length)} jugador(es)`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
