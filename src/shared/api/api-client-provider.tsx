"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ApiClientError } from "./api-client-error";
import { API_SESSION_EXPIRED_EVENT } from "./orval-mutator";
import { getSessionExpiredLoginUrl } from "./session-expired-redirect";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) =>
          !(error instanceof ApiClientError &&
            (error.sessionExpired || error.status === 401 || error.status === 403)) &&
          failureCount < 3,
      },
      mutations: {
        retry: (failureCount, error) =>
          !(error instanceof ApiClientError &&
            (error.sessionExpired || error.status === 401 || error.status === 403)) &&
          failureCount < 3,
      },
    },
  });
}

export function ApiClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    const onSessionExpired = () => {
      queryClient.clear();
      window.location.assign(getSessionExpiredLoginUrl(window.location));
    };

    window.addEventListener(API_SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(API_SESSION_EXPIRED_EVENT, onSessionExpired);
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
