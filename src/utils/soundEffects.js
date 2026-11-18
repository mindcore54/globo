/**
 * Módulo de audio sintetizado 100% en el navegador usando Web Audio API.
 * No requiere archivos externos (.mp3 o .wav).
 */

let audioCtx = null;
let activeInflateNodes = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function createNoiseBuffer(ctx, durationSeconds) {
  const sampleRate = ctx.sampleRate;
  const frameCount = Math.floor(sampleRate * durationSeconds);
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Detiene el sonido de inflado activo con un fade-out rápido para evitar clicks.
 */
export function stopInflateSound() {
  if (!activeInflateNodes) return;
  const ctx = getAudioContext();
  const { osc, noise, masterGain } = activeInflateNodes;
  activeInflateNodes = null;

  try {
    if (ctx) {
      const now = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
      osc.stop(now + 0.04);
      noise.stop(now + 0.04);
    } else {
      osc.stop();
      noise.stop();
    }
  } catch {
    // Ignorar si ya fue detenido
  }
}

/**
 * Tono ascendente suave + aire filtrado mientras se mantiene presionado el globo (0.8s por impulso).
 */
export function playInflateSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  stopInflateSound();

  const now = ctx.currentTime;
  const duration = 0.85;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.001, now);
  masterGain.gain.linearRampToValueAtTime(0.22, now + 0.06);
  masterGain.connect(ctx.destination);

  // Oscilador ascendente suave (tensión del globo)
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(160, now);
  osc.frequency.exponentialRampToValueAtTime(410, now + duration);
  oscGain.gain.setValueAtTime(0.35, now);
  osc.connect(oscGain);
  oscGain.connect(masterGain);

  // Buffer de ruido blanco filtrado (flujo de aire)
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, duration + 0.1);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(600, now);
  filter.frequency.exponentialRampToValueAtTime(2200, now + duration);
  filter.Q.setValueAtTime(2.5, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.45, now);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(masterGain);

  osc.start(now);
  noise.start(now);

  osc.stop(now + duration);
  noise.stop(now + duration);

  activeInflateNodes = { osc, noise, masterGain };

  osc.onended = () => {
    if (activeInflateNodes && activeInflateNodes.osc === osc) {
      activeInflateNodes = null;
    }
  };
}

/**
 * Acorde corto alegre cuando el jugador completa su último impulso y sobrevive a su turno.
 */
export function playSuccessSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  stopInflateSound();

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  notes.forEach((freq, idx) => {
    const startTime = now + idx * 0.055;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.34);
  });
}

/**
 * Estallido fuerte (ruido blanco + caída de frecuencia grave) cuando el globo explota.
 */
export function playExplosionSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  stopInflateSound();

  const now = ctx.currentTime;

  // 1. Estallido de ruido blanco
  const noiseDuration = 0.65;
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, noiseDuration);

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(3600, now);
  lowpass.frequency.exponentialRampToValueAtTime(180, now + noiseDuration);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.9, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDuration);

  noise.connect(lowpass);
  lowpass.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + noiseDuration);

  // 2. Golpe grave descendente (boom)
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sawtooth';
  subOsc.frequency.setValueAtTime(160, now);
  subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.45);

  subGain.gain.setValueAtTime(0.75, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

  subOsc.connect(subGain);
  subGain.connect(ctx.destination);

  subOsc.start(now);
  subOsc.stop(now + 0.5);
}

/**
 * Sonido corto tipo pop / woosh al activar una carta.
 */
export function playCardSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Pop tonal rápido
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(820, now + 0.09);

  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.14);

  // Pequeño aire woosh
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 0.12);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(1200, now);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.12, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.12);
}
