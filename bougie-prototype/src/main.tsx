import { createRoot } from 'react-dom/client';
import App from './App';

// No StrictMode: it double-mounts effects in development, which would create
// and tear down the WebGL context twice on every load.
createRoot(document.getElementById('root')!).render(<App />);
