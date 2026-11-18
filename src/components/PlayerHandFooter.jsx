import React from 'react';

export default function PlayerHandFooter({
  player,
  isPrivateHidden,
  cardsUsedThisTurn,
  impulsesRemaining,
  greedyPumpActive,
  ultimaCartaJugada,
  otherAlivePlayersWithCardsCount,
  otherAlivePlayersCount,
  isHolding,
  isExploding,
  onToggleGreedyPump,
  onPlayCard,
}) {
  if (!player) return null;

  const canActivateGreedy =
    !isPrivateHidden &&
    !isHolding &&
    !isExploding &&
    !greedyPumpActive &&
    impulsesRemaining >= 1 &&
    player.hand.length < 5;

  const cardLimitReached = cardsUsedThisTurn >= 2;

  const isCardDisabled = (card) => {
    if (isPrivateHidden || isHolding || isExploding) return true;
    if (cardLimitReached) return true;
    if (impulsesRemaining <= 0) return true;

    if (card.id === 'c14') {
      if (!ultimaCartaJugada) return true;
      if (ultimaCartaJugada.id === 'c10' && otherAlivePlayersWithCardsCount === 0) return true;
      if (ultimaCartaJugada.id === 'c11' && otherAlivePlayersCount === 0) return true;
    }
    if (card.id === 'c10' && otherAlivePlayersWithCardsCount === 0) return true;
    if (card.id === 'c11' && otherAlivePlayersCount === 0) return true;

    return false;
  };

  return (
    <footer className="w-full bg-slate-900 border-t border-slate-800 px-3 py-2.5 flex flex-col gap-2 shrink-0">
      {/* Barra superior del footer: Identidad, Bombeo Codicioso y Contador de Cartas */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{player.avatar}</span>
          <span className="text-sm font-extrabold text-white">
            Mano de {player.name}
          </span>
          <span className="text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-0.5 rounded-full">
            Cartas usadas este turno: {cardsUsedThisTurn}/2
          </span>
        </div>

        {/* Botón Toggle Bombeo Codicioso */}
        <button
          type="button"
          disabled={!canActivateGreedy}
          onClick={onToggleGreedyPump}
          className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs md:text-sm border-2 transition active:scale-95 flex items-center gap-1.5 ${
            greedyPumpActive
              ? 'bg-orange-500/25 border-orange-400 text-orange-200 cursor-default'
              : canActivateGreedy
              ? 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 border-orange-300 text-white shadow-lg shadow-orange-500/20'
              : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>🔥</span>
          <span>
            {greedyPumpActive
              ? 'Bombeo Codicioso Activado (+1 Carta al terminar)'
              : player.hand.length >= 5
              ? 'Mano llena (Máx. 5 cartas)'
              : 'Arriesgar +1 Impulso por Carta Extra'}
          </span>
        </button>
      </div>

      {/* Contenedor horizontal de cartas en mano */}
      {isPrivateHidden ? (
        <div className="h-28 flex items-center justify-center bg-slate-950/70 border border-slate-800 rounded-2xl text-sm text-slate-400 font-semibold">
          🔒 Cartas ocultas hasta que {player.name} ingrese su PIN
        </div>
      ) : player.hand.length === 0 ? (
        <div className="h-28 flex items-center justify-center bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl text-sm text-slate-500 font-medium">
          No tienes cartas en la mano. ¡Infla el globo o activa el Bombeo Codicioso!
        </div>
      ) : (
        <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1">
          {player.hand.map((card) => {
            const disabled = isCardDisabled(card);
            const isMirrorBlocked = card.id === 'c14' && !ultimaCartaJugada;

            return (
              <button
                key={card.instanceId}
                type="button"
                disabled={disabled}
                onClick={() => onPlayCard(card)}
                className={`shrink-0 w-40 md:w-44 rounded-2xl border-2 p-2.5 flex flex-col justify-between text-left transition-all ${
                  card.tailwindClasses
                } ${
                  disabled
                    ? 'opacity-45 cursor-not-allowed grayscale-[30%]'
                    : 'hover:-translate-y-0.5 hover:shadow-lg active:scale-95 cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-2xl leading-none">{card.emoji}</span>
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-black/10">
                    {isMirrorBlocked
                      ? 'Sin carta previa'
                      : card.category === 'green'
                      ? 'Defensa'
                      : card.category === 'red'
                      ? 'Ataque'
                      : 'Mesa'}
                  </span>
                </div>

                <div className="mt-1">
                  <div className="font-extrabold text-xs md:text-sm leading-tight">
                    {card.name}
                  </div>
                  <p className="text-[11px] opacity-85 leading-tight mt-0.5 line-clamp-2">
                    {card.id === 'c14' && ultimaCartaJugada
                      ? `Copia: ${ultimaCartaJugada.emoji} ${ultimaCartaJugada.name}`
                      : card.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </footer>
  );
}
