import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CARDS_CATALOG,
  createRandomCard,
  generateDraftCards,
} from './data/gameData';
import {
  playInflateSound,
  stopInflateSound,
  playSuccessSound,
  playExplosionSound,
  playCardSound,
} from './utils/soundEffects';
import SetupScreen from './components/SetupScreen';
import PinLockModal from './components/PinLockModal';
import DraftModal from './components/DraftModal';
import TargetSelectorModal from './components/TargetSelectorModal';
import HeaderPlayers from './components/HeaderPlayers';
import BalloonArena from './components/BalloonArena';
import HistorySidebar from './components/HistorySidebar';
import PlayerHandFooter from './components/PlayerHandFooter';
import VictoryScreen from './components/VictoryScreen';

const HOLD_DURATION_MS = 800;

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createInitialPendingEffects() {
  return {
    extraBlows: 0,
    doubleTurn: false,
    pinCount: 0,
    heavyAirNext: false,
    sniperTargetId: null,
    reverseCount: 0,
  };
}

function getTimeLabel() {
  const now = new Date();
  return now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function makeLog(text, type = 'info') {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    time: getTimeLabel(),
    text,
    type,
  };
}

function getNextAlivePlayerIndex(players, fromIndex, direction) {
  const total = players.length;
  for (let step = 1; step <= total; step++) {
    const idx = (fromIndex + step * direction + total * 10) % total;
    if (players[idx].lives > 0) {
      return idx;
    }
  }
  return fromIndex;
}

function calculateNextRisk(currentRisk, heavyAirActive) {
  let increment = 0;
  if (currentRisk < 15) {
    increment = 2.5;
  } else if (currentRisk <= 40) {
    increment = 4.5;
  } else {
    increment = 7.0;
  }

  if (heavyAirActive) {
    increment *= 2;
  }

  return Math.min(99.0, Number((currentRisk + increment).toFixed(1)));
}

