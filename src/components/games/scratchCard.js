// ==========================================
// Mini-Game 1: Digital Scratch Card & Lucky Chests
// ==========================================

export let isScratching = false;
export let isScratchRevealed = false;

export function initScratchCard(onWinCallback) {
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
        if (typeof onWinCallback === 'function') {
          onWinCallback();
        } else if (typeof window.triggerWinAngpao === 'function') {
          window.triggerWinAngpao();
        }
      }
    } catch(err) {}
  }

  canvas.onpointerdown = (e) => { isScratching = true; scratch(e); };
  canvas.onpointermove = scratch;
  window.onpointerup = () => { isScratching = false; };
  window.onpointercancel = () => { isScratching = false; };
}

window.openLuckyBox = function(boxNum) {
  if (typeof window.triggerWinAngpao === 'function') {
    window.triggerWinAngpao();
  }
};
