import './style.css'

const app = document.querySelector('#app');

// ==========================================
// Global State & Timers (Top-Level Initialization)
// ==========================================
let currentScreen = "passcode";
let currentMode = "anniversary";
let enteredPin = "";
let ytPlayer = null;
let currentTrackIndex = 0;
let isMusicPlaying = false;
let isYtReady = false;
let currentVolume = parseInt(localStorage.getItem('music_volume') || '30', 10);
let lastVolumeBeforeMute = 30;
let pendingUnlockIndex = null;

let isAwakened = false;
let isHolding = false;
let holdProgress = 0;
let holdTimer = null;
let holdDrainTimer = null;
let chargePercent = 0;
let decayTimer = null;
let isCompletedCharging = false;
let burstInterval = null;
let rapidHeartbeatInterval = null;
let anchoredHearts = [];

let currentPhotoIndex = 0;
let loveTimerInterval = null;
let typewriterTimer = null;

let isScratching = false;
let isScratchRevealed = false;
let currentTriviaStep = 0;
let shuffledMemory = [];
let flippedCards = [];
let matchedCount = 0;
let isMemoryPairMatched = false;
let currentJigsawPhoto = "/photos/photo_hotpot.jpg";
let currentJigsawState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
let selectedJigsawIndex = null;
let isJigsawCompleted = false;

// Countdown Lock Configuration (Target: 26 Feb 2026 09:38 AM GMT+7)
const ANNIVERSARY_TARGET_TIMESTAMP = new Date('2026-02-26T09:38:00+07:00').getTime();
let anniversaryCountdownInterval = null;
let isCountdownBypassed = localStorage.getItem('anniversary_countdown_bypassed') === 'true';

function isAnniversaryUnlocked() {
  if (isCountdownBypassed) return true;
  return Date.now() >= ANNIVERSARY_TARGET_TIMESTAMP;
}

// TrueMoney Config & State
const DEFAULT_TM_GIFT_URL = "https://gift.truemoney.com/campaign/?v=01a0396b59c3718f9061a743d30d4c79b4L";

let trueMoneyGiftConfig = {
  giftUrl: (localStorage.getItem('tm_gift_url') && !localStorage.getItem('tm_gift_url').includes('sampleGiftCode'))
    ? localStorage.getItem('tm_gift_url')
    : DEFAULT_TM_GIFT_URL,
  giftAmount: localStorage.getItem('tm_gift_amount') || "520",
  senderName: localStorage.getItem('tm_sender_name') || "เค้าเองคนดี",
  note: (localStorage.getItem('tm_note') && !localStorage.getItem('tm_note').includes('ของขวัช'))
    ? localStorage.getItem('tm_note')
    : "ของขวัญคนเก่ง เล่นเกมชนะรับเงินไปช้อปปิ้งนะคนดี 💕"
};
localStorage.setItem('tm_gift_url', trueMoneyGiftConfig.giftUrl);




// ==========================================
// 1. Web Audio SFX & Background Synthesizer
// ==========================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// ==========================================
// 1.5. Haptic Vibration Feedback Engine (ระบบสั่งการสั่นบนมือถือ)
// ==========================================
function triggerHaptic(type) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'tap' || type === 'tick') {
        navigator.vibrate(25); // สั่นเบาๆ 1 จังหวะ
      } else if (type === 'heartbeat') {
        navigator.vibrate([35, 45, 45]); // สั่นจังหวะ ตึก...ตัก (Lub-Dub)
      } else if (type === 'rapid_heartbeat') {
        navigator.vibrate([60, 35, 75]); // สั่นรัวแรงตอนหัวใจเต้นเต็ม 100%
      } else if (type === 'success') {
        navigator.vibrate([40, 50, 40, 50, 90]); // สั่นฉลองสำเร็จ
      } else if (type === 'error') {
        navigator.vibrate([70, 60, 80]); // สั่นเตือนผิดพลาด
      } else if (type === 'gift') {
        navigator.vibrate([50, 40, 60, 40, 100, 50, 140]); // สั่นฉลองซองของขวัญ
      } else if (Array.isArray(type) || typeof type === 'number') {
        navigator.vibrate(type);
      }
    } catch(err) {}
  }
}

function playSound(type, intensity = 1) {
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

// ==========================================
// 2. YouTube Music Playlist & Floating Player
// ==========================================
// ==========================================
// 2. YouTube Music Playlist & Quiz Unlock System
// ==========================================
const PLAYLIST = [
  {
    id: "leevExpA8ec",
    title: "คั่นกู (Ost. เพราะเราคู่กัน)",
    artist: "ไบร์ท วชิรวิชญ์",
    isUnlocked: true, // 🔓 เพลงเริ่มต้นล็อกเล่นเพลงเพราะคู่กันก่อน
    question: "เพลงที่เค้าเลือกให้มาในช่วงกุญแจลิงก์เพลงคืออะไร?",
    options: [
      "ตั้งใจรัก 💕",
      "คิดแต่ไม่ถึง 💭",
      "สายตาหลอกกันไม่ได้ 👀"
    ],
    answerIndex: 0
  },
  {
    id: "eKWSSHJ5d_I",
    title: "ตั้งใจรัก (happy accident)",
    artist: "พัด Vorapat x First Anuwat",
    isUnlocked: false,
    question: "เพลงที่เค้าเลือกให้มาในช่วงกุญแจลิงก์เพลงคืออะไร?",
    options: [
      "ตั้งใจรัก 💕",
      "คิดแต่ไม่ถึง 💭",
      "สายตาหลอกกันไม่ได้ 👀"
    ],
    answerIndex: 0
  },
  {
    id: "bvkIb4Pq5zA",
    title: "ที่รัก (เธอ)",
    artist: "เอก สุระเชษฐ์",
    isUnlocked: false,
    question: "เพลงที่เค้าเลือกให้มาในช่วงกุญแจลิงก์เพลงคืออะไร?",
    options: [
      "ตั้งใจรัก 💕",
      "คิดแต่ไม่ถึง 💭",
      "สายตาหลอกกันไม่ได้ 👀"
    ],
    answerIndex: 0
  },
  {
    id: "zj4dW3_2mgo",
    title: "วัดปะหล่ะ? (TEST ME)",
    artist: "4EVE",
    isUnlocked: false,
    question: "เพลงที่เค้าเลือกให้มาในช่วงกุญแจลิงก์เพลงคืออะไร?",
    options: [
      "ตั้งใจรัก 💕",
      "คิดแต่ไม่ถึง 💭",
      "สายตาหลอกกันไม่ได้ 👀"
    ],
    answerIndex: 0
  },
  {
    id: "3mYVyVY-lU4",
    title: "คู่ชีวิต",
    artist: "COCKTAIL",
    isUnlocked: false,
    question: "เพลงที่เค้าเลือกให้มาในช่วงกุญแจลิงก์เพลงคืออะไร?",
    options: [
      "ตั้งใจรัก 💕",
      "คิดแต่ไม่ถึง 💭",
      "สายตาหลอกกันไม่ได้ 👀"
    ],
    answerIndex: 0
  },
  {
    id: "3aCctY3DGac",
    title: "A ROCKET TO THE MOON",
    artist: "GAVIN.D",
    isUnlocked: false,
    question: "เพลงที่เค้าเลือกให้มาในช่วงกุญแจลิงก์เพลงคืออะไร?",
    options: [
      "ตั้งใจรัก 💕",
      "คิดแต่ไม่ถึง 💭",
      "สายตาหลอกกันไม่ได้ 👀"
    ],
    answerIndex: 0
  },
  {
    id: "QP6JyjYx_W0",
    title: "ดาวหางฮัลเลย์ (Halley's Comet)",
    artist: "fellow fellow",
    isUnlocked: false,
    question: "เพลงที่เค้าเลือกให้มาในช่วงกุญแจลิงก์เพลงคืออะไร?",
    options: [
      "ตั้งใจรัก 💕",
      "คิดแต่ไม่ถึง 💭",
      "สายตาหลอกกันไม่ได้ 👀"
    ],
    answerIndex: 0
  },
  {
    id: "XqQMisU5En8",
    title: "โต๊ะริม (melt)",
    artist: "NONT TANONT",
    isUnlocked: false,
    question: "เพลงที่เค้าเลือกให้มาในช่วงกุญแจลิงก์เพลงคืออะไร?",
    options: [
      "ตั้งใจรัก 💕",
      "คิดแต่ไม่ถึง 💭",
      "สายตาหลอกกันไม่ได้ 👀"
    ],
    answerIndex: 0
  },
  {
    id: "C-Edz_RXi8E",
    title: "สายตาหลอกกันไม่ได้ (Eyes don't lie)",
    artist: "INK WARUNTORN",
    isUnlocked: false,
    question: "เพลงที่เค้าเลือกให้มาในช่วงกุญแจลิงก์เพลงคืออะไร?",
    options: [
      "ตั้งใจรัก 💕",
      "คิดแต่ไม่ถึง 💭",
      "สายตาหลอกกันไม่ได้ 👀"
    ],
    answerIndex: 0
  },
  {
    id: "tYPIR8XWXFE",
    title: "รักแรก (First Love)",
    artist: "NONT TANONT",
    isUnlocked: false,
    question: "เพลงที่เค้าเลือกให้มาในช่วงกุญแจลิงก์เพลงคืออะไร?",
    options: [
      "ตั้งใจรัก 💕",
      "คิดแต่ไม่ถึง 💭",
      "สายตาหลอกกันไม่ได้ 👀"
    ],
    answerIndex: 0
  },
  {
    id: "Z-kcHxFeQsU",
    title: "ทุกนาทีที่สวยงาม (Always With Me)",
    artist: "NONT TANONT",
    isUnlocked: false,
    question: "เพลงที่เค้าเลือกให้มาในช่วงกุญแจลิงก์เพลงคืออะไร?",
    options: [
      "ตั้งใจรัก 💕",
      "คิดแต่ไม่ถึง 💭",
      "สายตาหลอกกันไม่ได้ 👀"
    ],
    answerIndex: 0
  },
  {
    id: "-tCPuOIeSHo",
    title: "พิง (Ost. กระเช้าสีดา)",
    artist: "NONT TANONT",
    isUnlocked: false,
    question: "เพลงที่เค้าเลือกให้มาในช่วงกุญแจลิงก์เพลงคืออะไร?",
    options: [
      "ตั้งใจรัก 💕",
      "คิดแต่ไม่ถึง 💭",
      "สายตาหลอกกันไม่ได้ 👀"
    ],
    answerIndex: 0
  }
];

// Dynamically load YouTube IFrame API
(function loadYtApi() {
  if (!window.YT) {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }
  }
})();

