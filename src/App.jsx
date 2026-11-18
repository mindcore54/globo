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
  playDefeatSound,
  playShieldDefendSound,
  playTrapAlertSound,
} from './utils/soundEffects';
import SetupScreen from './components/SetupScreen';
import PinLockModal from './components/PinLockModal';
import DraftModal from './components/DraftModal';
import TargetSelectorModal from './components/TargetSelectorModal';
import HeaderPlayers from './components/HeaderPlayers';
import BalloonArena from './components/BalloonArena';
import HistorySidebar from './components/HistorySidebar';
import PlayerHandFooter from './components/PlayerHandFooter';
import DefeatModal from './components/DefeatModal';
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
    increment = 1.0;
  } else if (currentRisk <= 40) {
    increment = 2.0;
  } else {
    increment = 3.5;
  }

  if (heavyAirActive) {
    increment *= 2;
  }

  return Math.min(99.0, Number((currentRisk + increment).toFixed(1)));
}

/**
 * Devuelve true solo si el jugador está en el último lugar en vidas (y no hay empate total).
 */
function isPlayerInLastPlace(players, player) {
  if (!player || player.lives <= 0) return false;
  const aliveLives = players.filter((p) => p.lives > 0).map((p) => p.lives);
  if (aliveLives.length === 0) return false;
  const maxLives = Math.max(...aliveLives);
  const minLives = Math.min(...aliveLives);
  return minLives < maxLives && player.lives === minLives;
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
  const shieldTimerRef = useRef(null);
  const trapTimerRef = useRef(null);

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
      if (shieldTimerRef.current) {
        clearTimeout(shieldTimerRef.current);
      }
      if (trapTimerRef.current) {
        clearTimeout(trapTimerRef.current);
      }
    };
  }, [stopHold]);

  /**
   * Inicia una partida nueva con los jugadores configurados en SetupScreen.
   */
  const handleStartGame = useCallback(
    (rawPlayers) => {
      if (trapTimerRef.current) {
        clearTimeout(trapTimerRef.current);
        trapTimerRef.current = null;
      }
      stopHold();
      setPendingTargetSelection(null);
      setSavedRoster(rawPlayers);

      const initialLives = 3;
      const shuffled = shuffleArray(rawPlayers).map((p) => ({
        ...p,
        lives: initialLives,
        hand: [],
        previousHand: [],
        needsDraft: true,
        silencedBy: null,
        desquicioBy: null,
        sabotagedBy: null,
        cursedRiskBy: null,
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
        freezeNextImpulse: false,
        shieldActive: false,
        heavyAirActive: false,
        silencedThisTurn: false,
        pendingEndEffects: createInitialPendingEffects(),
        isExploding: false,
        isShieldSaving: false,
        defeatedInfo: null,
        pendingTrapNotice: null,
        activeTrapNotice: null,
        winner: null,
        logs: [
          makeLog(
            `🎈 ¡Inicia Ronda #1! Comienza ${starter.avatar} ${starter.name}.`,
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
    (g, extraLogs = [], skipSound = false) => {
      stopHold();
      if (!skipSound) {
        playSuccessSound();
      }

      const currentPlayer = g.players[g.currentPlayerIndex];
      const newLogs = [...extraLogs];

      let updatedPlayers = g.players.map((p) => ({ ...p, hand: [...p.hand] }));
      let nextRisk = g.riskPercent;
      let nextDirection = g.direction;

      // 1. Ejecutar efectosPendientesFinDeTurno
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

      // 4. Preparar impulsos, riesgo, trampas entrantes, silencio y cartas moradas del siguiente jugador
      const baseImpulses = pending.doubleTurn ? 6 : 3;
      const nextPlayer = updatedPlayers[nextPlayerIndex];
      const silencer = nextPlayer.silencedBy;
      const desquicioEffect = nextPlayer.desquicioBy;
      const cursedRiskEffect = nextPlayer.cursedRiskBy;
      const sabotagedEffect = nextPlayer.sabotagedBy;
      const nextSilencedThisTurn = Boolean(silencer);

      const extraDesquicio = desquicioEffect ? desquicioEffect.extraImpulses : 0;
      const nextImpulses = baseImpulses + (pending.extraBlows || 0) + extraDesquicio;

      if (cursedRiskEffect) {
        nextRisk = Math.min(
          99.0,
          Number((nextRisk + cursedRiskEffect.extraRisk).toFixed(1))
        );
        newLogs.unshift(
          makeLog(
            `💣 ¡Bomba de Tiempo sobre ${nextPlayer.avatar} ${nextPlayer.name}! El riesgo subió +${cursedRiskEffect.extraRisk}% → ahora en ${nextRisk.toFixed(1)}%.`,
            'danger'
          )
        );
      }

      if (silencer || desquicioEffect || cursedRiskEffect || sabotagedEffect) {
        updatedPlayers[nextPlayerIndex] = {
          ...nextPlayer,
          silencedBy: null,
          desquicioBy: null,
          cursedRiskBy: null,
          sabotagedBy: null,
        };
      }

      const nextIncomingTraps = [];
      if (pending.doubleTurn) {
        nextIncomingTraps.push({
          id: 'c7',
          emoji: '😈',
          name: 'Doble Turno',
          detail: 'Tus impulsos base subieron a 6',
        });
      }
      if (pending.extraBlows > 0) {
        nextIncomingTraps.push({
          id: 'c6',
          emoji: '🌬️',
          name: 'Soplido Extra',
          detail: `+${pending.extraBlows} impulso(s) adicional(es)`,
        });
      }
      if (pending.pinCount > 0) {
        nextIncomingTraps.push({
          id: 'c8',
          emoji: '📌',
          name: 'Alfiler',
          detail: `Subió +${pending.pinCount * 10}% el riesgo del globo`,
        });
      }
      if (pending.heavyAirNext) {
        nextIncomingTraps.push({
          id: 'c9',
          emoji: '⚠️',
          name: 'Aire Pesado',
          detail: 'Cada impulso sube el doble de riesgo',
        });
      }
      if (pending.sniperTargetId && nextPlayer.id === pending.sniperTargetId) {
        nextIncomingTraps.push({
          id: 'c11',
          emoji: '🎯',
          name: 'Francotirador',
          detail: 'Te apuntó directo para saltar a tu turno',
        });
      }
      if (pending.reverseCount % 2 === 1) {
        nextIncomingTraps.push({
          id: 'c12',
          emoji: '🔄',
          name: 'Reversa',
          detail: 'Invirtió el giro hacia tu turno',
        });
      }

      const hasTurnTrapsFromCurrent = nextIncomingTraps.length > 0;
      if (silencer) {
        nextIncomingTraps.push({
          id: 'c15',
          emoji: '🤐',
          name: 'Silencio',
          detail: `${silencer.avatar} ${silencer.name} silenció tus cartas este turno`,
        });
      }
      if (desquicioEffect) {
        nextIncomingTraps.push({
          id: 'c16',
          emoji: '🤯',
          name: 'Desquicio',
          detail: `${desquicioEffect.avatar} ${desquicioEffect.name} te dio +${desquicioEffect.extraImpulses} impulsos por ir ganando`,
        });
      }
      if (cursedRiskEffect) {
        nextIncomingTraps.push({
          id: 'c18',
          emoji: '💣',
          name: 'Bomba de Tiempo',
          detail: `${cursedRiskEffect.avatar} ${cursedRiskEffect.name} subió +${cursedRiskEffect.extraRisk}% el riesgo por ir ganando`,
        });
      }
      if (sabotagedEffect) {
        nextIncomingTraps.push({
          id: 'c17',
          emoji: '🧨',
          name: 'Sabotaje',
          detail: `${sabotagedEffect.avatar} ${sabotagedEffect.name} cambió todas tus cartas por ir ganando`,
        });
      }

      const noticeAuthor = hasTurnTrapsFromCurrent
        ? { name: currentPlayer.name, avatar: currentPlayer.avatar }
        : silencer || desquicioEffect || cursedRiskEffect || sabotagedEffect;

      const pendingTrapNotice =
        nextIncomingTraps.length > 0 && noticeAuthor
          ? {
              fromPlayer: noticeAuthor,
              traps: nextIncomingTraps,
            }
          : null;

      newLogs.unshift(
        makeLog(
          `⏭️ Turno pasa a ${nextPlayer.avatar} ${nextPlayer.name} (${nextImpulses} impulsos${
            nextSilencedThisTurn ? ', 🤐 silenciado' : ''
          }).`,
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
        freezeNextImpulse: false,
        shieldActive: false,
        heavyAirActive: Boolean(pending.heavyAirNext),
        silencedThisTurn: nextSilencedThisTurn,
        pendingEndEffects: createInitialPendingEffects(),
        pendingTrapNotice,
        activeTrapNotice: null,
        logs: [...newLogs, ...g.logs].slice(0, 60),
      };

      commitGame(nextState);
    },
    [commitGame, stopHold]
  );

  /**
   * Inicia una nueva ronda tras una explosión (conservando cartas previas para el Draft).
   */
  const advanceToNewRound = useCallback(
    (current) => {
      const newDirection = Math.random() < 0.5 ? 1 : -1;
      const resetPlayers = current.players.map((p) => {
        const canKeepPurple = isPlayerInLastPlace(current.players, p);
        const keptPrev =
          p.lives > 0
            ? p.hand.filter((c) => canKeepPurple || c.category !== 'purple')
            : [];
        return {
          ...p,
          previousHand: keptPrev,
          hand: [],
          needsDraft: p.lives > 0,
          silencedBy: null,
          desquicioBy: null,
          sabotagedBy: null,
          cursedRiskBy: null,
        };
      });

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
        freezeNextImpulse: false,
        shieldActive: false,
        heavyAirActive: false,
        silencedThisTurn: false,
        pendingEndEffects: createInitialPendingEffects(),
        isExploding: false,
        isShieldSaving: false,
        defeatedInfo: null,
        pendingTrapNotice: null,
        activeTrapNotice: null,
        logs: [
          makeLog(
            `🔄 ¡Ronda #${nextRound}! Globo en 0.5%. Inicia ${nextStarter.avatar} ${nextStarter.name}.`,
            'round'
          ),
          ...current.logs,
        ].slice(0, 60),
      });
    },
    [commitGame]
  );

  /**
   * Continúa después de cerrar la pantalla de Derrota de un jugador eliminado.
   */
  const handleContinueAfterDefeat = useCallback(() => {
    const current = gameRef.current;
    if (!current) return;

    const alivePlayers = current.players.filter((p) => p.lives > 0);
    if (alivePlayers.length <= 1) {
      const winner = alivePlayers[0] || current.defeatedInfo?.player;
      commitGame({
        ...current,
        isExploding: false,
        isShieldSaving: false,
        defeatedInfo: null,
        pendingTrapNotice: null,
        activeTrapNotice: null,
        winner,
      });
      setPhase('victory');
      return;
    }

    advanceToNewRound(current);
  }, [advanceToNewRound, commitGame]);

  /**
   * Maneja la explosión real del globo y reinicio de ronda, derrota o victoria.
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
        players: updatedPlayers.map((p) => ({
          ...p,
          silencedBy: null,
          desquicioBy: null,
          sabotagedBy: null,
          cursedRiskBy: null,
        })),
        isExploding: true,
        freezeNextImpulse: false,
        shieldActive: false,
        heavyAirActive: false,
        silencedThisTurn: false,
        pendingEndEffects: createInitialPendingEffects(),
        pendingTrapNotice: null,
        activeTrapNotice: null,
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
        const eliminatedNow =
          current.players[current.currentPlayerIndex]?.lives === 0;

        if (eliminatedNow) {
          playDefeatSound();
          commitGame({
            ...current,
            isExploding: false,
            defeatedInfo: {
              player: current.players[current.currentPlayerIndex],
              explodedRisk: g.riskPercent,
              aliveCount: alivePlayers.length,
            },
          });
          return;
        }

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

        advanceToNewRound(current);
      }, 1350);
    },
    [advanceToNewRound, commitGame, stopHold]
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
        stopHold();
        playShieldDefendSound();

        const shieldLog = makeLog(
          `🛡️ ¡Escudo de Goma bloqueó la explosión en ${g.riskPercent.toFixed(
            1
          )}%! ${currentPlayer.avatar} ${currentPlayer.name} conserva su vida y pasa el turno.`,
          'success'
        );

        commitGame({
          ...g,
          isShieldSaving: true,
          impulsesRemaining: 0,
          shieldActive: false,
          logs: [shieldLog, ...g.logs].slice(0, 60),
        });

        if (shieldTimerRef.current) {
          clearTimeout(shieldTimerRef.current);
        }

        shieldTimerRef.current = setTimeout(() => {
          const current = gameRef.current;
          if (!current) return;
          closeTurnSuccess(
            {
              ...current,
              isShieldSaving: false,
              impulsesRemaining: 0,
              shieldActive: false,
            },
            [],
            true
          );
        }, 1150);

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
      g.isShieldSaving ||
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

  const dismissTrapNotice = useCallback(() => {
    if (trapTimerRef.current) {
      clearTimeout(trapTimerRef.current);
      trapTimerRef.current = null;
    }
    const g = gameRef.current;
    if (!g || !g.activeTrapNotice) return;
    commitGame({
      ...g,
      activeTrapNotice: null,
    });
  }, [commitGame]);

  const handleUnlockTurn = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    const currentPlayer = g.players[g.currentPlayerIndex];

    const excludeIds = (currentPlayer.previousHand || []).map((c) => c.id);
    const allowPurple = isPlayerInLastPlace(g.players, currentPlayer);
    const draftCards = currentPlayer.needsDraft
      ? generateDraftCards(5, excludeIds, allowPurple)
      : [];

    const trapToShow = g.pendingTrapNotice;

    if (trapTimerRef.current) {
      clearTimeout(trapTimerRef.current);
      trapTimerRef.current = null;
    }

    if (trapToShow) {
      playTrapAlertSound();
      trapTimerRef.current = setTimeout(() => {
        const current = gameRef.current;
        if (!current || !current.activeTrapNotice) return;
        commitGame({
          ...current,
          activeTrapNotice: null,
        });
      }, 2600);
    }

    commitGame({
      ...g,
      isLocked: false,
      draftCards,
      pendingTrapNotice: null,
      activeTrapNotice: trapToShow || null,
    });
  }, [commitGame]);

  const handleConfirmDraft = useCallback(
    (chosenCards, keptCount = 0) => {
      const g = gameRef.current;
      if (!g) return;

      const currentPlayer = g.players[g.currentPlayerIndex];
      const updatedPlayers = g.players.map((p, idx) =>
        idx === g.currentPlayerIndex
          ? { ...p, hand: chosenCards, previousHand: [], needsDraft: false }
          : p
      );

      const logMsg =
        keptCount > 0
          ? `🃏 ${currentPlayer.avatar} ${currentPlayer.name} conservó ${keptCount} carta(s) y completó su mano inicial (3 cartas).`
          : `🃏 ${currentPlayer.avatar} ${currentPlayer.name} eligió 3 cartas iniciales.`;

      commitGame({
        ...g,
        players: updatedPlayers,
        draftCards: [],
        logs: [makeLog(logMsg, 'info'), ...g.logs].slice(0, 60),
      });
    },
    [commitGame]
  );

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
          // Mano Larga: elige un jugador vivo con cartas al azar y le roba 1 carta al azar
          const eligibleIndices = updatedPlayers
            .map((p, idx) => ({ p, idx }))
            .filter(
              ({ p, idx }) =>
                idx !== g.currentPlayerIndex && p.lives > 0 && p.hand.length > 0
            );
          if (eligibleIndices.length > 0) {
            const { p: randomTarget, idx: targetIdx } =
              eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)];
            const targetHand = updatedPlayers[targetIdx].hand;
            const randCardIdx = Math.floor(Math.random() * targetHand.length);
            const [stolenCard] = targetHand.splice(randCardIdx, 1);
            updatedPlayers[g.currentPlayerIndex].hand.push(stolenCard);
            actionLogText += ` y robó 1 carta al azar a ${randomTarget.avatar} ${randomTarget.name}`;
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
        case 'c15': {
          // Silencio: silencia todas las cartas del jugador elegido en su próximo turno
          if (selectedTarget) {
            updatedPlayers = updatedPlayers.map((p) =>
              p.id === selectedTarget.id
                ? {
                    ...p,
                    silencedBy: {
                      name: currentPlayer.name,
                      avatar: currentPlayer.avatar,
                    },
                  }
                : p
            );
            actionLogText += ` y silenció las cartas de ${selectedTarget.avatar} ${selectedTarget.name} para su próximo turno`;
          }
          break;
        }
        case 'c16': {
          // Desquicio (Venganza): +3 impulsos al líder elegido cuando le toque su próximo turno
          if (selectedTarget) {
            updatedPlayers = updatedPlayers.map((p) =>
              p.id === selectedTarget.id
                ? {
                    ...p,
                    desquicioBy: {
                      name: currentPlayer.name,
                      avatar: currentPlayer.avatar,
                      extraImpulses: (p.desquicioBy?.extraImpulses || 0) + 3,
                    },
                  }
                : p
            );
            actionLogText += ` y lanzó +3 impulsos sobre ${selectedTarget.avatar} ${selectedTarget.name}`;
          }
          break;
        }
        case 'c17': {
          // Sabotaje (Venganza): cambia todas las cartas del líder elegido por nuevas al azar
          if (selectedTarget) {
            updatedPlayers = updatedPlayers.map((p) => {
              if (p.id !== selectedTarget.id) return p;
              const count = p.hand.length;
              return {
                ...p,
                hand: Array.from({ length: count }, () =>
                  createRandomCard(null, false)
                ),
                sabotagedBy: {
                  name: currentPlayer.name,
                  avatar: currentPlayer.avatar,
                },
              };
            });
            actionLogText += ` y saboteó todas las cartas de ${selectedTarget.avatar} ${selectedTarget.name}`;
          }
          break;
        }
        case 'c18': {
          // Bomba de Tiempo (Venganza): +15% riesgo al líder elegido cuando le toque su próximo turno
          if (selectedTarget) {
            updatedPlayers = updatedPlayers.map((p) =>
              p.id === selectedTarget.id
                ? {
                    ...p,
                    cursedRiskBy: {
                      name: currentPlayer.name,
                      avatar: currentPlayer.avatar,
                      extraRisk: (p.cursedRiskBy?.extraRisk || 0) + 15,
                    },
                  }
                : p
            );
            actionLogText += ` y plantó +15% de riesgo a ${selectedTarget.avatar} ${selectedTarget.name}`;
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
      if (g.silencedThisTurn || g.impulsesRemaining <= 0) return;

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

  const maxOpponentLives = Math.max(
    0,
    ...otherAlivePlayers.map((p) => p.lives)
  );
  const leaderOpponents = otherAlivePlayers.filter(
    (p) => p.lives === maxOpponentLives
  );
  const leaderOpponentsWithCards = leaderOpponents.filter(
    (p) => p.hand.length > 0
  );

  const targetCandidates = pendingTargetSelection
    ? pendingTargetSelection.effectiveCard.requiresTarget === 'steal'
      ? otherAliveWithCards
      : pendingTargetSelection.effectiveCard.requiresTarget === 'leader' ||
        pendingTargetSelection.effectiveCard.requiresTarget === 'leader_risk'
      ? leaderOpponents
      : pendingTargetSelection.effectiveCard.requiresTarget === 'leader_cards'
      ? leaderOpponentsWithCards
      : otherAlivePlayers
    : [];

  const pastelColors = [
    'bg-cyan-400',
    'bg-teal-300',
    'bg-pink-300',
    'bg-violet-300',
    'bg-orange-300',
    'bg-slate-400',
  ];
  const currentBgColor = pastelColors[(game.roundNumber - 1) % pastelColors.length];

  return (
    <div
      className={`h-screen w-screen overflow-hidden flex flex-col justify-between font-sans text-slate-900 selection:bg-white/40 transition-colors duration-1000 ease-in-out ${currentBgColor} bg-moving-stripes`}
    >
      {/* 1. Header / Barra de Jugadores (Pública) */}
      <HeaderPlayers
        players={game.players}
        currentPlayerIndex={game.currentPlayerIndex}
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
          isShieldSaving={game.isShieldSaving}
          disabled={
            isPrivateHidden ||
            Boolean(pendingTargetSelection) ||
            Boolean(game.defeatedInfo) ||
            Boolean(game.activeTrapNotice) ||
            game.isShieldSaving
          }
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
        silencedThisTurn={game.silencedThisTurn}
        impulsesRemaining={game.impulsesRemaining}
        ultimaCartaJugada={game.ultimaCartaJugada}
        otherAlivePlayersWithCardsCount={otherAliveWithCards.length}
        otherAlivePlayersCount={otherAlivePlayers.length}
        leaderOpponentsCount={leaderOpponents.length}
        leaderOpponentsWithCardsCount={leaderOpponentsWithCards.length}
        isHolding={isHolding}
        isExploding={game.isExploding || game.isShieldSaving}
        onPlayCard={handlePlayCard}
      />

      {/* Modales de Derrota, Privacidad, Draft y Selección de Objetivo */}
      {game.defeatedInfo && (
        <DefeatModal
          defeatedPlayer={game.defeatedInfo.player}
          roundNumber={game.roundNumber}
          explodedRisk={game.defeatedInfo.explodedRisk}
          aliveCount={game.defeatedInfo.aliveCount}
          onContinue={handleContinueAfterDefeat}
        />
      )}

      {game.isLocked &&
        !game.isExploding &&
        !game.isShieldSaving &&
        !game.defeatedInfo && (
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
          previousHand={currentPlayer.previousHand}
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

      {/* Aviso temporal de trampa recibida del jugador anterior al desbloquear PIN */}
      {game.activeTrapNotice && (
        <div
          onClick={dismissTrapNotice}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="w-full max-w-md bg-white border-4 border-rose-500 rounded-[2rem] p-6 shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="text-xs font-black uppercase tracking-widest bg-rose-100 text-rose-700 border-2 border-rose-300 px-3.5 py-1 rounded-full animate-pulse">
              ⚠️ ¡Alerta de Trampa!
            </div>

            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl">{game.activeTrapNotice.fromPlayer.avatar}</span>
              <div className="text-left">
                <h3 className="text-lg md:text-xl font-black text-rose-600 uppercase leading-tight">
                  ¡{game.activeTrapNotice.fromPlayer.name} te jugó una carta!
                </h3>
                <p className="text-xs font-bold text-slate-500">
                  Efectos activos para este turno:
                </p>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2">
              {game.activeTrapNotice.traps.map((trap) => (
                <div
                  key={trap.id}
                  className="flex items-center gap-3 bg-rose-50 border-2 border-rose-300 rounded-2xl px-3.5 py-2.5 text-left"
                >
                  <span className="text-3xl leading-none">{trap.emoji}</span>
                  <div>
                    <div className="font-black text-sm text-rose-900 uppercase">
                      {trap.name}
                    </div>
                    <div className="text-xs font-semibold text-rose-800/80">
                      {trap.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Toca para cerrar o espera un instante...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
