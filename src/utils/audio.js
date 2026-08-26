// ==========================================
// Web Audio API Sound Synthesizer
// ==========================================
import { triggerHaptic } from './haptic.js';

export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function playSound(type, intensity = 1) {
  triggerHaptic(type);

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const now = audioCtx.currentTime;

  if (type === 'tap') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.start(now);
    osc.stop(now + 0.04);
  } else if (type === 'error') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(160, now + 0.12);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.start(now);
    osc.stop(now + 0.25);
  } else if (type === 'success') {
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g);
      g.connect(audioCtx.destination);
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, now + i * 0.08);
      g.gain.setValueAtTime(0.12, now + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.45);
      o.start(now + i * 0.08);
      o.stop(now + i * 0.08 + 0.45);
    });
  } else if (type === 'gift') {
    [440, 554.37, 659.25, 880, 1108.73].forEach((freq, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g);
      g.connect(audioCtx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, now + i * 0.06);
      g.gain.setValueAtTime(0.15, now + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.5);
      o.start(now + i * 0.06);
      o.stop(now + i * 0.06 + 0.5);
    });
  } else if (type === 'heartbeat') {
    const p = Math.max(0.5, Math.min(2.5, intensity || 1));
    // Lub (Thump 1)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(62 * p, now);
    osc1.frequency.exponentialRampToValueAtTime(36, now + 0.08);
    gain1.gain.setValueAtTime(0.38 * Math.min(1.8, p), now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Dub (Thump 2)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(82 * p, now + 0.09);
    osc2.frequency.exponentialRampToValueAtTime(42, now + 0.19);
    gain2.gain.setValueAtTime(0.44 * Math.min(1.8, p), now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.19);
  }
}

// Expose globally for inline event handlers
window.playSound = playSound;
