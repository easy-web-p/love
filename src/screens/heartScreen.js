// ==========================================
// SCREEN 2: Happy Anniversary Heart Charging Screen
// ==========================================
import { getFloatingMusicButtonHtml } from '../components/musicPlayer.js';
import { playSound } from '../utils/audio.js';
import { triggerHaptic } from '../utils/haptic.js';

export let isAwakened = false;
export let isHolding = false;
export let holdProgress = 0;
export let holdTimer = null;
export let holdDrainTimer = null;
export let chargePercent = 0;
export let decayTimer = null;
export let isCompletedCharging = false;
export let burstInterval = null;
export let rapidHeartbeatInterval = null;
export let anchoredHearts = [];

export function renderAnniversaryScreen(app, onChargeCompleteCallback) {
  isAwakened = false;
  isHolding = false;
  holdProgress = 0;
  chargePercent = 0;
  isCompletedCharging = false;

  if (holdTimer) clearInterval(holdTimer);
  if (holdDrainTimer) clearInterval(holdDrainTimer);
  if (decayTimer) clearInterval(decayTimer);
  if (burstInterval) { clearInterval(burstInterval); burstInterval = null; }
  if (rapidHeartbeatInterval) { clearInterval(rapidHeartbeatInterval); rapidHeartbeatInterval = null; }

  app.innerHTML = `
    ${getFloatingMusicButtonHtml()}

    <!-- Horizontal Landscape Rounded Card Container -->
    <div class="relative w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto p-6 sm:p-10 md:p-12 neon-card text-center select-none transition-all duration-500 animate-fade-in flex flex-col items-center justify-between min-h-[460px] sm:min-h-[500px] my-auto">
      
      <!-- 1. Top Single-Line Glowing Neon Title -->
      <div class="pt-2 sm:pt-4 px-4 w-full flex justify-center items-center">
        <h1 class="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight whitespace-nowrap happy-anniversary-neon">
          Happy Anniversary
        </h1>
      </div>

      <!-- 2. Center Heart Container -->
      <div class="relative flex flex-col items-center justify-center my-4 sm:my-6">
        <div id="heart-ambient-glow" class="absolute w-60 h-60 sm:w-68 sm:h-68 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-600/25 to-indigo-500/20 blur-3xl pointer-events-none -z-10 transition-all duration-500"></div>

        <div 
          id="heart-container" 
          class="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center heart-static-gray cursor-pointer select-none transition-all duration-300"
          onpointerdown="onHeartPointerDown(event)"
          onpointerup="onHeartPointerUp(event)"
          onpointerleave="onHeartPointerUp(event)"
          onpointercancel="onHeartPointerUp(event)"
          oncontextmenu="return false;"
          style="overflow: visible;"
        >
          
          <svg id="svg-heart" viewBox="0 0 100 100" class="w-full h-full transition-all duration-150" style="overflow: visible;">
            <defs>
              <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop id="stroke-stop-1" offset="0%" stop-color="#6366f1" />
                <stop id="stroke-stop-2" offset="50%" stop-color="#7c3aed" />
                <stop id="stroke-stop-3" offset="100%" stop-color="#8b5cf6" />
              </linearGradient>

              <clipPath id="heartClip">
                <path d="M 50,24 C 50,24 38,10 24,10 C 12,10 6,22 6,36 C 6,56 24,74 50,92 C 76,74 94,56 94,36 C 94,22 88,10 76,10 C 62,10 50,24 50,24 Z" />
              </clipPath>

              <linearGradient id="fillGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop id="fill-stop-1" offset="0%" stop-color="#4f46e5" />
                <stop id="fill-stop-2" offset="60%" stop-color="#7c3aed" />
                <stop id="fill-stop-3" offset="100%" stop-color="#8b5cf6" />
              </linearGradient>

              <linearGradient id="miniHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop id="mini-stop-1" offset="0%" stop-color="#6366f1" />
                <stop id="mini-stop-2" offset="100%" stop-color="#8b5cf6" />
              </linearGradient>
            </defs>

            <!-- Background & Liquid Fill -->
            <rect width="100" height="100" fill="#140526" clip-path="url(#heartClip)" />
            <rect id="heart-liquid" x="0" y="92" width="100" height="100" fill="url(#fillGradient)" clip-path="url(#heartClip)" class="transition-all duration-100 ease-out opacity-0" />

            <!-- Particle Layer Strictly Clipped to Inner Heart Boundary -->
            <g id="heart-particle-layer" clip-path="url(#heartClip)"></g>

            <!-- Center Mini Heart Icon -->
            <path id="center-mini-heart"
                  d="M 50,42 C 50,42 46,36 41,36 C 36,36 34,40 34,45 C 34,52 40,59 50,65 C 60,59 66,52 66,45 C 66,40 64,36 59,36 C 54,36 50,42 50,42 Z"
                  fill="url(#miniHeartGrad)"
                  style="filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.6));"
                  class="transition-all duration-300 pointer-events-none" />

            <!-- Base Visible Neon Heart Outline -->
            <path d="M 50,24 C 50,24 38,10 24,10 C 12,10 6,22 6,36 C 6,56 24,74 50,92 C 76,74 94,56 94,36 C 94,22 88,10 76,10 C 62,10 50,24 50,24 Z"
                  fill="none" 
                  stroke="rgba(139, 92, 246, 0.45)" 
                  stroke-width="5" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"
                  style="filter: drop-shadow(0 0 6px rgba(139, 92, 246, 0.35));" />

            <!-- Structural Reference Path -->
            <path id="heart-outline" d="M 50,24 C 50,24 38,10 24,10 C 12,10 6,22 6,36 C 6,56 24,74 50,92 C 76,74 94,56 94,36 C 94,22 88,10 76,10 C 62,10 50,24 50,24 Z"
                  fill="none" 
                  stroke="none" 
                  stroke-width="5.5" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"
                  stroke-dasharray="350"
                  stroke-dashoffset="350" />
          </svg>

        </div>
      </div>

      <!-- 3. Bottom Text -->
      <div class="pb-2 sm:pb-4">
        <p id="instruction-text" class="text-xs sm:text-sm font-medium tracking-wide text-purple-300 flex items-center justify-center space-x-1.5">
          <span>แตะที่หัวใจค้างไว้เพื่อปลุกพลังรัก</span>
          <span>💜</span>
        </p>
      </div>

    </div>
  `;

  // Attach completion handler to window for callbacks
  window._onHeartChargeCompleted = onChargeCompleteCallback;
}

