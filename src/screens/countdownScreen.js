// ==========================================
// SCREEN 0: Countdown Lock Screen
// ==========================================
import { ANNIVERSARY_TARGET_TIMESTAMP } from '../data/config.js';
import { getFloatingMusicButtonHtml } from '../components/musicPlayer.js';
import { playSound } from '../utils/audio.js';
import { showToast } from '../utils/toast.js';

export let anniversaryCountdownInterval = null;
export let isCountdownBypassed = localStorage.getItem('anniversary_countdown_bypassed') === 'true';

export function isAnniversaryUnlocked() {
  if (isCountdownBypassed) return true;
  return Date.now() >= ANNIVERSARY_TARGET_TIMESTAMP;
}

export function renderAnniversaryCountdownScreen(app, onUnlockedCallback) {
  localStorage.setItem('current_screen', 'countdown');

  if (anniversaryCountdownInterval) {
    clearInterval(anniversaryCountdownInterval);
    anniversaryCountdownInterval = null;
  }

  app.innerHTML = `
    ${getFloatingMusicButtonHtml()}

    <div class="relative w-full max-w-sm sm:max-w-md mx-auto p-7 sm:p-9 neon-card text-center space-y-6 select-none animate-fade-in">
      
      <!-- Top Glowing Padlock -->
      <div class="relative mx-auto w-20 h-20 flex items-center justify-center">
        <div class="absolute inset-0 bg-pink-500/20 rounded-full blur-xl animate-pulse"></div>
        <div class="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-900 via-pink-900 to-purple-950 border-2 border-pink-500/60 shadow-2xl flex items-center justify-center text-3xl animate-bounce" style="animation-duration: 2.5s;">
          ⏳
        </div>
      </div>

      <div class="space-y-2">
        <p class="velvet-badge">
          ANNIVERSARY COUNTDOWN
        </p>
        <h1 class="text-2xl sm:text-3xl font-extrabold neon-title tracking-tight font-cute">
          นับถอยหลังสู่วันครบรอบ
        </h1>
        <div class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-pink-300 text-xs font-mono font-semibold">
          <span>📅</span>
          <span>26 กุมภาพันธ์ 2569 เวลา 09:38 น.</span>
        </div>
      </div>

      <!-- 4 Glowing Countdown Cards -->
      <div class="grid grid-cols-4 gap-2 sm:gap-3 pt-2">
        <div class="bg-purple-950/80 border border-pink-500/40 rounded-2xl p-2 sm:p-3 text-center shadow-lg">
          <span id="cd-days" class="block text-2xl sm:text-3xl font-extrabold text-pink-400 font-mono tracking-tighter">00</span>
          <span class="text-[10px] sm:text-xs text-purple-300 font-medium">วัน</span>
        </div>
        <div class="bg-purple-950/80 border border-pink-500/40 rounded-2xl p-2 sm:p-3 text-center shadow-lg">
          <span id="cd-hours" class="block text-2xl sm:text-3xl font-extrabold text-purple-200 font-mono tracking-tighter">00</span>
          <span class="text-[10px] sm:text-xs text-purple-300 font-medium">ชั่วโมง</span>
        </div>
        <div class="bg-purple-950/80 border border-pink-500/40 rounded-2xl p-2 sm:p-3 text-center shadow-lg">
          <span id="cd-mins" class="block text-2xl sm:text-3xl font-extrabold text-purple-200 font-mono tracking-tighter">00</span>
          <span class="text-[10px] sm:text-xs text-purple-300 font-medium">นาที</span>
        </div>
        <div class="bg-purple-950/80 border border-pink-500/40 rounded-2xl p-2 sm:p-3 text-center shadow-lg animate-pulse">
          <span id="cd-secs" class="block text-2xl sm:text-3xl font-extrabold text-yellow-300 font-mono tracking-tighter">00</span>
          <span class="text-[10px] sm:text-xs text-purple-300 font-medium">วินาที</span>
        </div>
      </div>

      <!-- Romantic Lock Message -->
      <div class="p-4 rounded-2xl bg-purple-950/50 border border-purple-500/30 text-xs text-purple-200/90 font-cute leading-relaxed space-y-1.5 text-center">
        <p class="font-semibold text-pink-300">🔒 เซอร์ไพรส์นี้ถูกล็อกไว้ด้วยเวลาแห่งความรัก</p>
        <p class="text-[11px] text-purple-300/80">
          เมื่อถึงเวลาครบรอบ ระบบจะเปิดประตูพาเข้าสู่หน้าเซอร์ไพรส์และของขวัญโดยอัตโนมัติค่ะ 💕
        </p>
      </div>

      <!-- Preview Bypass Modal / Button for Developer / Creator -->
      <div class="pt-1 text-center">
        <button onclick="openCountdownBypassModal()" class="text-[11px] text-purple-400/60 hover:text-pink-300/90 underline transition-all font-cute">
          ✨ ปลดล็อกดูตัวอย่างล่วงหน้า (สำหรับเจ้าของเว็บ)
        </button>
      </div>

      <!-- Secret Bypass Modal -->
      <div id="cd-bypass-modal" class="hidden fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onclick="closeCountdownBypassModal()">
        <div class="max-w-xs w-full neon-card p-6 rounded-3xl space-y-4 text-center border border-pink-500/50 shadow-2xl" onclick="event.stopPropagation()">
          <h3 class="text-sm font-bold text-white font-cute">🔑 ปลดล็อกดูตัวอย่าง</h3>
          <p class="text-xs text-purple-200/80 font-cute">ใส่รหัสผ่านวันครบรอบ (260269) เพื่อเข้าดูตัวอย่างก่อนถึงเวลาจริง:</p>
          <input id="bypass-input-pin" type="password" maxlength="6" onkeydown="if(event.key==='Enter') confirmCountdownBypass()" class="w-full bg-purple-950 border border-pink-500/50 rounded-xl p-2.5 text-center text-white tracking-widest font-mono text-sm focus:outline-none focus:border-yellow-400" placeholder="••••••" />
          <div class="flex space-x-2">
            <button onclick="closeCountdownBypassModal()" class="flex-1 py-2 bg-purple-900/60 text-purple-300 rounded-xl text-xs font-cute">ยกเลิก</button>
            <button onclick="confirmCountdownBypass()" class="flex-1 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl text-xs font-cute shadow-md">ปลดล็อก</button>
          </div>
        </div>
      </div>

    </div>
  `;

  function updateCountdown() {
    const now = Date.now();
    const diff = ANNIVERSARY_TARGET_TIMESTAMP - now;

    if (diff <= 0) {
      if (anniversaryCountdownInterval) clearInterval(anniversaryCountdownInterval);
      if (typeof confetti === 'function') {
        try {
          confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.5 }
          });
        } catch(err) {}
      }
      playSound('gift');
      showToast("🎉 ถึงเวลาครบรอบแล้ว! ยินดีต้อนรับนะคะคนเก่ง 💕");
      setTimeout(() => {
        if (typeof onUnlockedCallback === 'function') {
          onUnlockedCallback();
        }
      }, 1800);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const dEl = document.getElementById('cd-days');
    const hEl = document.getElementById('cd-hours');
    const mEl = document.getElementById('cd-mins');
    const sEl = document.getElementById('cd-secs');

    if (dEl) dEl.innerText = String(days).padStart(2, '0');
    if (hEl) hEl.innerText = String(hours).padStart(2, '0');
    if (mEl) mEl.innerText = String(mins).padStart(2, '0');
    if (sEl) sEl.innerText = String(secs).padStart(2, '0');
  }

  updateCountdown();
  anniversaryCountdownInterval = setInterval(updateCountdown, 1000);
}