export default function App() {
  const [phase, setPhase] = useState('setup'); // 'setup' | 'playing' | 'victory'
  const [savedRoster, setSavedRoster] = useState([]);
  const [game, setGame] = useState(null);
  const gameRef = useRef(null);

  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [pendingTargetSelection, setPendingTargetSelection] = useState(null);

  const isHoldingRef = useRef(false);
  const holdStartRef = useRef(0);
  const rafRef = useRef(null);
  const explosionTimerRef = useRef(null);

  const commitGame = useCallback((nextGame) => {
    gameRef.current = nextGame;
    setGame(nextGame);
  }, []);

  const stopHold = useCallback(() => {
    isHoldingRef.current = false;
    setIsHolding(false);
    setHoldProgress(0);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    stopInflateSound();
  }, []);

  useEffect(() => {
    return () => {
      stopHold();
      if (explosionTimerRef.current) {
        clearTimeout(explosionTimerRef.current);
      }
    };
  }, [stopHold]);

  /**
   * Inicia una partida nueva con los jugadores configurados en SetupScreen.
   */
  const handleStartGame = useCallback(
    (rawPlayers) => {
      stopHold();
      setPendingTargetSelection(null);
      setSavedRoster(rawPlayers);

      const initialLives = rawPlayers.length >= 4 ? 2 : 3;
      const shuffled = shuffleArray(rawPlayers).map((p) => ({
        ...p,
        lives: initialLives,
        hand: [],
        needsDraft: true,
      }));

      const firstPlayerIndex = Math.floor(Math.random() * shuffled.length);
      const initialDirection = Math.random() < 0.5 ? 1 : -1;
      const starter = shuffled[firstPlayerIndex];

      const initialState = {
        roundNumber: 1,
        players: shuffled,
        currentPlayerIndex: firstPlayerIndex,
        direction: initialDirection,
        riskPercent: 0.5,
        ultimaCartaJugada: null,
        isLocked: true,
        draftCards: [],
        impulsesRemaining: 3,
        impulsesCompleted: 0,
        cardsUsedThisTurn: 0,
        recompensaCartaExtra: false,
        freezeNextImpulse: false,
        shieldActive: false,
        heavyAirActive: false,
        pendingEndEffects: createInitialPendingEffects(),
        isExploding: false,
        winner: null,
        logs: [
          makeLog(
            `🎈 ¡Inicia Ronda #1! Giro ${
              initialDirection === 1 ? 'Horario ↻' : 'Antihorario ↺'
            }. Comienza ${starter.avatar} ${starter.name}.`,
            'round'
          ),
        ],
      };

      commitGame(initialState);
      setPhase('playing');
    },
    [commitGame, stopHold]
  );

  /**
   * Cierra el turno con éxito al llegar a 0 impulsos (o por Escudo de Goma / cartas verdes).
   */
  const closeTurnSuccess = useCallback(
    (g, extraLogs = []) => {
      stopHold();
      playSuccessSound();

      const currentPlayer = g.players[g.currentPlayerIndex];
      const newLogs = [...extraLogs];

      let updatedPlayers = g.players.map((p) => ({ ...p, hand: [...p.hand] }));
      let nextRisk = g.riskPercent;
      let nextDirection = g.direction;

      // 1. Recompensa de Bombeo Codicioso (+1 carta aleatoria, máx 5 en mano)
      if (g.recompensaCartaExtra) {
        const targetPlayer = updatedPlayers[g.currentPlayerIndex];
        if (targetPlayer.hand.length < 5) {
          const bonusCard = createRandomCard();
          targetPlayer.hand.push(bonusCard);
          newLogs.unshift(
            makeLog(
              `🔥 ${currentPlayer.avatar} ${currentPlayer.name} sobrevivió al Bombeo Codicioso y robó 1 carta extra.`,
              'success'
            )
          );
        } else {
          newLogs.unshift(
            makeLog(
              `🔥 ${currentPlayer.avatar} ${currentPlayer.name} sobrevivió, pero su mano ya estaba llena (5 cartas).`,
              'info'
            )
          );
        }
      }

      // 2. Ejecutar efectosPendientesFinDeTurno
      const pending = g.pendingEndEffects;

      if (pending.pinCount > 0) {
        nextRisk = Math.min(99.0, Number((nextRisk + pending.pinCount * 10).toFixed(1)));
        newLogs.unshift(
          makeLog(
            `📌 ¡Alfiler! El riesgo subió +${pending.pinCount * 10}% al cerrar turno → ahora en ${nextRisk.toFixed(1)}%.`,
            'danger'
          )
        );
      }

      if (pending.reverseCount % 2 === 1) {
        nextDirection = nextDirection * -1;
        newLogs.unshift(
          makeLog(
            `🔄 ¡Reversa activada! Sentido cambiado a ${
              nextDirection === 1 ? 'Horario ↻' : 'Antihorario ↺'
            }.`,
            'card'
          )
        );
      }

      // 3. Calcular siguiente jugador vivo
      let nextPlayerIndex = -1;
      if (pending.sniperTargetId) {
        const sniperIdx = updatedPlayers.findIndex(
          (p) => p.id === pending.sniperTargetId && p.lives > 0
        );
        if (sniperIdx !== -1) {
          nextPlayerIndex = sniperIdx;
          const sniperTarget = updatedPlayers[sniperIdx];
          newLogs.unshift(
            makeLog(
              `🎯 ¡Francotirador! El turno salta directo a ${sniperTarget.avatar} ${sniperTarget.name}.`,
              'danger'
            )
          );
        }
      }

      if (nextPlayerIndex === -1) {
        nextPlayerIndex = getNextAlivePlayerIndex(
          updatedPlayers,
          g.currentPlayerIndex,
          nextDirection
        );
      }

      // 4. Preparar impulsos y estado del siguiente jugador
      const baseImpulses = pending.doubleTurn ? 6 : 3;
      const nextImpulses = baseImpulses + (pending.extraBlows || 0);
      const nextPlayer = updatedPlayers[nextPlayerIndex];

      newLogs.unshift(
        makeLog(
          `⏭️ Turno pasa a ${nextPlayer.avatar} ${nextPlayer.name} (${nextImpulses} impulsos).`,
          'info'
        )
      );

      const nextState = {
        ...g,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        direction: nextDirection,
        riskPercent: nextRisk,
        isLocked: true,
        draftCards: [],
        impulsesRemaining: nextImpulses,
        impulsesCompleted: 0,
        cardsUsedThisTurn: 0,
        recompensaCartaExtra: false,
        freezeNextImpulse: false,
        shieldActive: false,
        heavyAirActive: Boolean(pending.heavyAirNext),
        pendingEndEffects: createInitialPendingEffects(),
        logs: [...newLogs, ...g.logs].slice(0, 60),
      };

      commitGame(nextState);
    },
    [commitGame, stopHold]
  );

  /**
   * Maneja la explosión real del globo y reinicio de ronda o victoria.
   */
  const triggerExplosion = useCallback(
    (g) => {
      stopHold();
      playExplosionSound();

      const victim = g.players[g.currentPlayerIndex];
      const updatedPlayers = g.players.map((p, idx) =>
        idx === g.currentPlayerIndex
          ? { ...p, lives: Math.max(0, p.lives - 1) }
          : p
      );

      const updatedVictim = updatedPlayers[g.currentPlayerIndex];
      const explosionLogs = [
        makeLog(
          `💥 ¡BOOM! El globo explotó (${g.riskPercent.toFixed(1)}%) en turno de ${
            victim.avatar
          } ${victim.name} (-1 ❤️).`,
          'danger'
        ),
      ];

      if (updatedVictim.lives === 0) {
        explosionLogs.unshift(
          makeLog(
            `💀 ${victim.avatar} ${victim.name} perdió su última vida y queda eliminado.`,
            'danger'
          )
        );
      }

      const explodingState = {
        ...g,
        players: updatedPlayers,
        isExploding: true,
        logs: [...explosionLogs, ...g.logs].slice(0, 60),
      };

      commitGame(explodingState);

      if (explosionTimerRef.current) {
        clearTimeout(explosionTimerRef.current);
      }

      explosionTimerRef.current = setTimeout(() => {
        const current = gameRef.current;
        if (!current) return;

        const alivePlayers = current.players.filter((p) => p.lives > 0);
        if (alivePlayers.length <= 1) {
          const winner = alivePlayers[0] || updatedVictim;
          commitGame({
            ...current,
            isExploding: false,
            winner,
          });
          setPhase('victory');
          return;
        }

        // Reiniciar nueva ronda
        const newDirection = Math.random() < 0.5 ? 1 : -1;
        const resetPlayers = current.players.map((p) => ({
          ...p,
          hand: [],
          needsDraft: p.lives > 0,
        }));

        const nextStarterIdx = getNextAlivePlayerIndex(
          resetPlayers,
          current.currentPlayerIndex,
          newDirection
        );
        const nextStarter = resetPlayers[nextStarterIdx];
        const nextRound = current.roundNumber + 1;

        commitGame({
          ...current,
          roundNumber: nextRound,
          players: resetPlayers,
          currentPlayerIndex: nextStarterIdx,
          direction: newDirection,
          riskPercent: 0.5,
          ultimaCartaJugada: null,
          isLocked: true,
          draftCards: [],
          impulsesRemaining: 3,
          impulsesCompleted: 0,
          cardsUsedThisTurn: 0,
          recompensaCartaExtra: false,
          freezeNextImpulse: false,
          shieldActive: false,
          heavyAirActive: false,
          pendingEndEffects: createInitialPendingEffects(),
          isExploding: false,
          logs: [
            makeLog(
              `🔄 ¡Ronda #${nextRound}! Globo en 0.5%. Giro ${
                newDirection === 1 ? 'Horario ↻' : 'Antihorario ↺'
              }. Inicia ${nextStarter.avatar} ${nextStarter.name}.`,
              'round'
            ),
            ...current.logs,
          ].slice(0, 60),
        });
      }, 1350);
    },
    [commitGame, stopHold]
  );

  /**
   * Evalúa un impulso completado (cada 0.8s de presión continua).
   * Retorna true si el jugador debe seguir manteniendo el impulso siguiente.
   */
  const evaluateCompletedImpulse = useCallback(() => {
    const g = gameRef.current;
    if (!g || g.isLocked || g.isExploding || g.impulsesRemaining <= 0) {
      stopHold();
      return false;
    }

    const currentPlayer = g.players[g.currentPlayerIndex];
    const roll = Math.random() * 100;
    const exploded = roll <= g.riskPercent;

    if (exploded) {
      if (g.shieldActive) {
        const shieldLog = makeLog(
          `🛡️ ¡Escudo de Goma! ${currentPlayer.avatar} ${currentPlayer.name} evitó la explosión (${g.riskPercent.toFixed(
            1
          )}%) y cierra su turno.`,
          'success'
        );
        closeTurnSuccess(
          {
            ...g,
            impulsesRemaining: 0,
            shieldActive: false,
          },
          [shieldLog]
        );
        return false;
      }

      triggerExplosion(g);
      return false;
    }

    // Sobrevive al impulso
    let nextRisk = g.riskPercent;
    let nextFreeze = g.freezeNextImpulse;

    if (g.freezeNextImpulse) {
      nextFreeze = false;
    } else {
      nextRisk = calculateNextRisk(g.riskPercent, g.heavyAirActive);
    }

    const nextRemaining = g.impulsesRemaining - 1;
    const nextCompleted = g.impulsesCompleted + 1;

    if (nextRemaining <= 0) {
      const completionLog = makeLog(
        `✅ ${currentPlayer.avatar} ${currentPlayer.name} completó sus impulsos → Riesgo subió a ${nextRisk.toFixed(
          1
        )}%`,
        'success'
      );
      closeTurnSuccess(
        {
          ...g,
          riskPercent: nextRisk,
          freezeNextImpulse: nextFreeze,
          impulsesRemaining: 0,
          impulsesCompleted: nextCompleted,
        },
        [completionLog]
      );
      return false;
    }

    // Aún le quedan impulsos en el turno
    const stepLog = makeLog(
      `🎈 ${currentPlayer.avatar} ${currentPlayer.name} infló (riesgo: ${nextRisk.toFixed(
        1
      )}%, quedan ${nextRemaining})`,
      'info'
    );

    commitGame({
      ...g,
      riskPercent: nextRisk,
      freezeNextImpulse: nextFreeze,
      impulsesRemaining: nextRemaining,
      impulsesCompleted: nextCompleted,
      logs: [stepLog, ...g.logs].slice(0, 60),
    });

    return true;
  }, [closeTurnSuccess, commitGame, stopHold, triggerExplosion]);

  const startHold = useCallback(() => {
    const g = gameRef.current;
    if (
      !g ||
      g.isLocked ||
      g.draftCards.length > 0 ||
      g.isExploding ||
      g.impulsesRemaining <= 0 ||
      pendingTargetSelection
    ) {
      return;
    }
    if (isHoldingRef.current) return;

    isHoldingRef.current = true;
    setIsHolding(true);
    holdStartRef.current = performance.now();
    setHoldProgress(0);
    playInflateSound();

    const tick = (now) => {
      if (!isHoldingRef.current) return;

      const elapsed = now - holdStartRef.current;
      const pct = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      setHoldProgress(pct);

      if (elapsed >= HOLD_DURATION_MS) {
        const shouldContinue = evaluateCompletedImpulse();
        if (shouldContinue && isHoldingRef.current) {
          holdStartRef.current = performance.now();
          setHoldProgress(0);
          playInflateSound();
          rafRef.current = requestAnimationFrame(tick);
        }
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [evaluateCompletedImpulse, pendingTargetSelection]);

  const handleUnlockTurn = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    const currentPlayer = g.players[g.currentPlayerIndex];

    const draftCards = currentPlayer.needsDraft ? generateDraftCards(5) : [];

    commitGame({
      ...g,
      isLocked: false,
      draftCards,
    });
  }, [commitGame]);

  const handleConfirmDraft = useCallback(
    (chosenCards) => {
      const g = gameRef.current;
      if (!g) return;

      const currentPlayer = g.players[g.currentPlayerIndex];
      const updatedPlayers = g.players.map((p, idx) =>
        idx === g.currentPlayerIndex
          ? { ...p, hand: chosenCards, needsDraft: false }
          : p
      );

      commitGame({
        ...g,
        players: updatedPlayers,
        draftCards: [],
        logs: [
          makeLog(
            `🃏 ${currentPlayer.avatar} ${currentPlayer.name} eligió 2 cartas iniciales.`,
            'info'
          ),
          ...g.logs,
        ].slice(0, 60),
      });
    },
    [commitGame]
  );

  const handleToggleGreedyPump = useCallback(() => {
    const g = gameRef.current;
    if (!g || g.isLocked || g.isExploding || g.recompensaCartaExtra) return;
    if (g.impulsesRemaining < 1) return;

    const currentPlayer = g.players[g.currentPlayerIndex];
    if (currentPlayer.hand.length >= 5) return;

    playCardSound();
    commitGame({
      ...g,
      impulsesRemaining: g.impulsesRemaining + 1,
      recompensaCartaExtra: true,
      logs: [
        makeLog(
          `🔥 ${currentPlayer.avatar} ${currentPlayer.name} arriesgó +1 impulso por carta extra.`,
          'card'
        ),
        ...g.logs,
      ].slice(0, 60),
    });
  }, [commitGame]);

  /**
   * Ejecuta el efecto real de una carta (ya sea directa o copiada por Espejo).
   */
  const executeCardEffect = useCallback(
    (handCardInstanceId, effectiveCard, isMirror = false, selectedTarget = null) => {
      const g = gameRef.current;
      if (!g || g.isLocked || g.isExploding) return;

      const currentPlayer = g.players[g.currentPlayerIndex];
      playCardSound();

      // Remover carta jugada de la mano del jugador actual
      let updatedPlayers = g.players.map((p, idx) => {
        if (idx !== g.currentPlayerIndex) return { ...p, hand: [...p.hand] };
        return {
          ...p,
          hand: p.hand.filter((c) => c.instanceId !== handCardInstanceId),
        };
      });

      const nextCardsUsed = g.cardsUsedThisTurn + 1;
      const nextUltima = isMirror
        ? g.ultimaCartaJugada
        : CARDS_CATALOG.find((c) => c.id === effectiveCard.id) || effectiveCard;

      const mirrorPrefix = isMirror ? '🪞 Espejo → ' : '';
      let nextImpulses = g.impulsesRemaining;
      let nextRisk = g.riskPercent;
      let nextFreeze = g.freezeNextImpulse;
      let nextShield = g.shieldActive;
      let nextPending = { ...g.pendingEndEffects };
      let actionLogText = `${currentPlayer.avatar} ${currentPlayer.name} usó [${mirrorPrefix}${effectiveCard.emoji} ${effectiveCard.name}]`;

      switch (effectiveCard.id) {
        case 'c1': {
          // Aguantar el Aire: -1 impulso inmediato
          nextImpulses = Math.max(0, nextImpulses - 1);
          actionLogText += ` (-1 impulso, quedan ${nextImpulses})`;
          break;
        }
        case 'c2': {
          // Pasar Turno: impulsosRestantes = 0 de inmediato
          nextImpulses = 0;
          actionLogText += ' (cierra el turno sin inflar más)';
          break;
        }
        case 'c3': {
          // Hielo Seco: próximo impulso no suma riesgo
          nextFreeze = true;
          actionLogText += ' (próximo impulso no suma riesgo)';
          break;
        }
        case 'c4': {
          // Válvula de Escape: -10% riesgo (mín 0.5%)
          nextRisk = Math.max(0.5, Number((nextRisk - 10).toFixed(1)));
          actionLogText += ` (riesgo bajó a ${nextRisk.toFixed(1)}%)`;
          break;
        }
        case 'c5': {
          // Escudo de Goma: salva si explota este turno
          nextShield = true;
          actionLogText += ' (protección contra explosión activa)';
          break;
        }
        case 'c6': {
          // Soplido Extra: +1 impulso al siguiente jugador
          nextPending.extraBlows += 1;
          actionLogText += ' (+1 impulso al siguiente)';
          break;
        }
        case 'c7': {
          // Doble Turno: 6 impulsos base al siguiente jugador
          nextPending.doubleTurn = true;
          actionLogText += ' (6 impulsos base al siguiente)';
          break;
        }
        case 'c8': {
          // Alfiler: +10% riesgo al cerrar turno
          nextPending.pinCount += 1;
          actionLogText += ' (+10% al terminar el turno)';
          break;
        }
        case 'c9': {
          // Aire Pesado: doble riesgo por impulso al siguiente jugador
          nextPending.heavyAirNext = true;
          actionLogText += ' (riesgo x2 para el siguiente)';
          break;
        }
        case 'c10': {
          // Mano Larga: roba 1 carta al azar del objetivo elegido
          if (selectedTarget) {
            const targetIdx = updatedPlayers.findIndex(
              (p) => p.id === selectedTarget.id
            );
            if (targetIdx !== -1 && updatedPlayers[targetIdx].hand.length > 0) {
              const targetHand = updatedPlayers[targetIdx].hand;
              const randIndex = Math.floor(Math.random() * targetHand.length);
              const [stolenCard] = targetHand.splice(randIndex, 1);
              updatedPlayers[g.currentPlayerIndex].hand.push(stolenCard);
              actionLogText += ` y robó 1 carta a ${selectedTarget.avatar} ${selectedTarget.name}`;
            }
          }
          break;
        }
        case 'c11': {
          // Francotirador: fija objetivo para fin de turno
          if (selectedTarget) {
            nextPending.sniperTargetId = selectedTarget.id;
            actionLogText += ` → objetivo: ${selectedTarget.avatar} ${selectedTarget.name}`;
          }
          break;
        }
        case 'c12': {
          // Reversa: invierte sentido al cerrar turno
          nextPending.reverseCount += 1;
          actionLogText += ' (invertirá el sentido al cerrar)';
          break;
        }
        case 'c13': {
          // Reciclaje Masivo: demás jugadores vivos cambian todas sus cartas
          updatedPlayers = updatedPlayers.map((p, idx) => {
            if (idx === g.currentPlayerIndex || p.lives <= 0) return p;
            const count = p.hand.length;
            return {
              ...p,
              hand: Array.from({ length: count }, () => createRandomCard()),
            };
          });
          actionLogText += ' (los demás renovaron sus cartas)';
          break;
        }
        default:
          break;
      }

      const cardLog = makeLog(actionLogText, 'card');

      const nextState = {
        ...g,
        players: updatedPlayers,
        ultimaCartaJugada: nextUltima,
        cardsUsedThisTurn: nextCardsUsed,
        impulsesRemaining: nextImpulses,
        riskPercent: nextRisk,
        freezeNextImpulse: nextFreeze,
        shieldActive: nextShield,
        pendingEndEffects: nextPending,
      };

      // Si una carta verde (c1 / c2) llevó impulsosRemaining a 0, cierre automático inmediato
      if (nextImpulses <= 0) {
        closeTurnSuccess(nextState, [cardLog]);
        return;
      }

      commitGame({
        ...nextState,
        logs: [cardLog, ...g.logs].slice(0, 60),
      });
    },
    [closeTurnSuccess, commitGame]
  );

  const handlePlayCard = useCallback(
    (card) => {
      const g = gameRef.current;
      if (!g || g.isLocked || g.isExploding || isHoldingRef.current) return;
      if (g.cardsUsedThisTurn >= 2 || g.impulsesRemaining <= 0) return;

      const isMirror = card.id === 'c14';
      if (isMirror && !g.ultimaCartaJugada) return;

      const effectiveCard = isMirror ? g.ultimaCartaJugada : card;

      if (effectiveCard.requiresTarget) {
        setPendingTargetSelection({
          handCardInstanceId: card.instanceId,
          isMirror,
          effectiveCard,
        });
        return;
      }

      executeCardEffect(card.instanceId, effectiveCard, isMirror, null);
    },
    [executeCardEffect]
  );

  const handleSelectTarget = useCallback(
    (targetPlayer) => {
      if (!pendingTargetSelection) return;
      const { handCardInstanceId, effectiveCard, isMirror } =
        pendingTargetSelection;
      setPendingTargetSelection(null);
      executeCardEffect(handCardInstanceId, effectiveCard, isMirror, targetPlayer);
    },
    [executeCardEffect, pendingTargetSelection]
  );

  if (phase === 'setup') {
    return (
      <SetupScreen
        initialPlayers={savedRoster}
        onStartGame={handleStartGame}
      />
    );
  }

  if (phase === 'victory' && game?.winner) {
    return (
      <VictoryScreen
        winner={game.winner}
        roundNumber={game.roundNumber}
        onPlayAgain={() => handleStartGame(savedRoster)}
        onBackToSetup={() => {
          setGame(null);
          gameRef.current = null;
          setPhase('setup');
        }}
      />
    );
  }

  if (!game) return null;

  const currentPlayer = game.players[game.currentPlayerIndex];
  const isDrafting = !game.isLocked && game.draftCards.length > 0;
  const isPrivateHidden = game.isLocked || isDrafting;

  const otherAlivePlayers = game.players.filter(
    (p, idx) => idx !== game.currentPlayerIndex && p.lives > 0
  );
  const otherAliveWithCards = otherAlivePlayers.filter(
    (p) => p.hand.length > 0
  );

  const targetCandidates = pendingTargetSelection
    ? pendingTargetSelection.effectiveCard.requiresTarget === 'steal'
      ? otherAliveWithCards
      : otherAlivePlayers
    : [];

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col justify-between bg-slate-950 text-slate-100">
      {/* 1. Header / Barra de Jugadores (Pública) */}
      <HeaderPlayers
        players={game.players}
        currentPlayerIndex={game.currentPlayerIndex}
        direction={game.direction}
        roundNumber={game.roundNumber}
      />

      {/* 2 & 3. Zona Central Interactiva (Globo) + Panel Lateral de Historial */}
      <main className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        <BalloonArena
          riskPercent={game.riskPercent}
          impulsesRemaining={game.impulsesRemaining}
          impulsesCompleted={game.impulsesCompleted}
          holdProgress={holdProgress}
          isHolding={isHolding}
          isExploding={game.isExploding}
          disabled={isPrivateHidden || Boolean(pendingTargetSelection)}
          pendingEndEffects={game.pendingEndEffects}
          freezeNextImpulse={game.freezeNextImpulse}
          shieldActive={game.shieldActive}
          heavyAirActive={game.heavyAirActive}
          players={game.players}
          ultimaCartaJugada={game.ultimaCartaJugada}
          onStartHold={startHold}
          onEndHold={stopHold}
        />

        <HistorySidebar logs={game.logs} />
      </main>

      {/* 4. Footer / Zona Privada del Jugador */}
      <PlayerHandFooter
        player={currentPlayer}
        isPrivateHidden={isPrivateHidden}
        cardsUsedThisTurn={game.cardsUsedThisTurn}
        impulsesRemaining={game.impulsesRemaining}
        greedyPumpActive={game.recompensaCartaExtra}
        ultimaCartaJugada={game.ultimaCartaJugada}
        otherAlivePlayersWithCardsCount={otherAliveWithCards.length}
        otherAlivePlayersCount={otherAlivePlayers.length}
        isHolding={isHolding}
        isExploding={game.isExploding}
        onToggleGreedyPump={handleToggleGreedyPump}
        onPlayCard={handlePlayCard}
      />

      {/* Modales de Privacidad, Draft y Selección de Objetivo */}
      {game.isLocked && !game.isExploding && (
        <PinLockModal
          player={currentPlayer}
          roundNumber={game.roundNumber}
          onUnlock={handleUnlockTurn}
        />
      )}

      {isDrafting && (
        <DraftModal
          player={currentPlayer}
          draftCards={game.draftCards}
          onConfirmDraft={handleConfirmDraft}
        />
      )}

      {pendingTargetSelection && (
        <TargetSelectorModal
          pendingCard={pendingTargetSelection.effectiveCard}
          candidates={targetCandidates}
          onSelectTarget={handleSelectTarget}
          onCancel={() => setPendingTargetSelection(null)}
        />
      )}
    </div>
  );
}
