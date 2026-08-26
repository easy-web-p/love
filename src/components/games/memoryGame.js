// ==========================================
// Mini-Game 3: Memory Flip Card Matching & 3x3 Jigsaw Puzzle
// ==========================================
import { ALL_MEMORY_PHOTOS } from '../../data/photos.js';
import { playSound } from '../../utils/audio.js';
import { showToast } from '../../utils/toast.js';

export let shuffledMemory = [];
export let flippedCards = [];
export let isMemoryPairMatched = false;
export let currentJigsawPhoto = "/photos/photo_hotpot.jpg";
export let currentJigsawState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
export let selectedJigsawIndex = null;
export let isJigsawCompleted = false;

export function initMemoryGame() {
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

  const cardsPhase = document.getElementById('memory-phase-cards');
  const jigsawPhase = document.getElementById('memory-phase-jigsaw');
  if (cardsPhase) cardsPhase.classList.remove('hidden');
  if (jigsawPhase) jigsawPhase.classList.add('hidden');

  renderMemoryGrid();
}

export function renderMemoryGrid() {
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

export function flipMemoryCard(idx) {
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
}

export function startJigsawPuzzle(photoUrl) {
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

  // สลับชิ้นส่วน 3x3 (0 ถึง 8)
  let state = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  do {
    state = state.sort(() => Math.random() - 0.5);
  } while (state.filter((val, idx) => val === idx).length > 3);

  currentJigsawState = state;
  const board = document.getElementById('jigsaw-board');
  if (board) board.classList.remove('jigsaw-solved-glow');

  renderJigsawGrid();
}

export function renderJigsawGrid() {
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

export function onTapJigsawPiece(slotIdx) {
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

    checkJigsawCompletion();
  }
}

export function checkJigsawCompletion() {
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
      if (typeof window.triggerWinAngpao === 'function') {
        window.triggerWinAngpao();
      }
    }, 900);
  }
}

export function reshuffleJigsaw() {
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
}

export function resetToMemoryCards() {
  playSound('tap');
  initMemoryGame();
  showToast("🃏 กลับมาเลือกจับคู่รูปภาพใหม่อีกครั้ง");
}

export function openJigsawPreviewModal() {
  playSound('tap');
  const modal = document.getElementById('jigsaw-preview-modal');
  const img = document.getElementById('jigsaw-preview-img');
  if (img) img.src = currentJigsawPhoto;
  if (modal) modal.classList.remove('hidden');
}

export function closeJigsawPreviewModal() {
  const modal = document.getElementById('jigsaw-preview-modal');
  if (modal) modal.classList.add('hidden');
}

window.flipMemoryCard = flipMemoryCard;
window.onTapJigsawPiece = onTapJigsawPiece;
window.reshuffleJigsaw = reshuffleJigsaw;
window.resetToMemoryCards = resetToMemoryCards;
window.openJigsawPreviewModal = openJigsawPreviewModal;
window.closeJigsawPreviewModal = closeJigsawPreviewModal;
