/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { PopOutView, readPopOutRoute } from './PopOutView';
import './index.css';

// Pop-out feed windows load this same page with a #popout route.
const popOut = readPopOutRoute(window.location.hash);
if (popOut) {
  document.body.classList.add('pop-out-window');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {popOut ? <PopOutView request={popOut} /> : <App />}
  </StrictMode>,
);