export function spawnAnchoredHeart(progress, totalLen, outline) {
  const particleGroup = document.getElementById('heart-particle-layer');
  if (!particleGroup || !outline) return;

  const currentLen = totalLen * (progress / 100);
  const pt = outline.getPointAtLength(currentLen);

  const heart = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  heart.setAttribute('d', 'M 0,-3.5 C 0,-3.5 -3,-7 -6.5,-7 C -10,-7 -11.5,-3.5 -11.5,0 C -11.5,5.5 -6.5,10.5 0,15.5 C 6.5,10.5 11.5,5.5 11.5,0 C 11.5,-3.5 10,-7 6.5,-7 C 3,-7 0,-3.5 0,-3.5 Z');
  heart.setAttribute('fill', 'url(#miniHeartGrad)');
  heart.setAttribute('style', 'filter: drop-shadow(0 0 6px #c084fc); transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.35, 1), opacity 0.25s ease;');
  heart.setAttribute('transform', 'translate(50, 48) scale(0.15)');
  heart.setAttribute('opacity', '0.95');
  heart.dataset.progress = progress;

  particleGroup.appendChild(heart);
  anchoredHearts.push(heart);

  requestAnimationFrame(() => {
    heart.setAttribute('transform', `translate(${pt.x}, ${pt.y}) scale(0.38)`);
  });
}

export function emit45DegreeHearts() {
  const particleGroup = document.getElementById('heart-particle-layer');
  if (!particleGroup) return;

  const separateTrajectories = [
    { name: 'top-right-lobe',  x: 74, y: 24, scale: 0.36 },
    { name: 'bottom-right-v',  x: 68, y: 66, scale: 0.36 },
    { name: 'bottom-tip',      x: 50, y: 92, scale: 0.38 },
    { name: 'bottom-left-v',   x: 32, y: 66, scale: 0.36 },
    { name: 'top-left-lobe',   x: 26, y: 24, scale: 0.36 },
    { name: 'top-notch',       x: 50, y: 24, scale: 0.34 }
  ];

  separateTrajectories.forEach(t => {
    const heart = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    heart.setAttribute('d', 'M 0,-3 C 0,-3 -2.5,-6 -5.5,-6 C -8.5,-6 -10,-3 -10,0 C -10,4.5 -5.5,9 0,13.5 C 5.5,9 10,4.5 10,0 C 10,-3 8.5,-6 5.5,-6 C 2.5,-6 0,-3 0,-3 Z');
    heart.setAttribute('fill', 'url(#miniHeartGrad)');
    heart.setAttribute('style', 'filter: drop-shadow(0 0 6px #8b5cf6); transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.35, 1), opacity 0.45s ease;');
    heart.setAttribute('transform', 'translate(50, 48) scale(0.2)');
    heart.setAttribute('opacity', '0.9');

    particleGroup.appendChild(heart);

    requestAnimationFrame(() => {
      heart.setAttribute('transform', `translate(${t.x}, ${t.y}) scale(${t.scale})`);
      setTimeout(() => {
        heart.setAttribute('opacity', '0');
        setTimeout(() => heart.remove(), 250);
      }, 350);
    });
  });
}

