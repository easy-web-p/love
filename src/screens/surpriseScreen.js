// ==========================================
// SCREEN 3: Surprise Page Component
// ==========================================
import { PHOTO_ALBUM } from '../data/photos.js';
import { LOVE_LETTER_TEXT } from '../data/messages.js';
import { trueMoneyGiftConfig } from '../data/config.js';
import { getFloatingMusicButtonHtml } from '../components/musicPlayer.js';
import { playSound } from '../utils/audio.js';
import { showToast } from '../utils/toast.js';

import { initScratchCard } from '../components/games/scratchCard.js';
import { initTriviaGame } from '../components/games/triviaGame.js';
import { initMemoryGame, renderMemoryGrid, renderJigsawGrid, isMemoryPairMatched, isJigsawCompleted } from '../components/games/memoryGame.js';

export let currentPhotoIndex = 0;
export let loveTimerInterval = null;
export let typewriterTimer = null;
let teaseCount = 0;

export function renderSurprisePage(app, onLockScreenCallback) {
  currentPhotoIndex = 0;
  teaseCount = 0;

  app.innerHTML = `
    ${getFloatingMusicButtonHtml()}

    <div class="w-full max-w-md sm:max-w-lg mx-auto space-y-6 select-none animate-fade-in pb-16">
      
      <!-- 1. Header Banner -->
      <div class="text-center pt-3 pb-2 space-y-2">
        <h1 class="text-3xl sm:text-4xl font-extrabold happy-anniversary-neon tracking-tight">
          เซอร์ไพรส์สำหรับเธอ
        </h1>
        <p class="text-xs sm:text-sm text-purple-200/90 font-light tracking-wide">
          เปิดดูทีละอย่างนะ ทำมาให้เธอคนเดียวเลย
        </p>
      </div>

      <!-- 2. LOVE TIME COUNTER (นับจาก 26 ก.พ. 2569 09:38) -->
      <div class="p-6 sm:p-8 neon-card text-center space-y-4">
        <div class="space-y-1">
          <span class="text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] text-pink-400 uppercase">
            LOVE TIME COUNTER
          </span>
          <h2 class="text-lg sm:text-xl font-extrabold text-white tracking-wide">
            เรารักกันมาแล้ว
          </h2>
        </div>
        
        <div class="grid grid-cols-4 gap-2 sm:gap-3 text-center pt-1">
          <div class="time-pill-box">
            <span id="timer-days" class="time-pill-number font-mono block">00</span>
            <span class="block text-[11px] text-purple-300 font-light mt-1">วัน</span>
          </div>
          <div class="time-pill-box">
            <span id="timer-hours" class="time-pill-number font-mono block">00</span>
            <span class="block text-[11px] text-purple-300 font-light mt-1">ชั่วโมง</span>
          </div>
          <div class="time-pill-box">
            <span id="timer-mins" class="time-pill-number font-mono block">00</span>
            <span class="block text-[11px] text-purple-300 font-light mt-1">นาที</span>
          </div>
          <div class="time-pill-box">
            <span id="timer-secs" class="time-pill-number font-mono block animate-pulse">00</span>
            <span class="block text-[11px] text-purple-300 font-light mt-1">วินาที</span>
          </div>
        </div>

        <p class="text-[11px] sm:text-xs text-purple-300/80 font-light pt-1">
          นับตั้งแต่ 26 กุมภาพันธ์ 2569 (09:38 น.) 💖
        </p>
      </div>

      <!-- 3. POLAROID MEMORIES -->
      <div class="p-6 sm:p-8 neon-card space-y-4 text-center">
        <div class="space-y-1">
          <span class="text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] text-pink-400 uppercase">
            POLAROID MEMORIES
          </span>
        </div>

        <div class="perspective-container flex justify-center py-2">
          <div id="polaroid-wrapper" class="white-polaroid-frame max-w-[320px] w-full text-center space-y-3 cursor-pointer" onclick="zoomCurrentPhoto()">
            <div class="relative overflow-hidden rounded-2xl bg-black aspect-square flex items-center justify-center">
              <img id="polaroid-img" src="${PHOTO_ALBUM[0].url}" alt="Memory" class="w-full h-full object-cover transition-all duration-300 hover:scale-105" />
            </div>
            <div class="pt-2 pb-1 px-1">
              <p id="polaroid-caption" class="text-xs sm:text-sm font-semibold text-gray-800 leading-relaxed font-cute">
                ${PHOTO_ALBUM[0].caption}
              </p>
            </div>
          </div>
        </div>

        <div class="flex justify-center items-center space-x-6 pt-2">
          <button onclick="prevPhoto()" class="nav-pill-btn shadow-lg" title="ย้อนกลับ">
            ◀
          </button>
          <span id="photo-indicator" class="text-xs sm:text-sm text-purple-200 font-mono font-bold px-3 py-1 bg-purple-950/70 rounded-full border border-purple-500/30">
            1 / ${PHOTO_ALBUM.length}
          </span>
          <button onclick="nextPhoto()" class="nav-pill-btn shadow-lg" title="ถัดไป">
            ▶
          </button>
        </div>
      </div>

      <!-- 4. จดหมายบอกรัก (Typewriter Love Letter) -->
      <div class="p-6 sm:p-7 neon-card space-y-3 text-left">
        <div class="flex items-center justify-between border-b border-purple-500/30 pb-2">
          <h2 class="text-sm font-bold text-pink-300 flex items-center space-x-1.5">
            <span>✍️</span>
            <span>จดหมายถึงคนพิเศษ</span>
          </h2>
          <button onclick="restartTypewriter()" class="text-[10px] text-purple-300 hover:text-pink-300 underline">
            พิมพ์ใหม่อีกรอบ ↻
          </button>
        </div>

        <div class="bg-purple-950/70 p-4 rounded-2xl border border-purple-500/30 text-xs leading-relaxed text-purple-100 min-h-[110px] font-cute tracking-wide shadow-inner">
          <p id="typewriter-text" class="typewriter-cursor"></p>
        </div>
      </div>

      <!-- 5. โซนมินิเกมเซอร์ไพรส์แฟนรับเงินจริง (Interactive Mini-Games & TrueMoney Gift Zone) -->
      <div class="p-6 sm:p-8 neon-card space-y-5 text-center">
        <div class="space-y-1">
          <span class="text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] text-pink-400 uppercase">
            MINI-GAME SURPRISE & REWARDS
          </span>
          <h2 class="text-lg sm:text-xl font-extrabold text-white tracking-wide flex items-center justify-center space-x-2">
            <span>🎮</span>
            <span>เล่นเกมลุ้นรับของขวัญคนเก่ง</span>
            <span>🧧</span>
          </h2>
          <p class="text-[11px] text-purple-300/80 font-light">
            เลือกเล่นเกมที่ชอบ แล้วชนะเพื่อรับซองของขวัญพิเศษจากเค้านะคะ 💕
          </p>
        </div>

        <!-- Mini-Game Tabs -->
        <div class="flex p-1 bg-purple-950/80 rounded-2xl border border-purple-500/30 text-xs font-cute">
          <button id="tab-game-scratch" onclick="switchGameTab('scratch')" class="flex-1 py-2 px-2 rounded-xl transition-all font-bold bg-pink-600/80 text-white shadow-md">
            🎁 ขูดการ์ดสุ่ม
          </button>
          <button id="tab-game-trivia" onclick="switchGameTab('trivia')" class="flex-1 py-2 px-2 rounded-xl transition-all font-bold text-purple-300 hover:text-white">
            🧩 ตอบคำถาม
          </button>
          <button id="tab-game-memory" onclick="switchGameTab('memory')" class="flex-1 py-2 px-2 rounded-xl transition-all font-bold text-purple-300 hover:text-white">
            🧩 จับคู่ & จิ๊กซอว์
          </button>
        </div>

        <!-- GAME 1: Digital Scratch Card & Lucky Chests -->
        <div id="game-view-scratch" class="space-y-4 pt-1">
          <p class="text-xs text-pink-200 font-cute">
            ✨ ใช้นิ้วหรือเมาส์ขูดการ์ดสีทอง เพื่อเปิดดูเซอร์ไพรส์ข้างใน ✨
          </p>

          <!-- Interactive Scratch Card Box -->
          <div class="relative w-full max-w-[300px] h-[160px] mx-auto rounded-3xl overflow-hidden shadow-2xl border-2 border-yellow-500/50 flex items-center justify-center bg-gradient-to-br from-purple-950 via-pink-950 to-purple-950">
            <!-- Hidden Surprise Underneath -->
            <div class="p-4 text-center space-y-1 select-none">
              <span class="text-3xl animate-bounce block">🧧</span>
              <h4 class="text-sm font-bold text-yellow-300 font-cute">
                ยินดีด้วยค่ะคนเก่ง! 🎉
              </h4>
              <p class="text-[11px] text-pink-200">
                คุณได้รับซองของขวัญพิเศษจากเค้า 💕
              </p>
            </div>

            <!-- HTML5 Scratch Canvas Coating -->
            <canvas id="scratch-canvas" class="scratch-canvas"></canvas>
          </div>

          <!-- 3 Mystery Chests Alternative -->
          <div class="pt-2">
            <p class="text-[11px] text-purple-300/80 mb-2 font-cute">หรือแตะเลือกเปิดกล่องของขวัญนำโชค 3 ใบนี้ 🎁</p>
            <div class="grid grid-cols-3 gap-3">
              <button onclick="openLuckyBox(1)" class="p-3 bg-purple-950/70 hover:bg-pink-950/80 border border-yellow-500/40 rounded-2xl transition-all hover:scale-105 active:scale-95 text-center space-y-1">
                <span class="text-3xl block">🎁</span>
                <span class="text-[10px] text-yellow-300 font-bold block">กล่องที่ 1</span>
              </button>
              <button onclick="openLuckyBox(2)" class="p-3 bg-purple-950/70 hover:bg-pink-950/80 border border-yellow-500/40 rounded-2xl transition-all hover:scale-105 active:scale-95 text-center space-y-1">
                <span class="text-3xl block">🎁</span>
                <span class="text-[10px] text-yellow-300 font-bold block">กล่องที่ 2</span>
              </button>
              <button onclick="openLuckyBox(3)" class="p-3 bg-purple-950/70 hover:bg-pink-950/80 border border-yellow-500/40 rounded-2xl transition-all hover:scale-105 active:scale-95 text-center space-y-1">
                <span class="text-3xl block">🎁</span>
                <span class="text-[10px] text-yellow-300 font-bold block">กล่องที่ 3</span>
              </button>
            </div>
          </div>
        </div>

        <!-- GAME 2: Couples Trivia Game -->
        <div id="game-view-trivia" class="hidden space-y-4 pt-1 text-left">
          <div class="flex items-center justify-between border-b border-purple-500/30 pb-2">
            <span class="text-xs font-bold text-pink-300 font-cute">
              คำถามทบทวนความทรงจำรัก
            </span>
            <span id="trivia-step-badge" class="text-xs text-yellow-300 font-mono font-bold bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-500/30">
              ข้อ 1 / 3
            </span>
          </div>

          <div class="space-y-3">
            <p id="trivia-question-text" class="text-xs sm:text-sm font-bold text-white font-cute leading-relaxed"></p>
            <div id="trivia-options-box" class="space-y-2"></div>
          </div>
        </div>

        <!-- GAME 3: Memory Card Matching & Jigsaw Puzzle Game -->
        <div id="game-view-memory" class="hidden space-y-4 pt-1">
          
          <!-- Phase 1: Match 1 Pair -->
          <div id="memory-phase-cards" class="space-y-3">
            <div class="flex items-center justify-between border-b border-purple-500/30 pb-2">
              <span class="text-xs font-bold text-pink-300 font-cute">
                สเต็ป 1: พลิกการ์ดจับคู่รูปภาพ
              </span>
              <span class="text-[11px] text-yellow-300 font-mono font-bold bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                หาคู่ตรงกัน 1 คู่ 🎯
              </span>
            </div>
            <p class="text-xs text-pink-200/90 font-cute">
              🃏 พลิกหาคู่รูปภาพที่เหมือนกัน 1 คู่ เพื่อปลดล็อกรูปนำไปต่อจิ๊กซอว์! 💕
            </p>
            <div id="memory-grid" class="grid grid-cols-4 gap-2.5 max-w-[320px] mx-auto">
              <!-- Rendered dynamically -->
            </div>
          </div>

          <!-- Phase 2: Jigsaw Puzzle -->
          <div id="memory-phase-jigsaw" class="hidden space-y-3 animate-fade-in">
            <div class="flex items-center justify-between border-b border-purple-500/30 pb-2">
              <div class="flex items-center space-x-1.5">
                <span class="text-sm">🧩</span>
                <span class="text-xs font-bold text-pink-300 font-cute">
                  สเต็ป 2: ต่อจิ๊กซอว์ความทรงจำ
                </span>
              </div>
              <span id="jigsaw-correct-badge" class="text-[11px] text-yellow-300 font-mono font-bold bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                0 / 9 ชิ้น
              </span>
            </div>
            
            <p class="text-[11px] sm:text-xs text-pink-200/90 font-cute">
              แตะชิ้นส่วนที่ 1 แล้วแตะชิ้นส่วนที่ 2 เพื่อสลับตำแหน่งให้ถูกต้อง ✨
            </p>

            <!-- 3x3 Jigsaw Grid Board -->
            <div id="jigsaw-board" class="w-[260px] h-[260px] sm:w-[285px] sm:h-[285px] mx-auto grid grid-cols-3 gap-1.5 p-2 rounded-2xl bg-purple-950/80 border-2 border-pink-500/50 shadow-2xl transition-all duration-300">
              <!-- Rendered dynamically -->
            </div>

            <!-- Puzzle Controls -->
            <div class="flex items-center justify-center space-x-2 pt-1">
              <button onclick="openJigsawPreviewModal()" class="px-3 py-1.5 bg-purple-900/60 hover:bg-pink-900/70 border border-purple-500/40 hover:border-pink-500/60 text-purple-200 hover:text-white rounded-xl text-[11px] font-cute transition-all active:scale-95 flex items-center space-x-1 shadow">
                <span>🖼️</span>
                <span>ดูรูปตัวอย่าง</span>
              </button>
              <button onclick="reshuffleJigsaw()" class="px-3 py-1.5 bg-purple-900/60 hover:bg-pink-900/70 border border-purple-500/40 hover:border-pink-500/60 text-purple-200 hover:text-white rounded-xl text-[11px] font-cute transition-all active:scale-95 flex items-center space-x-1 shadow">
                <span>🔀</span>
                <span>สลับใหม่</span>
              </button>
              <button onclick="resetToMemoryCards()" class="px-3 py-1.5 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-300 hover:text-white rounded-xl text-[11px] font-cute transition-all active:scale-95 flex items-center space-x-1 shadow">
                <span>↺</span>
                <span>เลือกรูปอื่น</span>
              </button>
            </div>
          </div>

        </div>

        <!-- RED VELVET TRUEMONEY ANGPAO CARD -->
        <div id="truemoney-angpao-card" class="hidden red-angpao-card p-6 sm:p-7 rounded-3xl space-y-4 text-center shadow-2xl animate-fade-in border-2 border-yellow-400">
          
          <div class="space-y-1">
            <div class="inline-flex items-center space-x-1.5 px-3 py-1 bg-yellow-400/20 border border-yellow-400/50 rounded-full text-yellow-300 text-xs font-bold font-cute">
              <span>🧧</span>
              <span>ซองของขวัญ TrueMoney พิเศษ</span>
              <span>✨</span>
            </div>
            <h3 class="text-base sm:text-lg font-extrabold text-white font-cute pt-1">
              รางวัลคนเก่งของเค้า 💖
            </h3>
            <p class="text-xs text-yellow-200/90 font-cute">
              ${trueMoneyGiftConfig.note}
            </p>
          </div>

          <!-- Dynamic QR Code Container -->
          <div class="bg-white p-4 rounded-2xl w-[190px] h-[190px] mx-auto shadow-2xl flex flex-col items-center justify-center space-y-1 border-2 border-yellow-300">
            <img id="angpao-qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(trueMoneyGiftConfig.giftUrl)}" alt="TrueMoney Gift QR Code" class="w-full h-full object-contain" />
          </div>

          <div class="space-y-2">
            <!-- Action Button: Open TrueMoney Gift directly -->
            <button onclick="claimTrueMoneyGift()" class="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-red-950 font-extrabold text-xs sm:text-sm tracking-wide shadow-xl shadow-yellow-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 font-cute">
              <span>🧧</span>
              <span>กดรับเงินของขวัญทันที (เปิดแอป)</span>
              <span>➔</span>
            </button>

            <!-- Setting / Edit Button -->
            <div class="flex items-center justify-center space-x-4 pt-1 text-[11px] text-yellow-200/70">
              <span>สแกน QR ด้วยกล้องหรือแอปธนาคาร/TrueMoney</span>
              <button onclick="openTrueMoneySettingsModal()" class="underline hover:text-yellow-200" title="แก้ไขลิงก์ซองของขวัญ">
                ⚙️ ตั้งค่าซอง
              </button>
            </div>
          </div>

          <!-- Love Coupon -->
          <div class="bg-black/30 p-3 rounded-2xl border border-yellow-400/30 text-left text-xs text-yellow-100 font-cute space-y-1">
            <div class="flex justify-between items-center text-[10px] text-yellow-300 font-bold">
              <span>👑 SPECIAL LOVE COUPON</span>
              <span>No. 260269</span>
            </div>
            <p>แถมฟรีคูปอง: "ตามใจแฟน 1 วันเต็ม + บุฟเฟต์ของหวานไม่อั้น!" 🍨</p>
          </div>

        </div>

      </div>

      <!-- 6. ปุ่มรีเซ็ตล็อกหน้าจอใหม่ -->
      <div class="pt-2">
        <button onclick="handleLockScreenButton()" class="w-full bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-300 hover:text-white font-medium py-3.5 px-6 rounded-2xl text-xs tracking-wide transition-all active:scale-95 shadow-md flex items-center justify-center space-x-2">
          <span>↺</span>
          <span>ล็อกหน้าจออีกรอบ</span>
        </button>
      </div>

      <!-- Settings Modal for TrueMoney Gift URL -->
      <div id="truemoney-settings-modal" class="hidden fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onclick="closeTrueMoneySettingsModal()">
        <div class="max-w-md w-full neon-card p-6 sm:p-7 rounded-3xl space-y-4 text-left shadow-2xl border border-yellow-500/50" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between border-b border-purple-500/30 pb-3">
            <div class="flex items-center space-x-2">
              <span class="text-xl">⚙️</span>
              <h3 class="text-sm sm:text-base font-bold text-yellow-300 font-cute">
                ตั้งค่าลิงก์ซองของขวัญ TrueMoney
              </h3>
            </div>
            <button onclick="closeTrueMoneySettingsModal()" class="text-purple-300 hover:text-white text-xs bg-purple-900/60 px-3 py-1 rounded-full">
              ✕ ปิด
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <p class="text-purple-200/90 font-cute leading-relaxed">
              นำลิงก์ซองของขวัญที่สร้างจาก <b>TrueMoney Wallet</b> (เช่น https://gift.truemoney.com/campaign/?v=...) หรือพร้อมเพย์ มาวางตรงนี้ได้เลยค่ะ:
            </p>
            
            <div class="space-y-1">
              <label class="font-bold text-pink-300">ลิงก์ซองของขวัญ / PromptPay URL:</label>
              <input id="setting-tm-url" type="text" value="${trueMoneyGiftConfig.giftUrl}" class="w-full bg-purple-950 border border-purple-500/40 rounded-xl p-3 text-white font-mono text-xs focus:border-yellow-400 focus:outline-none" placeholder="https://gift.truemoney.com/campaign/?v=..." />
            </div>

            <div class="space-y-1">
              <label class="font-bold text-pink-300">ข้อความในการ์ด:</label>
              <input id="setting-tm-note" type="text" value="${trueMoneyGiftConfig.note}" class="w-full bg-purple-950 border border-purple-500/40 rounded-xl p-3 text-white font-cute text-xs focus:border-yellow-400 focus:outline-none" />
            </div>

            <button onclick="saveTrueMoneySettings()" class="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-red-950 font-bold rounded-xl text-xs transition-all shadow-md font-cute mt-2">
              💾 บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      </div>

      <!-- Photo Zoom Modal -->
      <div id="photo-zoom-modal" class="hidden fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onclick="closePhotoZoom()">
        <div class="max-w-md w-full bg-purple-950 p-4 rounded-3xl border border-pink-500/50 text-center space-y-3" onclick="event.stopPropagation()">
          <img id="zoom-modal-img" src="" class="w-full rounded-2xl max-h-[70vh] object-contain mx-auto" />
          <p id="zoom-modal-caption" class="text-xs text-pink-200 font-cute"></p>
          <button onclick="closePhotoZoom()" class="bg-pink-600 hover:bg-pink-500 text-white text-xs px-5 py-2 rounded-full font-semibold">
            ✕ ปิด
          </button>
        </div>
      </div>

      <!-- Jigsaw Original Preview Modal -->
      <div id="jigsaw-preview-modal" class="hidden fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onclick="closeJigsawPreviewModal()">
        <div class="max-w-xs w-full neon-card p-5 rounded-3xl border-2 border-pink-500/60 text-center space-y-3 shadow-2xl" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between border-b border-purple-500/30 pb-2">
            <span class="text-xs font-bold text-pink-300 font-cute">🖼️ รูปตัวอย่างจิ๊กซอว์</span>
            <button onclick="closeJigsawPreviewModal()" class="text-purple-300 hover:text-white text-xs bg-purple-900/60 px-2.5 py-0.5 rounded-full">✕</button>
          </div>
          <div class="w-52 h-52 sm:w-60 sm:h-60 mx-auto rounded-2xl overflow-hidden border-2 border-pink-400/80 shadow-lg">
            <img id="jigsaw-preview-img" src="" class="w-full h-full object-cover" alt="ตัวอย่างจิ๊กซอว์" />
          </div>
          <button onclick="closeJigsawPreviewModal()" class="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-cute text-xs rounded-xl font-bold shadow-md active:scale-95 transition-all">
            กลับไปต่อจิ๊กซอว์ ✨
          </button>
        </div>
      </div>

      <!-- Love Confirmation Modal ("เธอรักเค้ามั้ย?") -->
      <div id="love-confirm-modal" class="hidden fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="max-w-sm w-full neon-card p-6 sm:p-8 rounded-3xl space-y-5 text-center shadow-2xl border-2 border-pink-500/60 animate-fade-in relative" onclick="event.stopPropagation()">
          
          <div class="space-y-2">
            <div class="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg animate-pulse text-3xl">
              💖
            </div>
            <span class="text-[10px] font-mono font-bold tracking-[0.25em] text-pink-400 uppercase block pt-1">
              QUESTION FROM HEART
            </span>
            <h3 class="text-lg sm:text-xl font-extrabold text-white font-cute">
              ก่อนจะรับของขวัญ...
            </h3>
            <p class="text-sm sm:text-base text-pink-200 font-bold font-cute">
              "เธอรักเค้ามั้ยคะ?" 🥰💕
            </p>
          </div>

          <div class="space-y-3 pt-2">
            <!-- Option 1 -->
            <button onclick="confirmLoveAndRevealAngpao()" class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-lg shadow-pink-500/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 font-cute">
              <span>💖</span>
              <span>รักที่สุดในโลกเลยยย (รักมากกก)</span>
              <span>✨</span>
            </button>

            <!-- Option 2 -->
            <button id="tease-love-btn" onclick="teaseLoveButton()" onmouseover="teaseLoveHover()" class="w-full py-2.5 px-4 rounded-2xl bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 hover:text-pink-200 text-xs font-cute transition-all flex items-center justify-center space-x-1.5">
              <span>😝</span>
              <span id="tease-btn-text">ไม่รักหรอกก (แกล้งเฉยๆ)</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  `;

  window._onLockScreenAction = onLockScreenCallback;

  startLoveTimer();
  startTypewriter();
  setTimeout(() => initScratchCard(triggerWinAngpao), 50);
  initTriviaGame();
  initMemoryGame();
}