window.onYouTubeIframeAPIReady = function() {
  if (window.YT && window.YT.Player) {
    ytPlayer = new window.YT.Player('youtube-player', {
      height: '200',
      width: '200',
      videoId: PLAYLIST[currentTrackIndex].id,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0
      },
      events: {
        onReady: (event) => {
          isYtReady = true;
          try {
            if (typeof event.target.setVolume === 'function') {
              event.target.setVolume(currentVolume);
            }
            event.target.playVideo();
            isMusicPlaying = true;
            updateMusicUI();
          } catch(err) {}
        },
        onStateChange: (event) => {
          if (window.YT && event.data === window.YT.PlayerState.PLAYING) {
            isMusicPlaying = true;
            updateMusicUI();
          } else if (window.YT && event.data === window.YT.PlayerState.PAUSED) {
            isMusicPlaying = false;
            updateMusicUI();
          } else if (window.YT && event.data === window.YT.PlayerState.ENDED) {
            autoPlayNextUnlockedSong();
          }
        }
      }
    });
  }
};

// Global Autoplay on first touch/click anywhere on page
function tryAutoPlayMusic() {
  if (isMusicPlaying) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  if (ytPlayer && isYtReady && typeof ytPlayer.playVideo === 'function') {
    try {
      if (typeof ytPlayer.setVolume === 'function') {
        ytPlayer.setVolume(currentVolume);
      }
      ytPlayer.playVideo();
      isMusicPlaying = true;
      updateMusicUI();
    } catch(err) {}
  }
}

['pointerdown', 'touchstart', 'click', 'keydown'].forEach(evt => {
  window.addEventListener(evt, () => {
    tryAutoPlayMusic();
  }, { once: true, passive: true });
});


window.toggleMusic = function() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  if (!ytPlayer || !isYtReady) {
    showToast("⏳ กำลังโหลดระบบเครื่องเล่นเพลง...");
    return;
  }

  if (isMusicPlaying) {
    ytPlayer.pauseVideo();
    isMusicPlaying = false;
    showToast("⏸️ พักเสียงเพลง");
  } else {
    ytPlayer.playVideo();
    isMusicPlaying = true;
    showToast(`🎵 กำลังเล่น: ${PLAYLIST[currentTrackIndex].title} 💕`);
  }
  updateMusicUI();
};

window.nextSong = function() {
  const nextIdx = (currentTrackIndex + 1) % PLAYLIST.length;
  if (!PLAYLIST[nextIdx].isUnlocked) {
    openUnlockQuizModal(nextIdx);
  } else {
    currentTrackIndex = nextIdx;
    playCurrentTrack();
  }
};

window.prevSong = function() {
  const prevIdx = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
  if (!PLAYLIST[prevIdx].isUnlocked) {
    openUnlockQuizModal(prevIdx);
  } else {
    currentTrackIndex = prevIdx;
    playCurrentTrack();
  }
};

window.selectSong = function(index) {
  if (!PLAYLIST[index].isUnlocked) {
    openUnlockQuizModal(index);
  } else {
    currentTrackIndex = index;
    playCurrentTrack();
    closePlaylistModal();
  }
};

let isShuffleMode = false;
let isLoopMode = false;
let progressTrackerTimer = null;

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function startProgressTracker() {
  if (progressTrackerTimer) clearInterval(progressTrackerTimer);
  progressTrackerTimer = setInterval(() => {
    if (ytPlayer && isYtReady && typeof ytPlayer.getCurrentTime === 'function' && isMusicPlaying) {
      const current = ytPlayer.getCurrentTime() || 0;
      const duration = ytPlayer.getDuration() || 0;
      if (duration > 0) {
        const percent = Math.min(100, (current / duration) * 100);
        const bar = document.getElementById('aesthetic-progress-bar');
        const knob = document.getElementById('aesthetic-progress-knob');
        const curTimeEl = document.getElementById('aesthetic-current-time');
        const remTimeEl = document.getElementById('aesthetic-remain-time');

        if (bar) bar.style.width = `${percent}%`;
        if (knob) knob.style.left = `${percent}%`;
        if (curTimeEl) curTimeEl.innerText = formatTime(current);
        if (remTimeEl) remTimeEl.innerText = `-${formatTime(Math.max(0, duration - current))}`;
      }
    }
  }, 400);
}

window.seekAestheticMusic = function(e) {
  const track = document.getElementById('aesthetic-progress-track');
  if (!track || !ytPlayer || !isYtReady) return;
  const rect = track.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const fraction = Math.max(0, Math.min(1, clickX / rect.width));
  const duration = ytPlayer.getDuration() || 0;
  if (duration > 0) {
    ytPlayer.seekTo(duration * fraction, true);
  }
};

window.toggleShuffle = function() {
  isShuffleMode = !isShuffleMode;
  showToast(isShuffleMode ? "🔀 เปิดโหมดสุ่มเพลง" : "➡️ ปิดโหมดสุ่มเพลง");
  updateMusicUI();
};

window.toggleLoop = function() {
  isLoopMode = !isLoopMode;
  showToast(isLoopMode ? "🔁 เปิดโหมดวนซ้ำเพลงปัจจุบัน" : "➡️ ปิดโหมดวนซ้ำ");
  updateMusicUI();
};

window.openAestheticPlayerModal = function() {
  const modal = document.getElementById('aesthetic-player-modal');
  updateMusicUI();
  startProgressTracker();
  if (modal) modal.classList.remove('hidden');
};

window.closeAestheticPlayerModal = function() {
  const modal = document.getElementById('aesthetic-player-modal');
  if (modal) modal.classList.add('hidden');
};

function autoPlayNextUnlockedSong() {
  if (isLoopMode) {
    playCurrentTrack();
    return;
  }
  if (isShuffleMode) {
    const unlockedIndices = PLAYLIST.map((s, idx) => s.isUnlocked ? idx : -1).filter(idx => idx !== -1);
    if (unlockedIndices.length > 1) {
      const otherIndices = unlockedIndices.filter(idx => idx !== currentTrackIndex);
      currentTrackIndex = otherIndices[Math.floor(Math.random() * otherIndices.length)];
    }
    playCurrentTrack();
    return;
  }
  for (let offset = 1; offset < PLAYLIST.length; offset++) {
    const nextIdx = (currentTrackIndex + offset) % PLAYLIST.length;
    if (PLAYLIST[nextIdx].isUnlocked) {
      currentTrackIndex = nextIdx;
      playCurrentTrack();
      return;
    }
  }
  playCurrentTrack();
}

window.changeMusicVolume = function(val) {
  currentVolume = parseInt(val, 10);
  localStorage.setItem('music_volume', currentVolume);
  if (ytPlayer && isYtReady && typeof ytPlayer.setVolume === 'function') {
    ytPlayer.setVolume(currentVolume);
  }
  updateVolumeUI();
};

window.toggleMuteVolume = function() {
  if (currentVolume > 0) {
    lastVolumeBeforeMute = currentVolume;
    window.changeMusicVolume(0);
  } else {
    window.changeMusicVolume(lastVolumeBeforeMute || 30);
  }
};

function updateVolumeUI() {
  const icon = document.getElementById('volume-icon');
  const txt = document.getElementById('volume-text');
  const slider = document.getElementById('music-volume-slider');

  if (txt) txt.innerText = `${currentVolume}%`;
  if (slider) slider.value = currentVolume;

  if (icon) {
    if (currentVolume === 0) icon.innerText = '🔇';
    else if (currentVolume < 35) icon.innerText = '🔈';
    else if (currentVolume < 75) icon.innerText = '🔉';
    else icon.innerText = '🔊';
  }
}

function playCurrentTrack() {
  if (ytPlayer && isYtReady) {
    ytPlayer.loadVideoById(PLAYLIST[currentTrackIndex].id);
    if (typeof ytPlayer.setVolume === 'function') {
      ytPlayer.setVolume(currentVolume);
    }
    isMusicPlaying = true;
    showToast(`🎵 กำลังเล่น: ${PLAYLIST[currentTrackIndex].title} 💕`);
    startProgressTracker();
  }
  updateMusicUI();
  updateVolumeUI();
  renderPlaylistItems();
}

// Modal & Quiz Logic
window.openPlaylistModal = function() {
  const modal = document.getElementById('playlist-modal');
  renderPlaylistItems();
  if (modal) modal.classList.remove('hidden');
};

window.closePlaylistModal = function() {
  const modal = document.getElementById('playlist-modal');
  if (modal) modal.classList.add('hidden');
};

