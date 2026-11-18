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
    <footer className="w-full bg-white/35 backdrop-blur-xl border-t-4 border-white/60 px-3 py-2.5 flex flex-col gap-2 shrink-0">
      {/* Barra superior del footer: Identidad, Bombeo Codicioso y Contador de Cartas */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-white/85 border-2 border-white rounded-full px-3 py-1 flex items-center gap-2 shadow-sm">
            <span className="text-xl leading-none">{player.avatar}</span>
            <span className="text-xs md:text-sm font-black uppercase text-cyan-950">
              Mano de {player.name}
            </span>
          </div>
          <span className="text-xs font-black bg-cyan-900 text-white px-3 py-1 rounded-full shadow-sm">
            Cartas usadas este turno: {cardsUsedThisTurn}/2
          </span>
        </div>

        {/* Botón Toggle Bombeo Codicioso estilo arcade 3D */}
        <button
          type="button"
          disabled={!canActivateGreedy}
          onClick={onToggleGreedyPump}
          className={`px-4 py-1.5 rounded-xl font-black text-xs md:text-sm border-2 transition flex items-center gap-1.5 ${
            greedyPumpActive
              ? 'bg-orange-400 border-orange-200 text-orange-950 shadow-sm cursor-default'
              : canActivateGreedy
              ? 'bg-yellow-400 hover:bg-yellow-300 border-yellow-300 text-yellow-950 shadow-[0_4px_0_rgb(202,138,4)] active:translate-y-[2px] active:shadow-none'
              : 'bg-white/45 border-white/60 text-cyan-950/45 cursor-not-allowed'
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
        <div className="h-28 flex items-center justify-center bg-white/45 border-2 border-white/70 rounded-2xl text-sm text-cyan-950 font-black">
          🔒 Cartas ocultas hasta que {player.name} ingrese su PIN
        </div>
      ) : player.hand.length === 0 ? (
        <div className="h-28 flex items-center justify-center bg-white/40 border-2 border-dashed border-white/80 rounded-2xl text-sm text-cyan-950/75 font-bold">
          No tienes cartas en la mano. ¡Infla el globo o activa el Bombeo Codicioso!
        </div>
      ) : (
        <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1 custom-scrollbar">
          {player.hand.map((card) => {
            const disabled = isCardDisabled(card);
            const isMirrorBlocked = card.id === 'c14' && !ultimaCartaJugada;

            return (
              <button
                key={card.instanceId}
                type="button"
                disabled={disabled}
                onClick={() => onPlayCard(card)}
                className={`shrink-0 w-40 md:w-44 rounded-2xl border-[3px] p-2.5 flex flex-col justify-between text-left transition-all shadow-[0_4px_0_rgba(0,0,0,0.14)] ${
                  card.tailwindClasses
                } ${
                  disabled
                    ? 'opacity-45 cursor-not-allowed grayscale-[30%] shadow-none'
                    : 'hover:-translate-y-0.5 hover:shadow-[0_6px_0_rgba(0,0,0,0.18)] active:translate-y-[2px] active:shadow-none cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-2xl leading-none">{card.emoji}</span>
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-lg bg-black/10">
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
                  <div className="font-black text-xs md:text-sm leading-tight">
                    {card.name}
                  </div>
                  <p className="text-[11px] font-medium opacity-90 leading-tight mt-0.5 line-clamp-2">
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