// Love Timer Counter
export function startLoveTimer() {
  const startDate = new Date('2026-02-26T09:38:00+07:00').getTime();
  if (loveTimerInterval) clearInterval(loveTimerInterval);

  function updateTimer() {
    const now = new Date().getTime();
    const diff = Math.max(0, now - startDate);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const dEl = document.getElementById('timer-days');
    const hEl = document.getElementById('timer-hours');
    const mEl = document.getElementById('timer-mins');
    const sEl = document.getElementById('timer-secs');

    if (dEl) dEl.innerText = String(days).padStart(2, '0');
    if (hEl) hEl.innerText = String(hours).padStart(2, '0');
    if (mEl) mEl.innerText = String(mins).padStart(2, '0');
    if (sEl) sEl.innerText = String(secs).padStart(2, '0');
  }

  updateTimer();
  loveTimerInterval = setInterval(updateTimer, 1000);
}

// Love Letter Typewriter
export function startTypewriter() {
  const el = document.getElementById('typewriter-text');
  if (!el) return;
  if (typewriterTimer) clearInterval(typewriterTimer);

  el.innerText = "";
  let i = 0;

  typewriterTimer = setInterval(() => {
    if (i < LOVE_LETTER_TEXT.length) {
      el.innerText += LOVE_LETTER_TEXT[i];
      i++;
    } else {
      clearInterval(typewriterTimer);
    }
  }, 35);
}

