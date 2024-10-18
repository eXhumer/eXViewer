import { createRoot } from 'react-dom/client';
import App from './app';

createRoot(document.getElementById('react-root') as HTMLDivElement)
  .render(<App />);
