// ==========================================
// 💖 Me Love — Main Entry Point & App Router
// ==========================================
import './style.css';

// Import Screens
import { renderAnniversaryCountdownScreen, isAnniversaryUnlocked } from './screens/countdownScreen.js';
import { renderPasscodeScreen } from './screens/passcodeScreen.js';
import { renderAnniversaryScreen } from './screens/heartScreen.js';
import { renderSurprisePage } from './screens/surpriseScreen.js';

// Import Components & Utilities to ensure full initialization
import './components/musicPlayer.js';
import './utils/audio.js';
import './utils/haptic.js';
import './utils/toast.js';

const app = document.querySelector('#app');
let currentScreen = "passcode";

// ==========================================
// Screen Navigation Router
// ==========================================

export function navigateToCountdown() {
  currentScreen = "countdown";
  renderAnniversaryCountdownScreen(app, () => {
    navigateToPasscode();
  });
}

export function navigateToPasscode() {
  currentScreen = "passcode";
  renderPasscodeScreen(app, () => {
    navigateToHeart();
  });
}

export function navigateToHeart() {
  currentScreen = "charging";
  renderAnniversaryScreen(app, () => {
    navigateToSurprise();
  });
}

export function navigateToSurprise() {
  currentScreen = "surprise";
  renderSurprisePage(app, () => {
    navigateToPasscode();
  });
}

// Expose navigation functions globally
window.navigateToCountdown = navigateToCountdown;
window.navigateToPasscode = navigateToPasscode;
window.navigateToHeart = navigateToHeart;
window.navigateToSurprise = navigateToSurprise;

// ==========================================
// Application Bootstrap
// ==========================================

function initApp() {
  // Clear any legacy screen session caching so the app always starts fresh
  try {
    sessionStorage.removeItem('current_screen');
    localStorage.removeItem('current_screen');
  } catch(e) {}

  // Check if countdown target is reached or bypassed
  if (!isAnniversaryUnlocked()) {
    navigateToCountdown();
  } else {
    // Default entry to Screen 1: Velvet Lock (Passcode PIN)
    navigateToPasscode();
  }
}

// Start application
initApp();