export function restartTypewriter() {
  playSound('tap');
  startTypewriter();
}

// Polaroid Controls
export function zoomCurrentPhoto() {
  playSound('tap');
  const modal = document.getElementById('photo-zoom-modal');
  const img = document.getElementById('zoom-modal-img');
  const cap = document.getElementById('zoom-modal-caption');
  const photo = PHOTO_ALBUM[currentPhotoIndex];

  if (img && photo) img.src = photo.url;
  if (cap && photo) cap.innerText = photo.caption;
  if (modal) modal.classList.remove('hidden');
}

export function closePhotoZoom() {
  const modal = document.getElementById('photo-zoom-modal');
  if (modal) modal.classList.add('hidden');
}

export function nextPhoto() {
  playSound('tap');
  currentPhotoIndex = (currentPhotoIndex + 1) % PHOTO_ALBUM.length;
  updatePolaroidCard();
}

export function prevPhoto() {
  playSound('tap');
  currentPhotoIndex = (currentPhotoIndex - 1 + PHOTO_ALBUM.length) % PHOTO_ALBUM.length;
  updatePolaroidCard();
}

export function updatePolaroidCard() {
  const photo = PHOTO_ALBUM[currentPhotoIndex];
  const img = document.getElementById('polaroid-img');
  const caption = document.getElementById('polaroid-caption');
  const indicator = document.getElementById('photo-indicator');

  if (img && photo) img.src = photo.url;
  if (caption && photo) caption.innerText = photo.caption;
  if (indicator) indicator.innerText = `${currentPhotoIndex + 1} / ${PHOTO_ALBUM.length}`;
}

