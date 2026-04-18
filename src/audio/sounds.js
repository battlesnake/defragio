const sounds = {};

export function loadSounds(map) {
  for (const [name, url] of Object.entries(map)) {
    const a = new Audio(url);
    a.preload = 'auto';
    sounds[name] = a;
  }
}

export function play(name) {
  const a = sounds[name];
  if (!a) return;
  const c = a.cloneNode();
  c.play().catch(() => { /* ignore autoplay rejection until first user input */ });
}
