import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import { App } from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { ApiError } from "./api/client";
import "./styles/app.css";
import "./styles/spa.css";

const queryClient = new QueryClient({
  // A session can expire while the tab sits open. Catching the resulting 401
  // here flips the app back to signed-out on the next render, instead of
  // leaving a dashboard on screen whose every panel quietly fails.
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (error instanceof ApiError && error.isUnauthorized && query.queryKey[0] !== "me") {
        queryClient.setQueryData(["me"], null);
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // 401 and 403 are settled answers, not transient faults — retrying them
      // just delays the redirect to the login page by three round trips.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 2,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