export function onHeartPointerDown(e) {
  if (isCompletedCharging) return;

  if (e && e.target && e.target.setPointerCapture && e.pointerId) {
    try { e.target.setPointerCapture(e.pointerId); } catch(err) {}
  }

  if (isAwakened) {
    tapHeartCharge(e);
  } else {
    startHoldToAwaken();
  }
}

export function onHeartPointerUp(e) {
  if (e && e.target && e.target.releasePointerCapture && e.pointerId) {
    try { e.target.releasePointerCapture(e.pointerId); } catch(err) {}
  }

  if (!isAwakened && isHolding) {
    cancelHoldToAwaken();
  }
}

export function startHoldToAwaken() {
  isHolding = true;

  if (holdDrainTimer) {
    clearInterval(holdDrainTimer);
    holdDrainTimer = null;
  }

  const container = document.getElementById('heart-container');
  const outline = document.getElementById('heart-outline');

  if (container) {
    container.classList.remove('heart-static-gray');
    container.classList.add('heart-holding');
  }

  playSound('heartbeat', 0.9);

  if (holdTimer) clearInterval(holdTimer);
  if (burstInterval) clearInterval(burstInterval);

  emit45DegreeHearts();
  burstInterval = setInterval(emit45DegreeHearts, 220);

  const totalLen = (outline && outline.getTotalLength) ? outline.getTotalLength() : 280;
  if (outline) outline.style.strokeDasharray = `${totalLen}`;

  holdTimer = setInterval(() => {
    holdProgress += 1;
    const fraction = Math.min(1, holdProgress / 100);
    
    if (outline) {
      const offset = totalLen * (1 - fraction);
      outline.style.strokeDashoffset = `${offset}px`;
    }

    if (holdProgress % 2 === 0) {
      spawnAnchoredHeart(holdProgress, totalLen, outline);
    }

    if (holdProgress >= 100) {
      clearInterval(holdTimer);
      holdTimer = null;
      if (burstInterval) {
        clearInterval(burstInterval);
        burstInterval = null;
      }
      finishAwakenAnimation();
    }
  }, 45);
}

export function cancelHoldToAwaken() {
  isHolding = false;
  if (holdTimer) {
    clearInterval(holdTimer);
    holdTimer = null;
  }
  if (burstInterval) {
    clearInterval(burstInterval);
    burstInterval = null;
  }

  const container = document.getElementById('heart-container');
  const outline = document.getElementById('heart-outline');
  const totalLen = (outline && outline.getTotalLength) ? outline.getTotalLength() : 280;

  if (container) {
    container.classList.remove('heart-holding');
  }

  if (holdDrainTimer) clearInterval(holdDrainTimer);
  holdDrainTimer = setInterval(() => {
    if (isHolding || isAwakened) {
      clearInterval(holdDrainTimer);
      holdDrainTimer = null;
      return;
    }

    holdProgress = Math.max(0, holdProgress - 3);
    const fraction = holdProgress / 100;
    
    if (outline) {
      const offset = totalLen * (1 - fraction);
      outline.style.strokeDashoffset = `${offset}px`;
    }

    const heartsToRemove = anchoredHearts.filter(h => parseFloat(h.dataset.progress) > holdProgress);
    heartsToRemove.forEach(h => {
      h.setAttribute('opacity', '0');
      setTimeout(() => h.remove(), 150);
    });
    anchoredHearts = anchoredHearts.filter(h => parseFloat(h.dataset.progress) <= holdProgress);

    if (holdProgress <= 0) {
      if (holdDrainTimer) {
        clearInterval(holdDrainTimer);
        holdDrainTimer = null;
      }
      if (container) container.classList.add('heart-static-gray');
    }
  }, 25);
}

