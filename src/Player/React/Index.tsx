import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('react-root') as HTMLDivElement)
  .render(<App />);
