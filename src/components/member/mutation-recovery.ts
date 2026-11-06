"use client";

import { useReducer, useState } from "react";

/** Only a new editor scope can clear an unresolved write; a GET is not completion proof. */
export function createMutationRecovery() {
  let blocked = false;
  return {
    isBlocked: () => blocked,
    markUnknown: () => { blocked = true; },
  };
}

export function useMutationRecovery(scope: string) {
  const [scopes] = useState(() => new Map<string, ReturnType<typeof createMutationRecovery>>());
  let recovery = scopes.get(scope);
  if (!recovery) { recovery = createMutationRecovery(); scopes.set(scope, recovery); }
  const [, render] = useReducer((value: number) => value + 1, 0);
  return {
    unknown: recovery.isBlocked(),
    isBlocked: recovery.isBlocked,
    markUnknown() { recovery.markUnknown(); render(); },
  };
}
