/**
 * Datos estáticos del juego: Avatares y Catálogo de Cartas (14 cartas en 3 categorías).
 */

export const AVATARS = [
  '🤠', '👽', '🧙‍♂️', '🥷',
  '🤡', '🤖', '🦊', '👻',
  '🕵️‍♂️', '🧛‍♂️', '🧟‍♂️', '👩‍🚀',
];

export const CATEGORY_STYLES = {
  green: 'bg-emerald-100 border-emerald-500 text-emerald-900',
  red: 'bg-rose-100 border-rose-500 text-rose-900',
  yellow: 'bg-amber-100 border-amber-500 text-amber-900',
};

export const CARDS_CATALOG = [
  // 🟢 Cartas Verdes (Defensa y Beneficio Propio)
  {
    id: 'c1',
    name: 'Aguantar el Aire',
    emoji: '😮‍💨',
    category: 'green',
    tailwindClasses: CATEGORY_STYLES.green,
    timing: 'immediate',
    requiresTarget: false,
    description: 'Resta -1 impulso restante de inmediato.',
  },
  {
    id: 'c2',
    name: 'Pasar Turno',
    emoji: '⏭️',
    category: 'green',
    tailwindClasses: CATEGORY_STYLES.green,
    timing: 'immediate',
    requiresTarget: false,
    description: 'Fija impulsos a 0 y cierra el turno sin inflar.',
  },
  {
    id: 'c3',
    name: 'Hielo Seco',
    emoji: '🧊',
    category: 'green',
    tailwindClasses: CATEGORY_STYLES.green,
    timing: 'turn_buff',
    requiresTarget: false,
    description: 'El próximo impulso evalúa explosión pero no suma riesgo.',
  },
  {
    id: 'c4',
    name: 'Válvula de Escape',
    emoji: '💨',
    category: 'green',
    tailwindClasses: CATEGORY_STYLES.green,
    timing: 'immediate',
    requiresTarget: false,
    description: 'Reduce -10% al riesgo actual del globo (mín. 0.5%).',
  },
  {
    id: 'c5',
    name: 'Escudo de Goma',
    emoji: '🛡️',
    category: 'green',
    tailwindClasses: CATEGORY_STYLES.green,
    timing: 'turn_buff',
    requiresTarget: false,
    description: 'Si explota este turno, salva tu vida y pasa el turno.',
  },

  // 🔴 Cartas Rojas (Ataque y Perjuicio a Otros)
  {
    id: 'c6',
    name: 'Soplido Extra',
    emoji: '🌬️',
    category: 'red',
    tailwindClasses: CATEGORY_STYLES.red,
    timing: 'end_of_turn',
    requiresTarget: false,
    description: 'El siguiente jugador recibe +1 impulso obligatorio.',
  },
  {
    id: 'c7',
    name: 'Doble Turno',
    emoji: '😈',
    category: 'red',
    tailwindClasses: CATEGORY_STYLES.red,
    timing: 'end_of_turn',
    requiresTarget: false,
    description: 'Los impulsos base del siguiente jugador serán 6.',
  },
  {
    id: 'c8',
    name: 'Alfiler',
    emoji: '📌',
    category: 'red',
    tailwindClasses: CATEGORY_STYLES.red,
    timing: 'end_of_turn',
    requiresTarget: false,
    description: 'Al cerrar tu turno, el riesgo sube +10% al siguiente.',
  },
  {
    id: 'c9',
    name: 'Aire Pesado',
    emoji: '⚠️',
    category: 'red',
    tailwindClasses: CATEGORY_STYLES.red,
    timing: 'end_of_turn',
    requiresTarget: false,
    description: 'El siguiente jugador suma el doble de riesgo por impulso.',
  },
  {
    id: 'c10',
    name: 'Mano Larga',
    emoji: '🕵️',
    category: 'red',
    tailwindClasses: CATEGORY_STYLES.red,
    timing: 'immediate',
    requiresTarget: 'steal',
    description: 'Roba 1 carta al azar a otro jugador vivo.',
  },
  {
    id: 'c11',
    name: 'Francotirador',
    emoji: '🎯',
    category: 'red',
    tailwindClasses: CATEGORY_STYLES.red,
    timing: 'end_of_turn',
    requiresTarget: 'sniper',
    description: 'Al terminar tu turno, salta directo al jugador elegido.',
  },

  // 🟡 Cartas Amarillas (Alteración de Lógica y Mesa)
  {
    id: 'c12',
    name: 'Reversa',
    emoji: '🔄',
    category: 'yellow',
    tailwindClasses: CATEGORY_STYLES.yellow,
    timing: 'end_of_turn',
    requiresTarget: false,
    description: 'Al cerrar tu turno, invierte el sentido de giro.',
  },
  {
    id: 'c13',
    name: 'Reciclaje Masivo',
    emoji: '♻️',
    category: 'yellow',
    tailwindClasses: CATEGORY_STYLES.yellow,
    timing: 'immediate',
    requiresTarget: false,
    description: 'Los demás cambian todas sus cartas por nuevas al azar.',
  },
  {
    id: 'c14',
    name: 'Espejo',
    emoji: '🪞',
    category: 'yellow',
    tailwindClasses: CATEGORY_STYLES.yellow,
    timing: 'mirror',
    requiresTarget: false,
    description: 'Copia el efecto de la última carta jugada en la ronda.',
  },
];

let cardInstanceCounter = 0;

/**
 * Crea una instancia única de carta aleatoria (o de una carta específica por ID).
 */
export function createRandomCard(specificId = null) {
  const template = specificId
    ? CARDS_CATALOG.find((c) => c.id === specificId)
    : CARDS_CATALOG[Math.floor(Math.random() * CARDS_CATALOG.length)];

  cardInstanceCounter += 1;
  return {
    ...template,
    instanceId: `${template.id}_${Date.now()}_${cardInstanceCounter}_${Math.random().toString(36).slice(2, 6)}`,
  };
}

/**
 * Genera `count` cartas aleatorias para la fase de Draft (5 cartas por defecto).
 */
export function generateDraftCards(count = 5) {
  return Array.from({ length: count }, () => createRandomCard());
}
