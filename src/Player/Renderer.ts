window.addEventListener('contextmenu', e => {
  e.preventDefault();
  player.contextMenu({ x: e.clientX, y: e.clientY });
});

import './React/Index';