export function finishAwakenAnimation() {
  isAwakened = true;
  isHolding = false;

  playSound('success');

  const container = document.getElementById('heart-container');
  const liquid = document.getElementById('heart-liquid');
  const instructionText = document.getElementById('instruction-text');

  if (container) {
    container.classList.remove('heart-holding', 'heart-static-gray');
    container.classList.add('heart-ready', 'animate-pulse');
    setTimeout(() => {
      if (container) container.classList.remove('animate-pulse');
    }, 600);
  }

  if (liquid) {
    liquid.classList.remove('opacity-0');
  }

  if (instructionText) {
    instructionText.innerText = "แตะหัวใจรัวๆ เพื่อเติมพลังรัก 💕";
    instructionText.className = "text-xs sm:text-sm text-pink-300 font-medium tracking-wide animate-pulse";
  }

  chargePercent = 0;
  updateHeartDisplay();
  startDecayLoop();
}

export function startDecayLoop() {
  if (decayTimer) clearInterval(decayTimer);

  decayTimer = setInterval(() => {
    if (isCompletedCharging || !isAwakened) return;
    
    if (chargePercent > 0) {
      chargePercent = Math.max(0, chargePercent - 1.2);
      updateHeartDisplay();
    }
  }, 100);
}

export function tapHeartCharge(e) {
  if (isCompletedCharging || !isAwakened) return;

  chargePercent = Math.min(100, chargePercent + 5);
  
  const beatIntensity = 0.85 + (chargePercent / 100) * 0.95;
  playSound('heartbeat', beatIntensity);

  spawnHeartParticle(e);

  const svg = document.getElementById('svg-heart');
  if (svg) {
    svg.classList.add('heart-tap-pulse');
    setTimeout(() => svg.classList.remove('heart-tap-pulse'), 120);
  }

  updateHeartDisplay();

  if (chargePercent >= 100) {
    isCompletedCharging = true;
    if (decayTimer) clearInterval(decayTimer);
    onChargeComplete();
  }
}

export function spawnHeartParticle(e) {
  const container = document.getElementById('heart-container');
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const x = e ? (e.clientX - rect.left) : (rect.width / 2);
  const y = e ? (e.clientY - rect.top) : (rect.height / 2);

  const particle = document.createElement('div');
  particle.className = 'floating-heart-particle text-lg select-none';
  const hearts = ['💖', '💕', '✨', '💓', '💗'];
  particle.innerText = hearts[Math.floor(Math.random() * hearts.length)];
  particle.style.left = `${x - 10 + (Math.random() * 20 - 10)}px`;
  particle.style.top = `${y - 10}px`;

  container.appendChild(particle);
  setTimeout(() => particle.remove(), 800);
}