function renderPlaylistItems() {
  const listContainer = document.getElementById('playlist-items-container');
  if (!listContainer) return;

  listContainer.innerHTML = PLAYLIST.map((song, i) => `
    <div onclick="selectSong(${i})" class="p-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
      i === currentTrackIndex 
        ? 'bg-pink-950/85 border border-pink-500/70 shadow-lg shadow-pink-500/25 scale-[1.01]' 
        : song.isUnlocked 
          ? 'bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30' 
          : 'bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/40 opacity-80'
    }">
      <div class="flex items-center space-x-3 overflow-hidden">
        <span class="text-lg">
          ${song.isUnlocked 
            ? (i === currentTrackIndex && isMusicPlaying ? '💿' : '🎵') 
            : '🔒'}
        </span>
        <div class="truncate text-left">
          <p class="text-xs font-bold ${i === currentTrackIndex ? 'text-pink-300' : song.isUnlocked ? 'text-purple-100' : 'text-purple-300/60'} font-cute truncate">
            ${song.title}
          </p>
          <p class="text-[10px] text-purple-300/70 truncate">
            ${song.artist}
          </p>
        </div>
      </div>
      <div class="pl-2 shrink-0">
        ${i === currentTrackIndex 
          ? '<span class="text-[11px] text-pink-400 font-bold animate-pulse">กำลังเล่น</span>' 
          : song.isUnlocked 
            ? '<span class="text-xs text-purple-300">▶</span>' 
            : '<span class="text-[10px] bg-purple-900/70 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/30">ตอบคำถาม 🔑</span>'}
      </div>
    </div>
  `).join('');
}

window.openUnlockQuizModal = function(index) {
  pendingUnlockIndex = index;
  const song = PLAYLIST[index];
  const modal = document.getElementById('unlock-quiz-modal');
  const title = document.getElementById('quiz-song-title');
  const artist = document.getElementById('quiz-song-artist');
  const question = document.getElementById('quiz-song-question');
  const optionsBox = document.getElementById('quiz-options-box');

  if (title) title.innerText = song.title;
  if (artist) artist.innerText = song.artist;
  if (question) question.innerText = song.question;

  if (optionsBox) {
    optionsBox.innerHTML = song.options.map((opt, optIdx) => `
      <button onclick="submitQuizAnswer(${optIdx})" class="w-full text-left p-3.5 bg-purple-950/80 hover:bg-pink-950/90 border border-purple-500/40 hover:border-pink-500/70 text-purple-100 hover:text-pink-200 text-xs rounded-2xl transition-all active:scale-95 shadow-md flex items-center justify-between space-x-2 font-cute">
        <span>${opt}</span>
        <span class="text-pink-400 opacity-60">💖</span>
      </button>
    `).join('');
  }

  if (modal) modal.classList.remove('hidden');
};

window.closeUnlockQuizModal = function() {
  const modal = document.getElementById('unlock-quiz-modal');
  if (modal) modal.classList.add('hidden');
  pendingUnlockIndex = null;
};

window.submitQuizAnswer = function(chosenIndex) {
  if (pendingUnlockIndex === null) return;
  const song = PLAYLIST[pendingUnlockIndex];

  if (chosenIndex === 0) {
    playSound('success');
    // ปลดล็อกเพลงทั้งหมดในเพลย์ลิสต์
    PLAYLIST.forEach(s => s.isUnlocked = true);
    currentTrackIndex = pendingUnlockIndex;

    if (typeof confetti === 'function') {
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          colors: ['#ec4899', '#c084fc', '#fbbf24', '#f472b6'],
          origin: { y: 0.5 }
        });
      } catch(err) {}
    }

    showToast(`🎉 ตอบถูกแล้ว! "ตั้งใจรัก" ปลดล็อกเพลงทั้งหมดให้เธอแล้วนะ 💕`);
    closeUnlockQuizModal();
    playCurrentTrack();
    closePlaylistModal();
  } else {
    playSound('error');
    showToast("❌ ยังไม่ใช่น้าา คำตอบคือเพลงที่เค้าตั้งใจเลือกมาให้เธอนะคนดี 💕");
  }
};


function updateMusicUI() {
  const icon = document.getElementById('music-icon');
  const note = document.getElementById('music-notes');
  const btn = document.getElementById('floating-music-btn');
  const title = document.getElementById('current-song-title');
  const artist = document.getElementById('current-song-artist');
  const playBtnIcon = document.getElementById('player-play-icon');
  const aestheticTitle = document.getElementById('aesthetic-song-title');
  const aestheticArtist = document.getElementById('aesthetic-song-artist');
  const aestheticPlayBtn = document.getElementById('aesthetic-play-btn-icon');
  const shuffleBtn = document.getElementById('aesthetic-shuffle-btn');
  const loopBtn = document.getElementById('aesthetic-loop-btn');

  const curSong = PLAYLIST[currentTrackIndex];

  if (title) title.innerText = curSong.title;
  if (artist) artist.innerText = curSong.artist;
  if (playBtnIcon) {
    playBtnIcon.innerHTML = isMusicPlaying 
      ? `<svg class="w-4 h-4 fill-current text-[#5c2035]" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
      : `<svg class="w-4 h-4 fill-current text-[#5c2035]" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
  }

  if (aestheticTitle) aestheticTitle.innerText = curSong.title;
  if (aestheticArtist) aestheticArtist.innerText = curSong.artist;
  if (aestheticPlayBtn) {
    aestheticPlayBtn.innerHTML = isMusicPlaying 
      ? `<svg class="w-6 h-6 fill-current text-[#5c2035]" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
      : `<svg class="w-6 h-6 fill-current text-[#5c2035]" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
  }

  if (shuffleBtn) shuffleBtn.style.opacity = isShuffleMode ? "1" : "0.5";
  if (loopBtn) loopBtn.style.opacity = isLoopMode ? "1" : "0.5";

  if (isMusicPlaying) {
    if (btn) {
      btn.classList.add('border-[#ec4899]', 'shadow-lg', 'shadow-pink-500/50');
      btn.classList.remove('border-[#5c2035]/20');
    }
    if (icon) icon.className = "w-6 h-6 flex items-center justify-center flower-gentle-breathe";
    if (note) note.classList.remove('hidden');
  } else {
    if (btn) {
      btn.classList.remove('border-[#ec4899]', 'shadow-lg', 'shadow-pink-500/50');
      btn.classList.add('border-[#5c2035]/20');
    }
    if (icon) icon.className = "w-6 h-6 flex items-center justify-center";
    if (note) note.classList.add('hidden');
  }
}


function showToast(msg) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'fixed bottom-5 left-1/2 -translate-x-1/2 bg-purple-950/90 border border-pink-500/50 text-pink-200 text-xs px-4 py-2 rounded-full shadow-2xl z-50 transition-all duration-300 pointer-events-none opacity-0';
    document.body.appendChild(toast);
  }
  toast.innerText = msg;
  toast.classList.remove('opacity-0');
  toast.classList.add('opacity-100');
  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0');
  }, 2600);
}

