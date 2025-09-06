import React from 'react';
import ReactDOM from 'react-dom/client';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import App from './App.tsx';
import "./styles/theme.css"
import { Auth0Provider } from "@auth0/auth0-react";


const qc = new QueryClient();

const domain   = import.meta.env.VITE_AUTH0_DOMAIN!;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID!;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE!;
/* 
const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,              // optional: 30s “fresh”
      refetchOnWindowFocus: false,    // optional: quieter dev UX
    },
  },
});
*/

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    cacheLocation="localstorage"
    authorizationParams={{ redirect_uri: window.location.origin, 
                          audience: import.meta.env.VITE_AUTH0_AUDIENCE!,
                          scope: "openid profile email", }}
  >
    <QueryClientProvider client={qc}>
      <App />
    </QueryClientProvider>
  </Auth0Provider>
);
/*
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
*/
