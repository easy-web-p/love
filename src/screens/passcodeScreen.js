// ==========================================
// SCREEN 1: Velvet Lock Screen (Passcode PIN)
// ==========================================
import { MODES } from '../data/questions.js';
import { getFloatingMusicButtonHtml } from '../components/musicPlayer.js';
import { playSound } from '../utils/audio.js';

export let currentMode = "anniversary";
export let enteredPin = "";

export function renderPasscodeScreen(app, onPasscodeSuccessCallback) {
  enteredPin = "";
  const modeData = MODES[currentMode] || MODES.anniversary;

  app.innerHTML = `
    ${getFloatingMusicButtonHtml()}

    <div id="passcode-box" class="relative w-full max-w-sm sm:max-w-md mx-auto p-8 sm:p-10 neon-card text-center space-y-6 select-none transition-all duration-300">
      
      <div class="space-y-2 pt-1">
        <p class="velvet-badge">
          VELVET LOCK
        </p>
        <h1 class="text-3xl sm:text-4xl font-extrabold neon-title tracking-tight">
          ใส่รหัสหัวใจ
        </h1>
        <div class="space-y-0.5 pt-1">
          <p id="pin-prompt" class="text-sm sm:text-base text-purple-100 font-semibold tracking-wide">
            ${modeData.question}
          </p>
          <p class="text-[11px] text-purple-300/60 font-light">
            รูปแบบ วันเดือนปี 6 หลัก
          </p>
        </div>
      </div>

      <div class="relative max-w-[290px] mx-auto my-6">
        <input 
          id="native-pin-input" 
          type="tel" 
          inputmode="numeric" 
          pattern="[0-9]*" 
          maxlength="6" 
          autocomplete="off"
          class="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer text-transparent caret-transparent"
        />

        <div class="flex justify-between items-center pointer-events-none relative z-10">
          <div id="box-0" class="pin-box active"><span class="blinking-caret"></span></div>
          <div id="box-1" class="pin-box"></div>
          <div id="box-2" class="pin-box"></div>
          <div id="box-3" class="pin-box"></div>
          <div id="box-4" class="pin-box"></div>
          <div id="box-5" class="pin-box"></div>
        </div>
      </div>

      <p class="text-[11px] text-purple-300/70 font-light">
        คำถามที่ ${modeData.index} จาก 3 • แตะการ์ดเพื่อเปิดแป้นพิมพ์
      </p>

      <div class="pt-2 space-y-2.5">
        <button onclick="showDontKnowHint()" class="w-full bg-purple-900/40 hover:bg-purple-800/50 border border-purple-500/30 text-purple-200 font-medium py-3 px-4 rounded-2xl text-xs tracking-wide transition-all flex items-center justify-center space-x-2 hover:scale-[1.02] active:scale-98 shadow-md">
          <span>❓</span>
          <span>ไม่รู้ (ดูคำใบ้)</span>
        </button>

        <button onclick="showForgotModal()" class="text-xs text-pink-400 hover:text-pink-300 underline underline-offset-4 tracking-wide transition-colors block mx-auto py-1">
          😢 ลืมรหัสผ่านใช่ไหม? (เปลี่ยนคำถาม)
        </button>
      </div>

      <div id="modal-container" class="hidden fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"></div>

    </div>
  `;

  setupPinInput(app, onPasscodeSuccessCallback);
}

function setupPinInput(app, onPasscodeSuccessCallback) {
  const input = document.getElementById('native-pin-input');
  const box = document.getElementById('passcode-box');
  if (!input) return;

  input.value = enteredPin;
  setTimeout(() => input.focus(), 150);

  if (box) {
    box.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
        input.focus();
      }
    });
  }

  input.addEventListener('input', (e) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    
    if (rawVal.length !== enteredPin.length) {
      playSound('tap');
    }
    
    enteredPin = rawVal;
    e.target.value = enteredPin;
    
    updatePinBoxes();

    if (enteredPin.length === 6) {
      setTimeout(() => verifyPasscode(onPasscodeSuccessCallback), 200);
    }
  });
}

window.addEventListener('keydown', (e) => {
  const input = document.getElementById('native-pin-input');
  if (!input) return;

  const modal = document.getElementById('modal-container');
  if (modal && !modal.classList.contains('hidden')) return;

  if (document.activeElement !== input) {
    input.focus();
  }
});

function updatePinBoxes() {
  for (let i = 0; i < 6; i++) {
    const box = document.getElementById(`box-${i}`);
    if (!box) continue;

    if (i < enteredPin.length) {
      box.className = "pin-box filled";
      box.innerHTML = enteredPin[i];
    } else if (i === enteredPin.length) {
      box.className = "pin-box active";
      box.innerHTML = '<span class="blinking-caret"></span>';
    } else {
      box.className = "pin-box";
      box.innerHTML = '';
    }
  }
}