function getFloatingMusicButtonHtml() {
  return `
    <div class="fixed bottom-4 right-4 z-50 flex items-center space-x-2.5 select-none">
      <!-- Pastel Rose Floating Controls Bar (ตรงตามโทนสีในภาพตัวอย่าง 100%) -->
      <div class="bg-[#f7d6df] border border-[#5c2035]/20 rounded-full px-3.5 py-1.5 shadow-2xl shadow-pink-500/20 backdrop-blur-md flex items-center space-x-2.5 text-xs text-[#5c2035]">
        <!-- Prev Button -->
        <button onclick="prevSong()" class="p-1 hover:scale-110 active:scale-90 transition-transform text-[#5c2035]" title="เพลงก่อนหน้า">
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
        </button>

        <!-- Play/Pause Button -->
        <button onclick="toggleMusic()" class="p-1 hover:scale-110 active:scale-90 transition-transform text-[#5c2035]" title="เล่น/หยุด">
          <span id="player-play-icon">
            ${isMusicPlaying 
              ? `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
              : `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`}
          </span>
        </button>

        <!-- Next Button -->
        <button onclick="nextSong()" class="p-1 hover:scale-110 active:scale-90 transition-transform text-[#5c2035]" title="เพลงถัดไป">
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
        </button>
        
        <!-- Song Info (Click to open full flower player) -->
        <div onclick="openAestheticPlayerModal()" class="cursor-pointer max-w-[110px] sm:max-w-[160px] overflow-hidden whitespace-nowrap text-left px-2 border-l border-[#5c2035]/20 hover:opacity-80 transition-opacity" title="แตะเพื่อเปิดเครื่องเล่นเพลงดอกไม้ 🌸">
          <p id="current-song-title" class="text-[#5c2035] font-bold font-cute truncate text-[11px] sm:text-xs">
            ${PLAYLIST[currentTrackIndex].title}
          </p>
          <p id="current-song-artist" class="text-[#5c2035]/70 text-[9px] sm:text-[10px] truncate">
            ${PLAYLIST[currentTrackIndex].artist}
          </p>
        </div>

        <!-- Playlist Button -->
        <button onclick="openPlaylistModal()" class="p-1.5 bg-[#5c2035]/10 hover:bg-[#5c2035]/25 rounded-full text-[#5c2035] transition-transform active:scale-90 text-[11px]" title="ดูเพลย์ลิสต์">
          📑
        </button>
      </div>

      <!-- Blooming Pink Flower Floating Button (Opens Pastel Flower Player) -->
      <button id="floating-music-btn" onclick="openAestheticPlayerModal()" class="relative p-2.5 bg-[#f7d6df] border-2 ${isMusicPlaying ? 'border-[#ec4899] shadow-lg shadow-pink-500/50' : 'border-[#5c2035]/20'} rounded-full text-[#5c2035] hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-2xl" title="เปิดการ์ดเพลงดอกไม้ 🌸">
        <span id="music-icon" class="w-6 h-6 flex items-center justify-center ${isMusicPlaying ? 'flower-gentle-breathe' : ''}">
          <svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-sm">
            <defs>
              <radialGradient id="btnPetalGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffffff" />
                <stop offset="65%" stop-color="#fbcfe8" />
                <stop offset="100%" stop-color="#f472b6" />
              </radialGradient>
              <radialGradient id="btnFlowerCenter" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#fef08a" />
                <stop offset="60%" stop-color="#eab308" />
                <stop offset="100%" stop-color="#9a3412" />
              </radialGradient>
            </defs>
            <g transform="translate(100, 100)">
              <path d="M 0,0 C -25,-40 -40,-80 0,-90 C 40,-80 25,-40 0,0 Z" fill="url(#btnPetalGrad)" opacity="0.96" />
              <path d="M 0,0 C -25,-40 -40,-80 0,-90 C 40,-80 25,-40 0,0 Z" fill="url(#btnPetalGrad)" opacity="0.96" transform="rotate(72)" />
              <path d="M 0,0 C -25,-40 -40,-80 0,-90 C 40,-80 25,-40 0,0 Z" fill="url(#btnPetalGrad)" opacity="0.96" transform="rotate(144)" />
              <path d="M 0,0 C -25,-40 -40,-80 0,-90 C 40,-80 25,-40 0,0 Z" fill="url(#btnPetalGrad)" opacity="0.96" transform="rotate(216)" />
              <path d="M 0,0 C -25,-40 -40,-80 0,-90 C 40,-80 25,-40 0,0 Z" fill="url(#btnPetalGrad)" opacity="0.96" transform="rotate(288)" />
              <circle cx="0" cy="0" r="14" fill="url(#btnFlowerCenter)" />
            </g>
          </svg>
        </span>
        <span id="music-notes" class="${isMusicPlaying ? '' : 'hidden'} absolute -top-1 -left-1 text-[10px] animate-ping">
          ✨
        </span>
      </button>
    </div>


    <!-- Pastel Rose Aesthetic Music Player Modal (ตรงตามภาพตัวอย่าง 100%) -->
    <div id="aesthetic-player-modal" class="hidden fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4" onclick="closeAestheticPlayerModal()">
      <div class="relative max-w-[320px] sm:max-w-[340px] w-full aesthetic-music-card space-y-4 text-center select-none" onclick="event.stopPropagation()">
        
        <!-- Close Button -->
        <button onclick="closeAestheticPlayerModal()" class="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#5c2035]/15 hover:bg-[#5c2035]/30 text-[#5c2035] flex items-center justify-center text-xs font-bold transition-all">
          ✕
        </button>

        <!-- 1. Artwork / Blooming Pink Flower Box -->
        <div class="aesthetic-artwork-box">
          <svg viewBox="0 0 200 200" class="w-[78%] h-[78%] drop-shadow-md flower-gentle-breathe">
            <defs>
              <radialGradient id="petalGradA" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffffff" />
                <stop offset="65%" stop-color="#fbcfe8" />
                <stop offset="100%" stop-color="#f472b6" />
              </radialGradient>
              <radialGradient id="flowerCenterA" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#fef08a" />
                <stop offset="60%" stop-color="#eab308" />
                <stop offset="100%" stop-color="#9a3412" />
              </radialGradient>
            </defs>
            <g transform="translate(100, 100)">
              <path d="M 0,0 C -25,-40 -40,-80 0,-90 C 40,-80 25,-40 0,0 Z" fill="url(#petalGradA)" opacity="0.96" />
              <path d="M 0,0 C -25,-40 -40,-80 0,-90 C 40,-80 25,-40 0,0 Z" fill="url(#petalGradA)" opacity="0.96" transform="rotate(72)" />
              <path d="M 0,0 C -25,-40 -40,-80 0,-90 C 40,-80 25,-40 0,0 Z" fill="url(#petalGradA)" opacity="0.96" transform="rotate(144)" />
              <path d="M 0,0 C -25,-40 -40,-80 0,-90 C 40,-80 25,-40 0,0 Z" fill="url(#petalGradA)" opacity="0.96" transform="rotate(216)" />
              <path d="M 0,0 C -25,-40 -40,-80 0,-90 C 40,-80 25,-40 0,0 Z" fill="url(#petalGradA)" opacity="0.96" transform="rotate(288)" />
              <circle cx="0" cy="0" r="13" fill="url(#flowerCenterA)" />
              <circle cx="-3" cy="-3" r="1.8" fill="#78350f" />
              <circle cx="3" cy="-3" r="1.8" fill="#78350f" />
              <circle cx="-3.5" cy="3" r="1.8" fill="#78350f" />
              <circle cx="3.5" cy="3" r="1.8" fill="#78350f" />
              <circle cx="0" cy="4" r="1.8" fill="#78350f" />
            </g>
          </svg>
        </div>

        <!-- Song Info -->
        <div class="space-y-0.5 px-2">
          <h4 id="aesthetic-song-title" class="text-sm sm:text-base font-bold text-[#5c2035] truncate font-cute">
            ${PLAYLIST[currentTrackIndex].title}
          </h4>
          <p id="aesthetic-song-artist" class="text-xs text-[#5c2035]/70 truncate font-cute">
            ${PLAYLIST[currentTrackIndex].artist}
          </p>
        </div>

        <!-- 2. Interactive Scrubber / Progress Bar -->
        <div class="space-y-1.5 pt-1 px-1">
          <div id="aesthetic-progress-track" class="relative w-full h-[5px] bg-[#ffffff]/60 rounded-full cursor-pointer" onclick="seekAestheticMusic(event)">
            <div id="aesthetic-progress-bar" class="absolute top-0 left-0 h-full bg-[#5c2035] rounded-full w-0 transition-all duration-150"></div>
            <div id="aesthetic-progress-knob" class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#5c2035] rounded-full shadow-md left-0 transition-all duration-150"></div>
          </div>
          
          <div class="flex justify-between items-center text-[10px] text-[#5c2035]/80 font-mono pt-0.5">
            <span id="aesthetic-current-time">0:00</span>
            <span id="aesthetic-remain-time">-0:00</span>
          </div>
        </div>

        <!-- 3. Controls Row (Shuffle, Prev, Play/Pause, Next, Repeat) -->
        <div class="flex items-center justify-between px-2 pt-2">
          <!-- Shuffle -->
          <button id="aesthetic-shuffle-btn" onclick="toggleShuffle()" class="aesthetic-control-btn text-base" title="สุ่มเพลง">
            🔀
          </button>
          
          <!-- Prev -->
          <button onclick="prevSong()" class="aesthetic-control-btn text-xl" title="เพลงก่อนหน้า">
            <svg class="w-6 h-6 fill-current text-[#5c2035]" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>

          <!-- Play / Pause -->
          <button onclick="toggleMusic()" class="aesthetic-control-btn w-12 h-12 rounded-full bg-[#5c2035]/10 hover:bg-[#5c2035]/20" title="เล่น/พัก">
            <span id="aesthetic-play-btn-icon">
              ${isMusicPlaying 
                ? `<svg class="w-6 h-6 fill-current text-[#5c2035]" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
                : `<svg class="w-6 h-6 fill-current text-[#5c2035]" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`}
            </span>
          </button>

          <!-- Next -->
          <button onclick="nextSong()" class="aesthetic-control-btn text-xl" title="เพลงถัดไป">
            <svg class="w-6 h-6 fill-current text-[#5c2035]" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>

          <!-- Repeat -->
          <button id="aesthetic-loop-btn" onclick="toggleLoop()" class="aesthetic-control-btn text-base" title="วนซ้ำ">
            🔁
          </button>
        </div>

        <!-- 4. Interactive Volume Slider (เบาเสียง/ดังเสียงตามใจผู้ฟัง) -->
        <div class="flex items-center space-x-2.5 px-3.5 py-2 bg-[#ffffff]/60 rounded-2xl">
          <button onclick="toggleMuteVolume()" class="text-sm text-[#5c2035] hover:scale-110 active:scale-90 transition-transform" title="เปิด/ปิดเสียง">
            <span id="volume-icon">${currentVolume === 0 ? '🔇' : currentVolume < 35 ? '🔈' : currentVolume < 75 ? '🔉' : '🔊'}</span>
          </button>
          <input 
            id="music-volume-slider" 
            type="range" 
            min="0" 
            max="100" 
            value="${currentVolume}" 
            oninput="changeMusicVolume(this.value)" 
            class="w-full accent-[#5c2035] h-1.5 bg-[#5c2035]/20 rounded-lg cursor-pointer transition-all" 
            title="ปรับระดับเสียงเพลง"
          />
          <span id="volume-text" class="text-[11px] font-mono font-bold text-[#5c2035] w-8 text-right">
            ${currentVolume}%
          </span>
        </div>

        <!-- Open Playlist Bar -->
        <div class="pt-1">
          <button onclick="openPlaylistModal()" class="w-full py-2 px-4 rounded-2xl bg-[#5c2035]/10 hover:bg-[#5c2035]/20 text-[#5c2035] text-xs font-bold flex items-center justify-center space-x-2 transition-all font-cute">
            <span>📑</span>
            <span>ดูรายชื่อเพลงทั้งหมด (${PLAYLIST.filter(s => s.isUnlocked).length}/${PLAYLIST.length} ปลดล็อกแล้ว)</span>
          </button>
        </div>

      </div>
    </div>

    <!-- Playlist Modal -->
    <div id="playlist-modal" class="hidden fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4" onclick="closePlaylistModal()">
      <div class="max-w-md w-full neon-card p-6 rounded-3xl space-y-4 text-left" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between border-b border-purple-500/30 pb-3">
          <div class="flex items-center space-x-2">
            <span class="text-xl">🎶</span>
            <h3 class="text-sm sm:text-base font-bold text-white font-cute">
              เพลงรักของเรา (Playlist)
            </h3>
          </div>
          <button onclick="closePlaylistModal()" class="text-purple-300 hover:text-white text-xs bg-purple-900/60 px-3 py-1 rounded-full">
            ✕ ปิด
          </button>
        </div>

        <div id="playlist-items-container" class="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          <!-- Dynamic Playlist Items -->
        </div>
      </div>
    </div>

    <!-- Unlock Music Quiz Modal -->
    <div id="unlock-quiz-modal" class="hidden fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onclick="closeUnlockQuizModal()">
      <div class="max-w-md w-full neon-card p-6 sm:p-7 rounded-3xl space-y-4 text-left shadow-2xl border border-pink-500/50" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between border-b border-purple-500/30 pb-3">
          <div class="flex items-center space-x-2">
            <span class="text-xl animate-bounce">🔑</span>
            <h3 class="text-sm sm:text-base font-bold text-pink-300 font-cute">
              ตอบคำถามปลดล็อกเพลงรัก
            </h3>
          </div>
          <button onclick="closeUnlockQuizModal()" class="text-purple-300 hover:text-white text-xs bg-purple-900/60 px-3 py-1 rounded-full">
            ✕ ปิด
          </button>
        </div>

        <div class="bg-purple-950/70 p-3.5 rounded-2xl border border-purple-500/30 space-y-1">
          <p id="quiz-song-title" class="text-xs sm:text-sm font-bold text-white font-cute"></p>
          <p id="quiz-song-artist" class="text-[11px] text-pink-300/80"></p>
        </div>

        <div class="space-y-2 pt-1">
          <p class="text-xs text-purple-200 font-medium font-cute">
            ❓ คำถาม: <span id="quiz-song-question" class="text-pink-200 font-bold"></span>
          </p>
          <div id="quiz-options-box" class="space-y-2 pt-2">
            <!-- Options dynamically rendered -->
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 3. Question Modes & Passcodes Database
// ==========================================

const MODES = {
  anniversary: {
    id: "anniversary",
    index: 1,
    title: "วันครบรอบของเรา",
    icon: "💖",
    question: "วันที่เราเริ่มคบกันคือวันไหน?",
    code: "260269",
    hint: "รหัสคือ <b>วันครบรอบของเราสองคน</b><br>วันที่เราตกลงเป็นแฟนกันน้าา (วัน/เดือน/ปี 6 หลัก) 💕"
  },
  birthday: {
    id: "birthday",
    index: 2,
    title: "วันเกิดเค้า",
    icon: "🎂",
    question: "วันเกิดเค้าคือวันไหน จำได้ไหมนะ?",
    code: "301150",
    hint: "รหัสคือ <b>วันเกิดของเค้าเอง</b><br>วัน/เดือน/ปีเกิดของเค้า (6 หลัก) 🎂"
  },
  activity: {
    id: "activity",
    index: 3,
    title: "วันที่เค้าหลอกเธอไปทำกิจกรรม",
    icon: "🎬",
    question: "วันที่เค้าหลอกเธอไปทำกิจกรรมคือวันไหน?",
    code: "140269",
    hint: "รหัสคือ <b>วันที่เค้าหลอกเธอไปทำกิจกรรมด้วยกัน</b><br>วัน/เดือน/ปี (6 หลัก) 🎬"
  }
};

// ==========================================
// 3.5. SCREEN 0: Countdown Lock Screen (Until Anniversary Time)
// ==========================================

function renderAnniversaryCountdownScreen() {
  currentScreen = "countdown";
  localStorage.setItem('current_screen', 'countdown');

  if (holdTimer) { clearInterval(holdTimer); holdTimer = null; }
  if (holdDrainTimer) { clearInterval(holdDrainTimer); holdDrainTimer = null; }
  if (decayTimer) { clearInterval(decayTimer); decayTimer = null; }
  if (loveTimerInterval) { clearInterval(loveTimerInterval); loveTimerInterval = null; }
  if (typewriterTimer) { clearInterval(typewriterTimer); typewriterTimer = null; }
  if (anniversaryCountdownInterval) { clearInterval(anniversaryCountdownInterval); anniversaryCountdownInterval = null; }

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
          <input id="bypass-input-pin" type="password" maxlength="6" class="w-full bg-purple-950 border border-pink-500/50 rounded-xl p-2.5 text-center text-white tracking-widest font-mono text-sm focus:outline-none focus:border-yellow-400" placeholder="••••••" />
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
        renderPasscodeScreen();
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

window.openCountdownBypassModal = function() {
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
};

window.closeCountdownBypassModal = function() {
  const modal = document.getElementById('cd-bypass-modal');
  if (modal) modal.classList.add('hidden');
};

window.confirmCountdownBypass = function() {
  const input = document.getElementById('bypass-input-pin');
  if (input && input.value.trim() === '260269') {
    isCountdownBypassed = true;
    localStorage.setItem('anniversary_countdown_bypassed', 'true');
    playSound('success');
    showToast("✨ ปลดล็อกดูตัวอย่างล่วงหน้าสำเร็จแล้วค่ะ 💕");
    closeCountdownBypassModal();
    if (anniversaryCountdownInterval) clearInterval(anniversaryCountdownInterval);
    renderPasscodeScreen();
  } else {
    playSound('error');
    showToast("❌ รหัสผ่านไม่ถูกต้องค่ะ");
  }
};

// ==========================================
// 4. SCREEN 1: Passcode Screen (Velvet Lock Style)
// ==========================================

function renderPasscodeScreen() {
  currentScreen = "passcode";
  localStorage.setItem('current_screen', 'passcode');
  enteredPin = "";
  
  if (holdTimer) { clearInterval(holdTimer); holdTimer = null; }
  if (holdDrainTimer) { clearInterval(holdDrainTimer); holdDrainTimer = null; }
  if (decayTimer) { clearInterval(decayTimer); decayTimer = null; }
  if (loveTimerInterval) { clearInterval(loveTimerInterval); loveTimerInterval = null; }
  if (typewriterTimer) { clearInterval(typewriterTimer); typewriterTimer = null; }

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

  setupPinInput();
}

function setupPinInput() {
  const input = document.getElementById('native-pin-input');
  const box = document.getElementById('passcode-box');
  if (!input) return;

  input.value = enteredPin;
  setTimeout(() => input.focus(), 150);

  if (box) {
    box.addEventListener('click', (e) => {
      // Don't focus if clicking buttons or modals
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
      setTimeout(verifyPasscode, 200);
    }
  });
}

window.addEventListener('keydown', (e) => {
  if (currentScreen !== "passcode") return;
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

function verifyPasscode() {
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

    setTimeout(renderAnniversaryScreen, 900);
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

window.showDontKnowHint = function() {
  playSound('tap');
  const modal = document.getElementById('modal-container');
  const targetMode = MODES[currentMode] || MODES.anniversary;

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
};

window.showForgotModal = function() {
  playSound('tap');
  const modal = document.getElementById('modal-container');
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
};

window.changeMode = function(modeKey) {
  closeModal();
  currentMode = modeKey;
  renderPasscodeScreen();
};

window.closeModalAndFocus = function() {
  closeModal();
  const input = document.getElementById('native-pin-input');
  if (input) setTimeout(() => input.focus(), 100);
};

window.closeModal = function() {
  const modal = document.getElementById('modal-container');
  if (modal) modal.classList.add('hidden');
};

// ==========================================
// 5. SCREEN 2: Happy Anniversary (Exact Layout Match)
// Stage 1: Hold 5s on static gray heart -> Draws neon purple outline
// Stage 2: Rapid-Tap to charge -> Auto advance on 100% (with 3s hold)
// ==========================================

function renderAnniversaryScreen() {
  currentScreen = "charging";
  localStorage.setItem('current_screen', 'charging');
  isAwakened = false;
  isHolding = false;
  holdProgress = 0;
  chargePercent = 0;
  isCompletedCharging = false;

  if (holdTimer) clearInterval(holdTimer);
  if (holdDrainTimer) clearInterval(holdDrainTimer);
  if (decayTimer) clearInterval(decayTimer);
  if (rapidHeartbeatInterval) { clearInterval(rapidHeartbeatInterval); rapidHeartbeatInterval = null; }

  app.innerHTML = `
    ${getFloatingMusicButtonHtml()}

    <!-- Horizontal Landscape Rounded Card Container (กรอบสี่เหลี่ยมแนวนอนกว้างพอดี) -->
    <div class="relative w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto p-6 sm:p-10 md:p-12 neon-card text-center select-none transition-all duration-500 animate-fade-in flex flex-col items-center justify-between min-h-[460px] sm:min-h-[500px] my-auto">
      
      <!-- 1. Top Single-Line Glowing Neon Title (Happy Anniversary บรรทัดเดียวอยู่ในกรอบพอดี) -->
      <div class="pt-2 sm:pt-4 px-4 w-full flex justify-center items-center">
        <h1 class="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight whitespace-nowrap happy-anniversary-neon">
          Happy Anniversary
        </h1>
      </div>

      <!-- 2. Center Heart Container with Refined Heart Shape & Center Mini-Heart -->
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

            <!-- Center Mini Heart Icon (โทนม่วงอินดิโก้นิ่งสงบ #6366f1 → #8b5cf6) -->
            <path id="center-mini-heart"
                  d="M 50,42 C 50,42 46,36 41,36 C 36,36 34,40 34,45 C 34,52 40,59 50,65 C 60,59 66,52 66,45 C 66,40 64,36 59,36 C 54,36 50,42 50,42 Z"
                  fill="url(#miniHeartGrad)"
                  style="filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.6));"
                  class="transition-all duration-300 pointer-events-none" />

            <!-- Base Visible Neon Heart Outline (โทนม่วงอินดิโก้นิ่งสงบ) -->
            <path d="M 50,24 C 50,24 38,10 24,10 C 12,10 6,22 6,36 C 6,56 24,74 50,92 C 76,74 94,56 94,36 C 94,22 88,10 76,10 C 62,10 50,24 50,24 Z"
                  fill="none" 
                  stroke="rgba(139, 92, 246, 0.45)" 
                  stroke-width="5" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"
                  style="filter: drop-shadow(0 0 6px rgba(139, 92, 246, 0.35));" />

            <!-- Structural Reference Path (Hidden line, replaced by anchored hearts effect) -->
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
}

function spawnAnchoredHeart(progress, totalLen, outline) {
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


function emit45DegreeHearts() {
  const particleGroup = document.getElementById('heart-particle-layer');
  if (!particleGroup) return;

  // คำนวณองศาและพิกัดจุดชนเส้นขอบหัวใจดวงใหญ่ด้านนอกแยกกันอย่างแม่นยำ (SVG 100x100 space)
  const separateTrajectories = [
    { name: 'top-right-lobe',  x: 74, y: 24, scale: 0.36 }, // มุมบนขวา 45° (ชนขอบโค้งมนบนขวา)
    { name: 'bottom-right-v',  x: 68, y: 66, scale: 0.36 }, // มุมล่างขวา 135° (ชนขอบเส้นตรง V ขวา)
    { name: 'bottom-tip',      x: 50, y: 92, scale: 0.38 }, // ปลายแหลมล่าง (ชนมุมแหลมล่างสุด)
    { name: 'bottom-left-v',   x: 32, y: 66, scale: 0.36 }, // มุมล่างซ้าย 225° (ชนขอบเส้นตรง V ซ้าย)
    { name: 'top-left-lobe',   x: 26, y: 24, scale: 0.36 }, // มุมบนซ้าย 315° (ชนขอบโค้งมนบนซ้าย)
    { name: 'top-notch',       x: 50, y: 24, scale: 0.34 }  // รอยเว้าบน (ชนรอยเว้ากลางบนสุด)
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
      // พุ่งไปชนขอบเส้นหัวใจดวงใหญ่พอดีเป๊ะ
      heart.setAttribute('transform', `translate(${t.x}, ${t.y}) scale(${t.scale})`);
      setTimeout(() => {
        heart.setAttribute('opacity', '0');
        setTimeout(() => heart.remove(), 250);
      }, 350);
    });
  });
}


