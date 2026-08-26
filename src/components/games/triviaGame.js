// ==========================================
// Mini-Game 2: Couple Trivia Game Component
// ==========================================
import { TRIVIA_QUESTIONS } from '../../data/questions.js';
import { playSound } from '../../utils/audio.js';
import { showToast } from '../../utils/toast.js';

export let currentTriviaStep = 0;

export function initTriviaGame() {
  currentTriviaStep = 0;
  renderTriviaStep();
}

export function renderTriviaStep() {
  const badge = document.getElementById('trivia-step-badge');
  const qText = document.getElementById('trivia-question-text');
  const optBox = document.getElementById('trivia-options-box');

  if (badge) badge.innerText = `ข้อ ${currentTriviaStep + 1} / ${TRIVIA_QUESTIONS.length}`;
  const q = TRIVIA_QUESTIONS[currentTriviaStep];
  if (!q) return;

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

export function answerTrivia(chosenIdx) {
  const q = TRIVIA_QUESTIONS[currentTriviaStep];
  if (!q) return;

  if (chosenIdx === q.answerIndex) {
    playSound('success');
    if (currentTriviaStep + 1 < TRIVIA_QUESTIONS.length) {
      currentTriviaStep++;
      renderTriviaStep();
    } else {
      if (typeof window.triggerWinAngpao === 'function') {
        window.triggerWinAngpao();
      }
      showToast("🎉 ตอบถูกครบทุกข้อแล้ว! รับซองของขวัญได้เลยนะคนเก่ง 💕");
    }
  } else {
    playSound('error');
    showToast("❌ ยังไม่ใช่น้าา ลองเลือกใหม่อีกรอบนะคนดี 💕");
  }
}

window.answerTrivia = answerTrivia;
