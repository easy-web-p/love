// ==========================================
// Haptic Vibration Feedback Engine (ระบบสั่นบนมือถือ)
// ==========================================

export function triggerHaptic(type) {
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