export function updateHeartDisplay() {
  const liquid = document.getElementById('heart-liquid');
  const fillStop1 = document.getElementById('fill-stop-1');
  const fillStop2 = document.getElementById('fill-stop-2');
  const fillStop3 = document.getElementById('fill-stop-3');
  const strokeStop1 = document.getElementById('stroke-stop-1');
  const strokeStop2 = document.getElementById('stroke-stop-2');
  const miniStop1 = document.getElementById('mini-stop-1');
  const miniStop2 = document.getElementById('mini-stop-2');
  const centerMiniHeart = document.getElementById('center-mini-heart');

  if (liquid) {
    const yPos = 92 - (chargePercent * 0.82);
    liquid.setAttribute('y', yPos.toString());
  }

  const heartContainer = document.getElementById('heart-container');
  const instructionText = document.getElementById('instruction-text');

  if (chargePercent < 35) {
    if (fillStop1) fillStop1.setAttribute('stop-color', '#4f46e5');
    if (fillStop2) fillStop2.setAttribute('stop-color', '#7c3aed');
    if (fillStop3) fillStop3.setAttribute('stop-color', '#a855f7');
    if (strokeStop1) strokeStop1.setAttribute('stop-color', '#c084fc');
    if (strokeStop2) strokeStop2.setAttribute('stop-color', '#a855f7');
    if (miniStop1) miniStop1.setAttribute('stop-color', '#6366f1');
    if (miniStop2) miniStop2.setAttribute('stop-color', '#8b5cf6');
    if (centerMiniHeart) centerMiniHeart.style.filter = "drop-shadow(0 0 10px #8b5cf6)";
    if (heartContainer) heartContainer.classList.remove('heartbeat-fast');
    if (instructionText) instructionText.innerText = "แตะหัวใจรัวๆ เพื่อเติมพลังรัก 💕";
  } else if (chargePercent < 75) {
    if (fillStop1) fillStop1.setAttribute('stop-color', '#9333ea');
    if (fillStop2) fillStop2.setAttribute('stop-color', '#ec4899');
    if (fillStop3) fillStop3.setAttribute('stop-color', '#f43f5e');
    if (strokeStop1) strokeStop1.setAttribute('stop-color', '#ec4899');
    if (strokeStop2) strokeStop2.setAttribute('stop-color', '#fb7185');
    if (miniStop1) miniStop1.setAttribute('stop-color', '#ff2a85');
    if (miniStop2) miniStop2.setAttribute('stop-color', '#e11d48');
    if (centerMiniHeart) centerMiniHeart.style.filter = "drop-shadow(0 0 10px #ff2a85)";
    if (heartContainer) heartContainer.classList.remove('heartbeat-fast');
    if (instructionText) instructionText.innerText = "แตะหัวใจรัวๆ เพื่อเติมพลังรัก 💕";
  } else {
    if (fillStop1) fillStop1.setAttribute('stop-color', '#ec4899');
    if (fillStop2) fillStop2.setAttribute('stop-color', '#f43f5e');
    if (fillStop3) fillStop3.setAttribute('stop-color', '#fbbf24');
    if (strokeStop1) strokeStop1.setAttribute('stop-color', '#fb7185');
    if (strokeStop2) strokeStop2.setAttribute('stop-color', '#f59e0b');
    if (miniStop1) miniStop1.setAttribute('stop-color', '#f43f5e');
    if (miniStop2) miniStop2.setAttribute('stop-color', '#fbbf24');
    if (centerMiniHeart) centerMiniHeart.style.filter = "drop-shadow(0 0 14px #fbbf24) drop-shadow(0 0 25px #f43f5e)";
    if (heartContainer) heartContainer.classList.add('heartbeat-fast');
    if (instructionText) instructionText.innerText = "🔥 หัวใจเต้นแรงมากก กดอีกนิดเดียว! 🔥";
  }
}

export function onChargeComplete() {
  const instructionText = document.getElementById('instruction-text');
  const container = document.getElementById('heart-container');
  const svg = document.getElementById('svg-heart');

  if (container) container.classList.add('heart-overload-pulse');
  if (svg) svg.classList.add('heart-overload-pulse');

  if (instructionText) {
    instructionText.innerText = "💓 ตึกตัก! ตึกตัก! ตึกตัก! หัวใจเต้นแรงที่สุดเพื่อเธอ 💕";
    instructionText.className = "text-xs sm:text-sm text-yellow-300 font-bold tracking-wide animate-pulse";
  }

  if (rapidHeartbeatInterval) clearInterval(rapidHeartbeatInterval);
  playSound('heartbeat', 1.85);
  triggerHaptic('rapid_heartbeat');
  rapidHeartbeatInterval = setInterval(() => {
    playSound('heartbeat', 1.95);
    triggerHaptic('rapid_heartbeat');
  }, 380);

  playSound('success');

  if (typeof confetti === 'function') {
    try {
      confetti({
        particleCount: 180,
        spread: 95,
        colors: ['#fbbf24', '#f43f5e', '#ec4899', '#c084fc', '#ffffff'],
        origin: { y: 0.6 }
      });
    } catch(err) {}
  }

  setTimeout(() => {
    if (typeof confetti === 'function') {
      try {
        confetti({
          particleCount: 120,
          spread: 85,
          colors: ['#fbbf24', '#f43f5e', '#ffffff'],
          origin: { y: 0.5 }
        });
      } catch(err) {}
    }
  }, 1400);

  setTimeout(() => {
    if (rapidHeartbeatInterval) {
      clearInterval(rapidHeartbeatInterval);
      rapidHeartbeatInterval = null;
    }
    if (typeof window._onHeartChargeCompleted === 'function') {
      window._onHeartChargeCompleted();
    } else if (typeof window.navigateToSurprise === 'function') {
      window.navigateToSurprise();
    }
  }, 3000);
}

window.onHeartPointerDown = onHeartPointerDown;
window.onHeartPointerUp = onHeartPointerUp;
