/* Scene direction is ephemeral. It never reads hidden cards or writes a save. */
var IlexExperience = (() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const app = document.getElementById('app');
  const menu = document.getElementById('mainmenu');
  const nav = menu?.querySelector('nav');
  const animations = new Set();
  // Match the authored location: weather stays outside shelters and archives.
  const moods = [
    ['grove','amber','mist','astral'], ['mist','amber','astral'],
    ['amber','amber','astral'], ['rain','amber','mist'], ['mist','amber','astral'],
    ['mist','mist','amber'], ['storm','amber','storm'], ['embers','embers','embers'],
    ['grove','amber','grove'], ['amber','astral','amber'], ['astral','astral','astral'],
    ['grove','amber','grove'], ['astral','astral','astral','astral','grove']
  ];
  let previousWorld = null, worldId = '', speaker = '', destination = '', scheduled = false;
  let environmentCount = 0, entrances = 0;
  const enabled = () => !motion.matches && !document.hidden && !document.body.classList.contains('story-world-battle') &&
    (typeof IlexPresentation === 'undefined' || IlexPresentation.preferences().effects !== false);
  const fast = () => typeof IlexPresentation !== 'undefined' && IlexPresentation.preferences().speed === 'fast';

  function animate(element, frames, options) {
    if (!element || !enabled() || !element.animate) return null;
    const animation = element.animate(frames, {easing: 'cubic-bezier(.22,1,.36,1)', ...options});
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    return animation;
  }
  function cancel() {
    for (const animation of animations) animation.cancel();
    animations.clear();
    document.querySelectorAll('.experience-departing-world').forEach(el => el.remove());
  }
  function preferences() {
    document.body.classList.toggle('experience-still', !enabled());
    if (!enabled()) cancel();
  }
  function addAtmosphere(layer, mood) {
    layer.dataset.experienceMood = mood;
    let atmosphere = layer.querySelector('.experience-atmosphere');
    if (!atmosphere) {
      atmosphere = document.createElement('div');
      atmosphere.className = 'experience-atmosphere';
      atmosphere.setAttribute('aria-hidden', 'true');
      const light = document.createElement('div'); light.className = 'experience-light'; atmosphere.append(light);
      for (let i = 0; i < 16; i++) {
        const mote = document.createElement('i');
        mote.style.setProperty('--x', ((i * 137.51) % 97).toFixed(2) + '%');
        mote.style.setProperty('--y', ((i * 37.73) % 100).toFixed(2) + '%');
        mote.style.setProperty('--delay', (-i * 1.37) + 's');
        mote.style.setProperty('--duration', (12 + i % 7) + 's');
        mote.style.setProperty('--size', (i % 3 === 0 ? 3 : 2) + 'px');
        atmosphere.append(mote);
      }
      layer.append(atmosphere);
    }
  }
  function environmentReady(event) {
    const layer = document.getElementById('story-world');
    const incoming = layer?.querySelector(':scope > svg');
    if (!incoming) return;
    preferences();
    const environment = event.detail || {};
    const key = environment.atlas + ':' + environment.panel;
    const next = incoming.cloneNode(true);
    if (key !== worldId) {
      cancel();
      environmentCount++;
      if (previousWorld && enabled() && !document.body.classList.contains('story-world-battle')) {
        const outgoing = previousWorld.cloneNode(true);
        outgoing.classList.add('experience-departing-world');
        layer.insertBefore(outgoing, incoming.nextSibling);
        const fade = animate(outgoing, [{opacity: 1}, {opacity: 0}], {duration: fast() ? 420 : 1000});
        if (fade) fade.finished.then(() => outgoing.remove(), () => outgoing.remove());
      }
      if (!document.body.classList.contains('story-world-battle')) {
        animate(incoming, [{transform: 'scale(1.035) translate(-.3%, .15%)'}, {transform: 'scale(1) translate(0, 0)'}], {duration: fast() ? 8000 : 16000});
      }
    }
    worldId = key; previousWorld = next;
    addAtmosphere(layer, moods[environment.chapter]?.[environment.area] || 'grove');
  }
  function storyRendered() {
    preferences();
    const scene = app?.querySelector('.story-scene');
    const portrait = scene?.querySelector(':scope > .story-character');
    const identity = portrait?.dataset.character || scene?.querySelector('h3')?.textContent || '';
    const location = app?.querySelector('.story-location');
    const locationKey = location?.textContent || '';
    if (identity && identity !== speaker) {
      animate(portrait, [{opacity: .25, transform: 'translateY(12px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: fast() ? 240 : 520});
      entrances++;
    }
    if (location && locationKey !== destination) {
      animate(location, [{opacity: 0, transform: 'translateX(-12px)'}, {opacity: 1, transform: 'translateX(0)'}], {duration: fast() ? 250 : 700});
    }
    speaker = identity; destination = locationKey;
    const menuArt = app?.querySelector('.story-start-art');
    if (menuArt) animate(menuArt, [{opacity: .3, transform: 'translateY(16px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: fast() ? 300 : 800});
  }
  let lastMenu = '';
  function sync() {
    scheduled = false; preferences();
    const level = menu && !menu.hidden ? nav?.dataset.menuLevel || 'home' : '';
    if (level && level !== lastMenu) {
      nav?.querySelectorAll('button:not([hidden])').forEach((button, i) => {
        animate(button, [{opacity: .15, translate: '0 12px'}, {opacity: 1, translate: '0 0'}], {duration: fast() ? 220 : 420, delay: Math.min(i * 55, 220), fill: 'backwards'});
      });
    }
    lastMenu = level;
    if (!document.body.classList.contains('story-world-active') && !document.getElementById('story-world')) {
      previousWorld = null; worldId = ''; speaker = ''; destination = '';
    }
    // Loading a scene's first image is not navigation. Preserve its speaker while
    // the image is pending, but release animations whose nodes were redrawn.
    for (const animation of animations) if (!animation.effect?.target?.isConnected) { animation.cancel(); animations.delete(animation); }
  }
  function schedule() { if (!scheduled) { scheduled = true; queueMicrotask(sync); } }
  document.addEventListener('ilex:environment-ready', environmentReady);
  document.addEventListener('ilex:story-rendered', storyRendered);
  document.addEventListener('visibilitychange', preferences);
  document.addEventListener('change', preferences);
  document.addEventListener('click', schedule);
  motion.addEventListener('change', preferences);
  if (app) new MutationObserver(schedule).observe(app, {childList: true});
  if (menu) new MutationObserver(schedule).observe(menu, {attributes: true, attributeFilter: ['hidden']});
  if (nav) new MutationObserver(schedule).observe(nav, {attributes: true, attributeFilter: ['data-menu-level'], childList: true});
  // The existing settings owner remains responsible for persistence.
  if (typeof IlexPresentation !== 'undefined') {
    const update = IlexPresentation.update;
    IlexPresentation.update = function() { const result = update.apply(this, arguments); preferences(); return result; };
  }
  schedule();
  return {cancel, diagnostics: () => ({enabled: enabled(), activeAnimations: animations.size, environmentCount, entrances, world: worldId})};
})();