function verifyPasscode(onSuccessCallback) {
  const box = document.getElementById('passcode-box');
  const prompt = document.getElementById('pin-prompt');
  const input = document.getElementById('native-pin-input');
  const targetMode = MODES[currentMode] || MODES.anniversary;

  if (enteredPin === targetMode.code) {
    playSound('success');
    
    if (typeof confetti === 'function') {
      try {
        confetti({
          particleCount: 130,
          spread: 85,
          colors: ['#c084fc', '#f43f5e', '#ec4899', '#ffffff'],
          origin: { y: 0.6 }
        });
      } catch(err) {}
    }

    if (prompt) {
      prompt.innerText = `✨ รหัสถูกต้อง! กำลังเปิดพื้นที่ความรัก... 💖`;
      prompt.className = "text-xs text-green-400 mt-2 font-bold tracking-wide animate-pulse";
    }

    setTimeout(() => {
      if (typeof onSuccessCallback === 'function') {
        onSuccessCallback();
      } else if (typeof window.navigateToHeart === 'function') {
        window.navigateToHeart();
      }
    }, 900);
  } else {
    playSound('error');
    if (box) {
      box.classList.add('shake-error');
      setTimeout(() => box.classList.remove('shake-error'), 400);
    }

    if (prompt) {
      prompt.innerText = `❌ รหัสของ "${targetMode.title}" ไม่ถูกต้องน้าา 😝`;
      prompt.className = "text-xs text-rose-400 mt-2 font-bold tracking-wide";
    }

    enteredPin = "";
    if (input) input.value = "";
    updatePinBoxes();
  }
}

export function showDontKnowHint() {
  playSound('tap');
  const modal = document.getElementById('modal-container');
  const targetMode = MODES[currentMode] || MODES.anniversary;

  if (!modal) return;
  modal.innerHTML = `
    <div class="bg-gradient-to-b from-purple-950 to-slate-950 p-6 rounded-3xl border border-purple-500/40 max-w-xs w-full text-center space-y-4 shadow-2xl animate-fade-in">
      <div class="text-4xl">💡</div>
      <h3 class="text-lg font-bold text-pink-300">คำใบ้: ${targetMode.title}</h3>
      <p class="text-xs text-purple-200 leading-relaxed">
        ${targetMode.hint}
      </p>
      <button onclick="closeModalAndFocus()" class="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-2.5 rounded-xl text-xs shadow-lg hover:opacity-90 transition-all">
        เข้าใจแล้ว ลองพิมพ์ดู 💕
      </button>
      <button onclick="closeModal()" class="text-xs text-gray-400 hover:text-white">
        ปิดหน้าต่าง
      </button>
    </div>
  `;
  modal.classList.remove('hidden');
}

export function showForgotModal() {
  playSound('tap');
  const modal = document.getElementById('modal-container');
  if (!modal) return;
  modal.innerHTML = `
    <div class="bg-gradient-to-b from-purple-950 to-slate-950 p-6 rounded-3xl border border-purple-500/40 max-w-xs w-full text-center space-y-4 shadow-2xl animate-fade-in">
      <div class="text-4xl">💭</div>
      <div>
        <h3 class="text-lg font-bold text-purple-200">ลืมสิ่งที่จำได้ใช่ไหม?</h3>
        <p class="text-[11px] text-purple-300 mt-1">เลือกคำถามของวันที่เธอจำได้เลยครับ 💕</p>
      </div>

      <div class="space-y-2.5 text-left">
        <button onclick="changeMode('birthday')" class="w-full bg-purple-900/50 hover:bg-purple-800/60 border border-purple-500/30 p-3.5 rounded-xl flex items-center justify-between text-xs transition-all hover:scale-[1.02] active:scale-98">
          <div class="font-bold text-pink-300 flex items-center space-x-2">
            <span>🎂</span>
            <span>วันเกิดเค้า</span>
          </div>
          <span class="text-pink-400">➔</span>
        </button>

        <button onclick="changeMode('activity')" class="w-full bg-purple-900/50 hover:bg-purple-800/60 border border-purple-500/30 p-3.5 rounded-xl flex items-center justify-between text-xs transition-all hover:scale-[1.02] active:scale-98">
          <div class="font-bold text-pink-300 flex items-center space-x-2">
            <span>🎬</span>
            <span>วันที่เค้าหลอกเธอไปทำกิจกรรม</span>
          </div>
          <span class="text-pink-400">➔</span>
        </button>

        <button onclick="changeMode('anniversary')" class="w-full bg-purple-900/50 hover:bg-purple-800/60 border border-purple-500/30 p-3.5 rounded-xl flex items-center justify-between text-xs transition-all hover:scale-[1.02] active:scale-98">
          <div class="font-bold text-pink-300 flex items-center space-x-2">
            <span>💖</span>
            <span>วันครบรอบของเรา</span>
          </div>
          <span class="text-pink-400">➔</span>
        </button>
      </div>

      <button onclick="closeModal()" class="text-xs text-gray-400 hover:text-white pt-1">
        ✕ ปิดหน้าต่าง
      </button>
    </div>
  `;
  modal.classList.remove('hidden');
}

export function changeMode(modeKey) {
  closeModal();
  currentMode = modeKey;
  if (typeof window.navigateToPasscode === 'function') {
    window.navigateToPasscode();
  }
}

export function closeModalAndFocus() {
  closeModal();
  const input = document.getElementById('native-pin-input');
  if (input) setTimeout(() => input.focus(), 100);
}

export function closeModal() {
  const modal = document.getElementById('modal-container');
  if (modal) modal.classList.add('hidden');
}

window.showDontKnowHint = showDontKnowHint;
window.showForgotModal = showForgotModal;
window.changeMode = changeMode;
window.closeModalAndFocus = closeModalAndFocus;
window.closeModal = closeModal;