// Stage 1: Pointer Down (Hold or Tap)
window.onHeartPointerDown = function(e) {
  if (isCompletedCharging) return;

  if (e && e.target && e.target.setPointerCapture && e.pointerId) {
    try { e.target.setPointerCapture(e.pointerId); } catch(err) {}
  }

  if (isAwakened) {
    tapHeartCharge(e);
  } else {
    startHoldToAwaken();
  }
};

// Stage 1: Pointer Up / Cancel
window.onHeartPointerUp = function(e) {
  if (e && e.target && e.target.releasePointerCapture && e.pointerId) {
    try { e.target.releasePointerCapture(e.pointerId); } catch(err) {}
  }

  if (!isAwakened && isHolding) {
    cancelHoldToAwaken();
  }
};

function startHoldToAwaken() {
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
      awakenHeart();
    }
  }, 50);
}

function cancelHoldToAwaken() {
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

  if (holdDrainTimer) clearInterval(holdDrainTimer);

  holdDrainTimer = setInterval(() => {
    if (isHolding || isAwakened) {
      clearInterval(holdDrainTimer);
      holdDrainTimer = null;
      return;
    }

    holdProgress = Math.max(0, holdProgress - 2.5);
    const fraction = holdProgress / 100;

    if (outline) {
      const offset = totalLen * (1 - fraction);
      outline.style.strokeDashoffset = `${offset}px`;
    }

    anchoredHearts = anchoredHearts.filter(h => {
      if (parseFloat(h.dataset.progress) > holdProgress) {
        h.setAttribute('opacity', '0');
        setTimeout(() => h.remove(), 200);
        return false;
      }
      return true;
    });

    if (holdProgress <= 0) {
      clearInterval(holdDrainTimer);
      holdDrainTimer = null;
      if (container) {
        container.classList.remove('heart-holding');
        container.classList.add('heart-static-gray');
      }
    }
  }, 30);
}