export function openCountdownBypassModal() {
  playSound('tap');
  const modal = document.getElementById('cd-bypass-modal');
  if (modal) {
    modal.classList.remove('hidden');
    const input = document.getElementById('bypass-input-pin');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 150);
    }
  }
}

export function closeCountdownBypassModal() {
  const modal = document.getElementById('cd-bypass-modal');
  if (modal) modal.classList.add('hidden');
}

export function confirmCountdownBypass() {
  const input = document.getElementById('bypass-input-pin');
  if (input && input.value.trim() === '260269') {
    isCountdownBypassed = true;
    localStorage.setItem('anniversary_countdown_bypassed', 'true');
    playSound('success');
    showToast("✨ ปลดล็อกดูตัวอย่างล่วงหน้าสำเร็จแล้วค่ะ 💕");
    closeCountdownBypassModal();
    if (anniversaryCountdownInterval) clearInterval(anniversaryCountdownInterval);
    if (typeof window.navigateToPasscode === 'function') {
      window.navigateToPasscode();
    }
  } else {
    playSound('error');
    showToast("❌ รหัสผ่านไม่ถูกต้องค่ะ");
  }
}

window.openCountdownBypassModal = openCountdownBypassModal;
window.closeCountdownBypassModal = closeCountdownBypassModal;
window.confirmCountdownBypass = confirmCountdownBypass;