// Mini-Game Switcher
export function switchGameTab(tabName) {
  playSound('tap');
  const tabs = ['scratch', 'trivia', 'memory'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-game-${t}`);
    const view = document.getElementById(`game-view-${t}`);
    if (t === tabName) {
      if (btn) {
        btn.className = "flex-1 py-2 px-2 rounded-xl transition-all font-bold bg-pink-600/80 text-white shadow-md";
      }
      if (view) view.classList.remove('hidden');
    } else {
      if (btn) {
        btn.className = "flex-1 py-2 px-2 rounded-xl transition-all font-bold text-purple-300 hover:text-white";
      }
      if (view) view.classList.add('hidden');
    }
  });

  if (tabName === 'scratch') {
    setTimeout(() => initScratchCard(triggerWinAngpao), 50);
  } else if (tabName === 'memory') {
    if (isMemoryPairMatched) {
      renderJigsawGrid();
    } else {
      renderMemoryGrid();
    }
  }
}

// TrueMoney Win & Reveal
export function triggerWinAngpao() {
  const confirmModal = document.getElementById('love-confirm-modal');
  if (confirmModal) {
    playSound('tap');
    confirmModal.classList.remove('hidden');
  } else {
    revealAngpaoCard();
  }
}

export function confirmLoveAndRevealAngpao() {
  const confirmModal = document.getElementById('love-confirm-modal');
  if (confirmModal) confirmModal.classList.add('hidden');
  revealAngpaoCard();
}

export function revealAngpaoCard() {
  playSound('gift');
  if (typeof confetti === 'function') {
    try {
      confetti({
        particleCount: 180,
        spread: 95,
        colors: ['#fbbf24', '#ef4444', '#ec4899', '#ffffff', '#f472b6'],
        origin: { y: 0.6 }
      });
    } catch(err) {}
  }
  const angpao = document.getElementById('truemoney-angpao-card');
  if (angpao) {
    angpao.classList.remove('hidden');
    setTimeout(() => {
      angpao.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }
  showToast("🎉 เค้าก็รักเธอที่สุดเหมือนกันนะคนดี! รับของขวัญไปเลยค่ะ 💕");
}

export function teaseLoveButton() {
  playSound('error');
  teaseCount++;
  const txt = document.getElementById('tease-btn-text');
  if (teaseCount === 1) {
    if (txt) txt.innerText = "แกล้งเฉยๆ จริงๆ รักมากกก 💕";
    showToast("🥺 ไม่รักเค้าจริงหรอ... กดปุ่มข้างบนเลยน้าา 💕");
  } else {
    confirmLoveAndRevealAngpao();
  }
}

export function teaseLoveHover() {
  const btn = document.getElementById('tease-love-btn');
  if (btn && teaseCount === 0) {
    btn.style.transform = `translateX(${Math.random() > 0.5 ? 12 : -12}px)`;
    setTimeout(() => { btn.style.transform = 'none'; }, 250);
  }
}

export function claimTrueMoneyGift() {
  playSound('gift');
  window.open(trueMoneyGiftConfig.giftUrl, '_blank');
}

export function openTrueMoneySettingsModal() {
  const modal = document.getElementById('truemoney-settings-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeTrueMoneySettingsModal() {
  const modal = document.getElementById('truemoney-settings-modal');
  if (modal) modal.classList.add('hidden');
}

export function saveTrueMoneySettings() {
  const urlInput = document.getElementById('setting-tm-url');
  const noteInput = document.getElementById('setting-tm-note');

  if (urlInput && urlInput.value.trim()) {
    trueMoneyGiftConfig.giftUrl = urlInput.value.trim();
    localStorage.setItem('tm_gift_url', trueMoneyGiftConfig.giftUrl);
  }
  if (noteInput && noteInput.value.trim()) {
    trueMoneyGiftConfig.note = noteInput.value.trim();
    localStorage.setItem('tm_note', trueMoneyGiftConfig.note);
  }

  const qr = document.getElementById('angpao-qr-img');
  if (qr) qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(trueMoneyGiftConfig.giftUrl)}`;

  playSound('success');
  showToast("💾 บันทึกลิงก์ซองของขวัญเรียบร้อยแล้วค่ะ 💕");
  closeTrueMoneySettingsModal();
}

export function handleLockScreenButton() {
  sessionStorage.clear();
  localStorage.removeItem('current_screen');
  playSound('tap');
  showToast("🔒 ล็อกกลับสู่หน้าใส่รหัสผ่านแล้วค่ะ");
  if (typeof window._onLockScreenAction === 'function') {
    window._onLockScreenAction();
  } else if (typeof window.navigateToPasscode === 'function') {
    window.navigateToPasscode();
  }
}

// Expose handlers globally for HTML inline event handlers
window.zoomCurrentPhoto = zoomCurrentPhoto;
window.closePhotoZoom = closePhotoZoom;
window.nextPhoto = nextPhoto;
window.prevPhoto = prevPhoto;
window.restartTypewriter = restartTypewriter;
window.switchGameTab = switchGameTab;
window.triggerWinAngpao = triggerWinAngpao;
window.confirmLoveAndRevealAngpao = confirmLoveAndRevealAngpao;
window.teaseLoveButton = teaseLoveButton;
window.teaseLoveHover = teaseLoveHover;
window.claimTrueMoneyGift = claimTrueMoneyGift;
window.openTrueMoneySettingsModal = openTrueMoneySettingsModal;
window.closeTrueMoneySettingsModal = closeTrueMoneySettingsModal;
window.saveTrueMoneySettings = saveTrueMoneySettings;
window.handleLockScreenButton = handleLockScreenButton;
