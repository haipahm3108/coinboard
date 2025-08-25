import React from 'react';
import ReactDOM from 'react-dom/client';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import App from './App.tsx';


const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,              // optional: 30s “fresh”
      refetchOnWindowFocus: false,    // optional: quieter dev UX
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
