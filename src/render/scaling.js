// Scale the main defrag window to fit the viewport. When enlarging we
// snap to integer factors so the pixel art stays crisp; when the natural
// size would overflow the viewport we accept fractional shrinkage (small
// screens / mobile) — pixel imperfection is less noticeable on high-DPI
// displays than a clipped-off bottom row.

const FIT_FRACTION = 0.9;

export function attachWindowScaler(selector = '#stage > .win') {
  const win = document.querySelector(selector);
  if (!win) return;

  let baseW = 0, baseH = 0;

  function measure() {
    win.style.transform = 'none';
    const rect = win.getBoundingClientRect();
    baseW = rect.width;
    baseH = rect.height;
  }

  function apply() {
    if (baseW === 0 || baseH === 0) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const fitScale = Math.min(
      (vw * FIT_FRACTION) / baseW,
      (vh * FIT_FRACTION) / baseH,
    );
    const scale = fitScale >= 1 ? Math.floor(fitScale) : fitScale;
    win.style.transformOrigin = 'center center';
    win.style.transform = scale === 1 ? 'none' : `scale(${scale})`;
  }

  requestAnimationFrame(() => { measure(); apply(); });

  window.addEventListener('resize', () => { measure(); apply(); });
  window.addEventListener('orientationchange', () => {
    // Wait one frame so the new viewport dimensions are available.
    requestAnimationFrame(() => { measure(); apply(); });
  });
}