// Awaken Animation Complete: Full Purple Heart Awakened
function awakenHeart() {
  isAwakened = true;
  isHolding = false;

  playSound('success');

  anchoredHearts.forEach(h => {
    h.setAttribute('style', 'filter: drop-shadow(0 0 10px #c084fc); transition: transform 0.5s ease, opacity 0.5s ease;');
    h.setAttribute('transform', h.getAttribute('transform') + ' scale(1.3)');
    h.setAttribute('opacity', '0');
    setTimeout(() => h.remove(), 500);
  });
  anchoredHearts = [];

  const container = document.getElementById('heart-container');

  const outline = document.getElementById('heart-outline');
  const liquid = document.getElementById('heart-liquid');
  const instructionText = document.getElementById('instruction-text');

  if (typeof confetti === 'function') {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        colors: ['#c084fc', '#a855f7', '#ec4899', '#ffffff'],
        origin: { y: 0.6 }
      });
    } catch(err) {}
  }

  if (outline) {
    outline.style.strokeDashoffset = '0px';
    outline.style.filter = 'drop-shadow(0 0 12px #c084fc) drop-shadow(0 0 25px #ec4899)';
  }

  if (container) {
    container.className = "relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center cursor-pointer select-none transition-all duration-300 heart-glow animate-pulse";
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

// Stage 2: Rapid-Tap Decay Loop
function startDecayLoop() {
  if (decayTimer) clearInterval(decayTimer);

  decayTimer = setInterval(() => {
    if (isCompletedCharging || !isAwakened) return;
    
    if (chargePercent > 0) {
      chargePercent = Math.max(0, chargePercent - 1.2);
      updateHeartDisplay();
    }
  }, 100);
}

function tapHeartCharge(e) {
  if (isCompletedCharging || !isAwakened) return;

  chargePercent = Math.min(100, chargePercent + 5);
  
  // Heartbeat sound scales in pitch and intensity as the heart charges up
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

function spawnHeartParticle(e) {
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

function updateHeartDisplay() {
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

function onChargeComplete() {
  const instructionText = document.getElementById('instruction-text');
  const container = document.getElementById('heart-container');
  const svg = document.getElementById('svg-heart');

  // Add intense overload pulsing vibration
  if (container) container.classList.add('heart-overload-pulse');
  if (svg) svg.classList.add('heart-overload-pulse');

  if (instructionText) {
    instructionText.innerText = "💓 ตึกตัก! ตึกตัก! ตึกตัก! หัวใจเต้นแรงที่สุดเพื่อเธอ 💕";
    instructionText.className = "text-xs sm:text-sm text-yellow-300 font-bold tracking-wide animate-pulse";
  }

  // Play intense rapid heartbeat audio & haptic vibration loop (~160 BPM) for the full 3s celebration until next screen!
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
    if (typeof confetti === 'function' && currentScreen === 'charging') {
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
    renderSurprisePage();
  }, 3000);
}

// ==========================================
// 6. SCREEN 3: Surprise Page
// ==========================================
const PHOTO_ALBUM = [
  {
    url: "/photos/photo1.jpg",
    caption: "จุดเริ่มต้นความทรงจำที่น่ารักตั้งแต่เด็กๆ จนถึงวันนี้ 👧👦💕",
    date: "Since Childhood"
  },
  {
    url: "/photos/photo_hotpot.jpg",
    caption: "มื้ออาหารที่อร่อยที่สุด เพราะมีคนพิเศษอย่างเธอนั่งกินด้วยกัน 🍲🔥✨",
    date: "Hotpot Date"
  },
  {
    url: "/photos/photo_bouquet.jpg",
    caption: "ช่อดอกไม้แทนความรู้สึกดีๆ ที่ตั้งใจมอบให้เธอคนเดียวเลยนะ 💐🌸",
    date: "Special Pastel Bouquet"
  },
  {
    url: "/photos/photo2.jpg",
    caption: "ไม่ว่าจะเดินทางไปที่ไหน แค่มีเธอข้างๆ ก็เป็นช่วงเวลาที่ดีที่สุด 🚗💖",
    date: "Sweet Moments"
  },
  {
    url: "/photos/photo5.jpg",
    caption: "พวงกุญแจเก็บเพลงและความทรงจำของเรา เก็บไว้ใกล้ใจตลอดไปนะคะ 💿⭐💖",
    date: "Forever in Memory"
  }
];



function renderSurprisePage() {
  currentScreen = "surprise";
  localStorage.setItem('current_screen', 'surprise');
  if (holdTimer) { clearInterval(holdTimer); holdTimer = null; }
  if (holdDrainTimer) { clearInterval(holdDrainTimer); holdDrainTimer = null; }
  if (decayTimer) { clearInterval(decayTimer); decayTimer = null; }

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

      <!-- 3. POLAROID MEMORIES (White Glowing Polaroid matching reference) -->
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

        <!-- RED VELVET TRUEMONEY ANGPAO CARD (เมื่อเล่นเกมชนะ / เปิดกล่องสำเร็จ) -->
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

            <!-- Subtle Setting / Edit Button -->
            <div class="flex items-center justify-center space-x-4 pt-1 text-[11px] text-yellow-200/70">
              <span>สแกน QR ด้วยกล้องหรือแอปธนาคาร/TrueMoney</span>
              <button onclick="openTrueMoneySettingsModal()" class="underline hover:text-yellow-200" title="แก้ไขลิงก์ซองของขวัญ">
                ⚙️ ตั้งค่าซอง
              </button>
            </div>
          </div>

          <!-- Love Coupon also included -->
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

      <!-- Love Confirmation Modal ("เธอรักเค้ามั้ย?") Before Showing QR Code -->
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
            <!-- Option 1: Love so much -->
            <button onclick="confirmLoveAndRevealAngpao()" class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-lg shadow-pink-500/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 font-cute">
              <span>💖</span>
              <span>รักที่สุดในโลกเลยยย (รักมากกก)</span>
              <span>✨</span>
            </button>

            <!-- Option 2: Playful / Tease Button -->
            <button id="tease-love-btn" onclick="teaseLoveButton()" onmouseover="teaseLoveHover()" class="w-full py-2.5 px-4 rounded-2xl bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 hover:text-pink-200 text-xs font-cute transition-all flex items-center justify-center space-x-1.5">
              <span>😝</span>
              <span id="tease-btn-text">ไม่รักหรอกก (แกล้งเฉยๆ)</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  `;

  startLoveTimer();
  startTypewriter();
  setTimeout(initScratchCard, 50);
  initTriviaGame();
  initMemoryGame();
}

window.handleLockScreenButton = function() {
  localStorage.removeItem('current_screen');
  playSound('tap');
  renderPasscodeScreen();
};

window.reLockToCountdown = function() {
  isCountdownBypassed = false;
  localStorage.removeItem('anniversary_countdown_bypassed');
  localStorage.setItem('current_screen', 'countdown');
  playSound('tap');
  showToast("⏳ ล็อกกลับสู่หน้านับถอยหลังแล้วค่ะ");
  renderAnniversaryCountdownScreen();
};

// Polaroid Photo Navigation & Zoom
window.zoomCurrentPhoto = function() {
  playSound('tap');
  const modal = document.getElementById('photo-zoom-modal');
  const img = document.getElementById('zoom-modal-img');
  const cap = document.getElementById('zoom-modal-caption');
  const photo = PHOTO_ALBUM[currentPhotoIndex];

  if (img) img.src = photo.url;
  if (cap) cap.innerText = photo.caption;
  if (modal) modal.classList.remove('hidden');
};

window.closePhotoZoom = function() {
  const modal = document.getElementById('photo-zoom-modal');
  if (modal) modal.classList.add('hidden');
};

window.nextPhoto = function() {
  playSound('tap');
  currentPhotoIndex = (currentPhotoIndex + 1) % PHOTO_ALBUM.length;
  updatePolaroidCard();
};

window.prevPhoto = function() {
  playSound('tap');
  currentPhotoIndex = (currentPhotoIndex - 1 + PHOTO_ALBUM.length) % PHOTO_ALBUM.length;
  updatePolaroidCard();
};

function updatePolaroidCard() {
  const photo = PHOTO_ALBUM[currentPhotoIndex];
  const img = document.getElementById('polaroid-img');
  const caption = document.getElementById('polaroid-caption');
  const indicator = document.getElementById('photo-indicator');

  if (img) img.src = photo.url;
  if (caption) caption.innerText = photo.caption;
  if (indicator) indicator.innerText = `${currentPhotoIndex + 1} / ${PHOTO_ALBUM.length}`;
}

// Love Timer Counter
function startLoveTimer() {
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
const LOVE_LETTER_TEXT = `สุขสันต์วันครบรอบนะคะคนเก่งของเค้า 💖
ขอบคุณสำหรับรอยยิ้ม ความน่ารัก และความอบอุ่นที่มีให้กันในทุกๆ วัน
ไม่ว่าจะผ่านเรื่องอะไรมา เค้าสัญญาว่าจะคอยอยู่เคียงข้าง และรักเธอเพิ่มขึ้นในทุกๆ วันนะ รักเธอที่สุดเลยค่ะ 🥰`;

function startTypewriter() {
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

window.restartTypewriter = function() {
  playSound('tap');
  startTypewriter();
};

// TrueMoney Actions
window.claimTrueMoneyGift = function() {
  playSound('gift');
  window.open(trueMoneyGiftConfig.giftUrl, '_blank');
};

window.openTrueMoneySettingsModal = function() {
  const modal = document.getElementById('truemoney-settings-modal');
  if (modal) modal.classList.remove('hidden');
};

window.closeTrueMoneySettingsModal = function() {
  const modal = document.getElementById('truemoney-settings-modal');
  if (modal) modal.classList.add('hidden');
};

window.saveTrueMoneySettings = function() {
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
};

window.switchGameTab = function(tabName) {
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
    setTimeout(initScratchCard, 50);
  } else if (tabName === 'memory') {
    if (isMemoryPairMatched && !isJigsawCompleted) {
      renderJigsawGrid();
    } else if (!isMemoryPairMatched) {
      renderMemoryGrid();
    }
  }
};

// Love Confirmation & Reveal Angpao Flow
let teaseCount = 0;

function triggerWinAngpao() {
  const confirmModal = document.getElementById('love-confirm-modal');
  if (confirmModal) {
    playSound('tap');
    confirmModal.classList.remove('hidden');
  } else {
    revealAngpaoCard();
  }
}

window.confirmLoveAndRevealAngpao = function() {
  const confirmModal = document.getElementById('love-confirm-modal');
  if (confirmModal) confirmModal.classList.add('hidden');
  revealAngpaoCard();
};

function revealAngpaoCard() {
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

window.teaseLoveButton = function() {
  playSound('error');
  teaseCount++;
  const txt = document.getElementById('tease-btn-text');
  if (teaseCount === 1) {
    if (txt) txt.innerText = "แกล้งเฉยๆ จริงๆ รักมากกก 💕";
    showToast("🥺 ไม่รักเค้าจริงหรอ... กดปุ่มข้างบนเลยน้าา 💕");
  } else {
    confirmLoveAndRevealAngpao();
  }
};

window.teaseLoveHover = function() {
  const btn = document.getElementById('tease-love-btn');
  if (btn && teaseCount === 0) {
    btn.style.transform = `translateX(${Math.random() > 0.5 ? 12 : -12}px)`;
    setTimeout(() => { btn.style.transform = 'none'; }, 250);
  }
};

window.openLuckyBox = function(boxNum) {
  triggerWinAngpao();
};

// 1. Digital Scratch Card Canvas
function initScratchCard() {
  isScratchRevealed = false;
  isScratching = false;
  const canvas = document.getElementById('scratch-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.parentElement ? canvas.parentElement.clientWidth : 300;
  const h = canvas.parentElement ? canvas.parentElement.clientHeight : 160;
  canvas.width = w > 50 ? w : 300;
  canvas.height = h > 50 ? h : 160;

  ctx.globalCompositeOperation = 'source-over';
  // Draw Gold Glitter Scratch Layer
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#eab308');
  grad.addColorStop(0.3, '#fef08a');
  grad.addColorStop(0.7, '#ca8a04');
  grad.addColorStop(1, '#eab308');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add Scratch Text & Sparkles
  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 14px Prompt, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✨ ขูดตรงนี้เพื่อเปิดของขวัญ ✨', canvas.width / 2, canvas.height / 2 + 5);

  function scratch(e) {
    if (!isScratching || isScratchRevealed) return;
    const b = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - b.left;
    const y = clientY - b.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    checkScratchProgress();
  }

  function checkScratchProgress() {
    if (isScratchRevealed) return;
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let cleared = 0;
      for (let i = 3; i < imgData.data.length; i += 16) {
        if (imgData.data[i] === 0) cleared++;
      }
      const percent = cleared / (imgData.data.length / 16);
      if (percent > 0.35) {
        isScratchRevealed = true;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        triggerWinAngpao();
      }
    } catch(err) {}
  }

  canvas.onpointerdown = (e) => { isScratching = true; scratch(e); };
  canvas.onpointermove = scratch;
  window.onpointerup = () => { isScratching = false; };
  window.onpointercancel = () => { isScratching = false; };
}

// 2. Couples Trivia Game
const TRIVIA_QUESTIONS = [
  {
    question: "1. วันที่เรารักกันและเริ่มเป็นแฟนกันคือวันไหนคะ?",
    options: ["26 กุมภาพันธ์ 2569 (09:38 น.) 💕", "1 มกราคม 2569", "14 กุมภาพันธ์ 2569"],
    answerIndex: 0
  },
  {
    question: "2. วันเกิดของเค้าคือวันไหน จำได้ไหมน้า?",
    options: ["30 พฤศจิกายน 2550 🎂", "25 ธันวาคม 2550", "12 สิงหาคม 2550"],
    answerIndex: 0
  },
  {
    question: "3. เพลงที่เค้าตั้งใจเลือกให้เธอในช่วงกุญแจลิงก์เพลงคือเพลงอะไร?",
    options: ["ตั้งใจรัก 💕", "คิดแต่ไม่ถึง", "สายตาหลอกกันไม่ได้"],
    answerIndex: 0
  }
];

function initTriviaGame() {
  currentTriviaStep = 0;
  renderTriviaStep();
}

function renderTriviaStep() {
  const badge = document.getElementById('trivia-step-badge');
  const qText = document.getElementById('trivia-question-text');
  const optBox = document.getElementById('trivia-options-box');

  if (badge) badge.innerText = `ข้อ ${currentTriviaStep + 1} / ${TRIVIA_QUESTIONS.length}`;
  const q = TRIVIA_QUESTIONS[currentTriviaStep];
  if (qText) qText.innerText = q.question;

  if (optBox) {
    optBox.innerHTML = q.options.map((opt, idx) => `
      <button onclick="answerTrivia(${idx})" class="w-full text-left p-3.5 bg-purple-950/70 hover:bg-pink-950/80 border border-purple-500/30 hover:border-pink-500/60 rounded-2xl text-xs text-purple-100 hover:text-pink-200 transition-all font-cute active:scale-95 shadow-md flex items-center justify-between">
        <span>${opt}</span>
        <span class="text-pink-400 opacity-60">💖</span>
      </button>
    `).join('');
  }
}

window.answerTrivia = function(chosenIdx) {
  const q = TRIVIA_QUESTIONS[currentTriviaStep];
  if (chosenIdx === q.answerIndex) {
    playSound('success');
    if (currentTriviaStep + 1 < TRIVIA_QUESTIONS.length) {
      currentTriviaStep++;
      renderTriviaStep();
    } else {
      triggerWinAngpao();
      showToast("🎉 ตอบถูกครบทุกข้อแล้ว! รับซองของขวัญได้เลยนะคนเก่ง 💕");
    }
  } else {
    playSound('error');
    showToast("❌ ยังไม่ใช่น้าา ลองเลือกใหม่อีกรอบนะคนดี 💕");
  }
};

// 3. Memory Card Matching & Jigsaw Puzzle Game
const ALL_MEMORY_PHOTOS = [
  "/photos/photo_hotpot.jpg",
  "/photos/photo_bouquet.jpg",
  "/photos/photo1.jpg",
  "/photos/photo2.jpg",
  "/photos/photo5.jpg"
];

function initMemoryGame() {
  isMemoryPairMatched = false;
  isJigsawCompleted = false;
  selectedJigsawIndex = null;

  // สุ่มเลือก 4 รูปความทรงจำสำหรับ 4 คู่ (8 ใบ)
  const selectedPhotos = [...ALL_MEMORY_PHOTOS].sort(() => Math.random() - 0.5).slice(0, 4);
  const deck = [];
  selectedPhotos.forEach((img, id) => {
    deck.push({ id, img });
    deck.push({ id, img });
  });
  shuffledMemory = deck.sort(() => Math.random() - 0.5);
  flippedCards = [];
  matchedCount = 0;

  const cardsPhase = document.getElementById('memory-phase-cards');
  const jigsawPhase = document.getElementById('memory-phase-jigsaw');
  if (cardsPhase) cardsPhase.classList.remove('hidden');
  if (jigsawPhase) jigsawPhase.classList.add('hidden');

  renderMemoryGrid();
}

function renderMemoryGrid() {
  const grid = document.getElementById('memory-grid');
  if (!grid) return;

  grid.innerHTML = shuffledMemory.map((card, idx) => `
    <div id="memory-card-${idx}" onclick="flipMemoryCard(${idx})" class="memory-flip-card w-full aspect-square cursor-pointer">
      <div class="memory-flip-inner">
        <div class="memory-card-front bg-purple-950/85 border border-purple-500/40 hover:border-pink-500/70 text-pink-400 font-bold text-lg shadow-md flex items-center justify-center rounded-2xl transition-all">
          <span class="text-xl filter drop-shadow">❓</span>
        </div>
        <div class="memory-card-back bg-purple-950 border-2 border-pink-500/80 shadow-xl overflow-hidden rounded-2xl p-0.5 relative">
          <img src="${card.img}" class="w-full h-full object-cover rounded-xl" alt="ความทรงจำ" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
        </div>
      </div>
    </div>
  `).join('');
}

window.flipMemoryCard = function(idx) {
  if (flippedCards.length >= 2 || flippedCards.includes(idx) || isMemoryPairMatched) return;
  const card = document.getElementById(`memory-card-${idx}`);
  if (!card || card.classList.contains('flipped')) return;

  playSound('tap');
  card.classList.add('flipped');
  flippedCards.push(idx);

  if (flippedCards.length === 2) {
    const [first, second] = flippedCards;
    if (shuffledMemory[first].id === shuffledMemory[second].id) {
      // จับคู่ได้ 1 คู่ตรงกันสำเร็จ!
      playSound('success');
      isMemoryPairMatched = true;
      
      const c1 = document.getElementById(`memory-card-${first}`);
      const c2 = document.getElementById(`memory-card-${second}`);
      if (c1) c1.classList.add('matched');
      if (c2) c2.classList.add('matched');

      currentJigsawPhoto = shuffledMemory[first].img;

      if (typeof confetti === 'function') {
        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch(err) {}
      }

      showToast("✨ ยอดเยี่ยมมาก! จับคู่รูปสำเร็จแล้ว ไปต่อจิ๊กซอว์กันเลย! 🧩");

      setTimeout(() => {
        startJigsawPuzzle(currentJigsawPhoto);
      }, 1100);
    } else {
      setTimeout(() => {
        const c1 = document.getElementById(`memory-card-${first}`);
        const c2 = document.getElementById(`memory-card-${second}`);
        if (c1 && !c1.classList.contains('matched')) c1.classList.remove('flipped');
        if (c2 && !c2.classList.contains('matched')) c2.classList.remove('flipped');
        flippedCards = [];
      }, 850);
    }
  }
};

function startJigsawPuzzle(photoUrl) {
  currentJigsawPhoto = photoUrl;
  isJigsawCompleted = false;
  selectedJigsawIndex = null;

  const cardsPhase = document.getElementById('memory-phase-cards');
  const jigsawPhase = document.getElementById('memory-phase-jigsaw');
  if (cardsPhase) cardsPhase.classList.add('hidden');
  if (jigsawPhase) {
    jigsawPhase.classList.remove('hidden');
    jigsawPhase.classList.add('animate-fade-in');
  }

  // สลับชิ้นส่วน 3x3 (0 ถึง 8) ให้กระจายตัวอย่างน้อย 5 ชิ้นขึ้นไปเพื่อความสนุก
  let state = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  do {
    state = state.sort(() => Math.random() - 0.5);
  } while (state.filter((val, idx) => val === idx).length > 3);

  currentJigsawState = state;
  const board = document.getElementById('jigsaw-board');
  if (board) board.classList.remove('jigsaw-solved-glow');

  renderJigsawGrid();
}

function renderJigsawGrid() {
  const board = document.getElementById('jigsaw-board');
  const badge = document.getElementById('jigsaw-correct-badge');
  if (!board) return;

  let correctCount = 0;
  currentJigsawState.forEach((val, idx) => {
    if (val === idx) correctCount++;
  });

  if (badge) {
    badge.innerText = `${correctCount} / 9 ชิ้น`;
    if (correctCount === 9) {
      badge.className = "text-[11px] text-green-300 font-mono font-bold bg-green-950/90 border border-green-500/60 px-2.5 py-0.5 rounded-full animate-pulse shadow-md shadow-green-500/30";
    } else {
      badge.className = "text-[11px] text-yellow-300 font-mono font-bold bg-purple-950 border border-purple-500/40 px-2.5 py-0.5 rounded-full";
    }
  }

  board.innerHTML = currentJigsawState.map((pieceId, slotIdx) => {
    const isCorrect = pieceId === slotIdx;
    const isSelected = selectedJigsawIndex === slotIdx;
    const origRow = Math.floor(pieceId / 3);
    const origCol = pieceId % 3;
    const posX = origCol * 50;
    const posY = origRow * 50;

    return `
      <div 
        id="jigsaw-piece-${slotIdx}" 
        onclick="onTapJigsawPiece(${slotIdx})"
        class="jigsaw-tile aspect-square rounded-xl cursor-pointer transition-all duration-200 relative overflow-hidden select-none ${
          isSelected 
            ? 'ring-4 ring-pink-400 scale-95 z-20 shadow-lg shadow-pink-500/60' 
            : isCorrect 
              ? 'border-2 border-green-400/80 shadow-md shadow-green-500/20' 
              : 'border border-purple-500/40 hover:border-pink-400/70 active:scale-95'
        }"
        style="
          background-image: url('${currentJigsawPhoto}');
          background-size: 300% 300%;
          background-position: ${posX}% ${posY}%;
        "
      >
        ${isSelected ? '<div class="absolute inset-0 bg-pink-500/25 pointer-events-none animate-pulse"></div>' : ''}
        ${isCorrect ? '<div class="absolute bottom-1 right-1 text-[9px] bg-green-500/90 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold pointer-events-none shadow">✓</div>' : ''}
      </div>
    `;
  }).join('');
}

window.onTapJigsawPiece = function(slotIdx) {
  if (isJigsawCompleted) return;

  if (selectedJigsawIndex === null) {
    selectedJigsawIndex = slotIdx;
    playSound('tap');
    renderJigsawGrid();
  } else if (selectedJigsawIndex === slotIdx) {
    selectedJigsawIndex = null;
    playSound('tap');
    renderJigsawGrid();
  } else {
    // สลับตำแหน่งระหว่างชิ้นที่เลือกกับชิ้นใหม่
    const firstIdx = selectedJigsawIndex;
    const secondIdx = slotIdx;

    const temp = currentJigsawState[firstIdx];
    currentJigsawState[firstIdx] = currentJigsawState[secondIdx];
    currentJigsawState[secondIdx] = temp;

    selectedJigsawIndex = null;
    playSound('tap');
    renderJigsawGrid();

    // ตรวจสอบว่าต่อครบทุกตำแหน่งหรือยัง
    checkJigsawCompletion();
  }
};

function checkJigsawCompletion() {
  const isComplete = currentJigsawState.every((val, idx) => val === idx);
  if (isComplete) {
    isJigsawCompleted = true;
    playSound('success');

    const board = document.getElementById('jigsaw-board');
    if (board) {
      board.classList.add('jigsaw-solved-glow');
    }

    if (typeof confetti === 'function') {
      try {
        confetti({
          particleCount: 180,
          spread: 95,
          colors: ['#fbbf24', '#ec4899', '#f43f5e', '#c084fc', '#ffffff'],
          origin: { y: 0.6 }
        });
      } catch(err) {}
    }

    showToast("🎉 เก่งที่สุดเลยยย! ต่อจิ๊กซอว์ความทรงจำสำเร็จแล้ว 💕");

    setTimeout(() => {
      triggerWinAngpao();
    }, 900);
  }
}

window.reshuffleJigsaw = function() {
  playSound('tap');
  let state = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  do {
    state = state.sort(() => Math.random() - 0.5);
  } while (state.filter((val, idx) => val === idx).length > 3);
  currentJigsawState = state;
  selectedJigsawIndex = null;
  isJigsawCompleted = false;
  const board = document.getElementById('jigsaw-board');
  if (board) board.classList.remove('jigsaw-solved-glow');
  renderJigsawGrid();
  showToast("🔀 สลับตำแหน่งชิ้นส่วนใหม่แล้วค่ะ");
};

window.resetToMemoryCards = function() {
  playSound('tap');
  initMemoryGame();
  showToast("🃏 กลับมาเลือกจับคู่รูปภาพใหม่อีกครั้ง");
};

window.openJigsawPreviewModal = function() {
  playSound('tap');
  const modal = document.getElementById('jigsaw-preview-modal');
  const img = document.getElementById('jigsaw-preview-img');
  if (img) img.src = currentJigsawPhoto;
  if (modal) modal.classList.remove('hidden');
};

window.closeJigsawPreviewModal = function() {
  const modal = document.getElementById('jigsaw-preview-modal');
  if (modal) modal.classList.add('hidden');
};

// Always start directly at Screen 1: Velvet Lock (ใส่รหัสหัวใจ 260269)
renderPasscodeScreen();




