(() => {
  'use strict';
  const fine = matchMedia('(any-pointer: fine) and (any-hover: hover)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const cursor = document.createElement('img');
  cursor.id = 'ilex-celebi-cursor';
  cursor.alt = '';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.setAttribute('popover', 'manual');
  cursor.draggable = false;
  document.body.append(cursor);
  let ready = false, wanted = false, modal = null, x = 0, y = 0;
  const hide = () => {
    wanted = false;
    document.documentElement.classList.remove('ilex-celebi-cursor-active');
    if (cursor.matches(':popover-open')) cursor.hidePopover();
  };
  function refresh(raise = false) {
    if (!wanted || !ready || !fine.matches || document.hidden || typeof cursor.showPopover !== 'function') return;
    const currentModal = document.querySelector('dialog:modal');
    if ((raise || currentModal !== modal) && cursor.matches(':popover-open')) cursor.hidePopover();
    modal = currentModal;
    cursor.style.left = x + 'px';
    cursor.style.top = y + 'px';
    cursor.style.setProperty('--celebi-facing', x < innerWidth / 2 ? '1' : '-1');
    if (!cursor.matches(':popover-open')) cursor.showPopover();
    document.documentElement.classList.add('ilex-celebi-cursor-active');
  }
  function mouse(event) {
    if (event.pointerType && event.pointerType !== 'mouse') { hide(); return; }
    x = event.clientX; y = event.clientY; wanted = true;
    refresh();
  }
  const load = () => {
    ready = false;
    document.documentElement.classList.remove('ilex-celebi-cursor-active');
    if (cursor.matches(':popover-open')) cursor.hidePopover();
    cursor.src = reduced.matches ? 'v2-assets/celebi-cursor-still.png' : 'v2-assets/celebi-cursor.gif';
  };
  cursor.addEventListener('load', () => { ready = cursor.naturalWidth > 0; refresh(); });
  cursor.addEventListener('error', () => { ready = false; hide(); });
  // A selection may redraw the dragged element before dragend is delivered.
  // Never latch cursor visibility to the lifetime of a card's drag operation.
  for (const type of ['pointermove', 'pointerdown', 'pointerup']) document.addEventListener(type, mouse, {passive: true, capture: true});
  for (const type of ['dragover', 'drop', 'dragend']) document.addEventListener(type, mouse, {passive: true, capture: true});
  document.addEventListener('dragstart', () => refresh(), true);
  document.documentElement.addEventListener('pointerleave', hide);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
  window.addEventListener('blur', hide);
  fine.addEventListener('change', () => { if (!fine.matches) hide(); else refresh(); });
  reduced.addEventListener('change', load);
  // Dialogs can open/reopen under a stationary mouse. Raise the popover after
  // their top-layer entry changes, including reuse of the same choice dialog.
  new MutationObserver(records => {
    const changed = records.some(r => r.type === 'attributes' && r.target.tagName === 'DIALOG');
    if (changed || document.querySelector('dialog:modal') !== modal) refresh(changed);
  }).observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['open']});
  cursor.addEventListener('toggle', () => {
    if (!cursor.matches(':popover-open')) {
      document.documentElement.classList.remove('ilex-celebi-cursor-active');
      refresh();
    }
  });
  load();
})();
