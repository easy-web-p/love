// ==========================================
// YouTube Music Player & Floating Vinyl Component
// ==========================================
import { PLAYLIST } from '../data/playlist.js';
import { playSound } from '../utils/audio.js';
import { showToast } from '../utils/toast.js';

export let ytPlayer = null;
export let currentTrackIndex = 0;
export let isMusicPlaying = false;
export let isYtReady = false;
export let currentVolume = parseInt(localStorage.getItem('music_volume') || '30', 10);
let lastVolumeBeforeMute = 30;
let pendingUnlockIndex = null;

let isShuffleMode = false;
let isLoopMode = false;
let progressTrackerTimer = null;

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
export function tryAutoPlayMusic() {
  if (isMusicPlaying) return;
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

export function toggleMusic() {
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
}

export function nextSong() {
  const nextIdx = (currentTrackIndex + 1) % PLAYLIST.length;
  if (!PLAYLIST[nextIdx].isUnlocked) {
    openUnlockQuizModal(nextIdx);
  } else {
    currentTrackIndex = nextIdx;
    playCurrentTrack();
  }
}

export function prevSong() {
  const prevIdx = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
  if (!PLAYLIST[prevIdx].isUnlocked) {
    openUnlockQuizModal(prevIdx);
  } else {
    currentTrackIndex = prevIdx;
    playCurrentTrack();
  }
}

export function selectSong(index) {
  if (!PLAYLIST[index].isUnlocked) {
    openUnlockQuizModal(index);
  } else {
    currentTrackIndex = index;
    playCurrentTrack();
    closePlaylistModal();
  }
}

export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function startProgressTracker() {
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

export function seekAestheticMusic(e) {
  const track = document.getElementById('aesthetic-progress-track');
  if (!track || !ytPlayer || !isYtReady) return;
  const rect = track.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const fraction = Math.max(0, Math.min(1, clickX / rect.width));
  const duration = ytPlayer.getDuration() || 0;
  if (duration > 0) {
    ytPlayer.seekTo(duration * fraction, true);
  }
}

export function toggleShuffle() {
  isShuffleMode = !isShuffleMode;
  showToast(isShuffleMode ? "🔀 เปิดโหมดสุ่มเพลง" : "➡️ ปิดโหมดสุ่มเพลง");
  updateMusicUI();
}

export function toggleLoop() {
  isLoopMode = !isLoopMode;
  showToast(isLoopMode ? "🔁 เปิดโหมดวนซ้ำเพลงปัจจุบัน" : "➡️ ปิดโหมดวนซ้ำ");
  updateMusicUI();
}

export function openAestheticPlayerModal() {
  const modal = document.getElementById('aesthetic-player-modal');
  updateMusicUI();
  startProgressTracker();
  if (modal) modal.classList.remove('hidden');
}

export function closeAestheticPlayerModal() {
  const modal = document.getElementById('aesthetic-player-modal');
  if (modal) modal.classList.add('hidden');
}

export function autoPlayNextUnlockedSong() {
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

export function changeMusicVolume(val) {
  currentVolume = parseInt(val, 10);
  localStorage.setItem('music_volume', currentVolume);
  if (ytPlayer && isYtReady && typeof ytPlayer.setVolume === 'function') {
    ytPlayer.setVolume(currentVolume);
  }
  updateVolumeUI();
}

export function toggleMuteVolume() {
  if (currentVolume > 0) {
    lastVolumeBeforeMute = currentVolume;
    changeMusicVolume(0);
  } else {
    changeMusicVolume(lastVolumeBeforeMute || 30);
  }
}

export function updateVolumeUI() {
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

export function playCurrentTrack() {
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

export function openPlaylistModal() {
  const modal = document.getElementById('playlist-modal');
  renderPlaylistItems();
  if (modal) modal.classList.remove('hidden');
}

export function closePlaylistModal() {
  const modal = document.getElementById('playlist-modal');
  if (modal) modal.classList.add('hidden');
}

export function renderPlaylistItems() {
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

export function openUnlockQuizModal(index) {
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
}

export function closeUnlockQuizModal() {
  const modal = document.getElementById('unlock-quiz-modal');
  if (modal) modal.classList.add('hidden');
  pendingUnlockIndex = null;
}

export function submitQuizAnswer(chosenIndex) {
  if (pendingUnlockIndex === null) return;

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
}

export function updateMusicUI() {
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
  if (!curSong) return;

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

export function getFloatingMusicButtonHtml() {
  const curSong = PLAYLIST[currentTrackIndex] || PLAYLIST[0];
  return `
    <div class="fixed bottom-4 right-4 z-50 flex items-center space-x-2.5 select-none">
      <!-- Pastel Rose Floating Controls Bar -->
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
        
        <!-- Song Info -->
        <div onclick="openAestheticPlayerModal()" class="cursor-pointer max-w-[110px] sm:max-w-[160px] overflow-hidden whitespace-nowrap text-left px-2 border-l border-[#5c2035]/20 hover:opacity-80 transition-opacity" title="แตะเพื่อเปิดเครื่องเล่นเพลงดอกไม้ 🌸">
          <p id="current-song-title" class="text-[#5c2035] font-bold font-cute truncate text-[11px] sm:text-xs">
            ${curSong.title}
          </p>
          <p id="current-song-artist" class="text-[#5c2035]/70 text-[9px] sm:text-[10px] truncate">
            ${curSong.artist}
          </p>
        </div>

        <!-- Playlist Button -->
        <button onclick="openPlaylistModal()" class="p-1.5 bg-[#5c2035]/10 hover:bg-[#5c2035]/25 rounded-full text-[#5c2035] transition-transform active:scale-90 text-[11px]" title="ดูเพลย์ลิสต์">
          📑
        </button>
      </div>

      <!-- Blooming Pink Flower Floating Button -->
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

    <!-- Pastel Rose Aesthetic Music Player Modal -->
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
            ${curSong.title}
          </h4>
          <p id="aesthetic-song-artist" class="text-xs text-[#5c2035]/70 truncate font-cute">
            ${curSong.artist}
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

        <!-- 4. Interactive Volume Slider -->
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

// Expose handlers globally for inline HTML onclick attributes
window.toggleMusic = toggleMusic;
window.nextSong = nextSong;
window.prevSong = prevSong;
window.selectSong = selectSong;
window.seekAestheticMusic = seekAestheticMusic;
window.toggleShuffle = toggleShuffle;
window.toggleLoop = toggleLoop;
window.openAestheticPlayerModal = openAestheticPlayerModal;
window.closeAestheticPlayerModal = closeAestheticPlayerModal;
window.changeMusicVolume = changeMusicVolume;
window.toggleMuteVolume = toggleMuteVolume;
window.openPlaylistModal = openPlaylistModal;
window.closePlaylistModal = closePlaylistModal;
window.openUnlockQuizModal = openUnlockQuizModal;
window.closeUnlockQuizModal = closeUnlockQuizModal;
window.submitQuizAnswer = submitQuizAnswer;
