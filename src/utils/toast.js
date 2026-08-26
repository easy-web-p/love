// ==========================================
// Toast Notification Utility
// ==========================================

export function showToast(msg) {
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

// Expose globally
window.showToast = showToast;
