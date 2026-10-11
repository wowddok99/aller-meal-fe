"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { UnsavedChangesDialog } from "./unsaved-changes-dialog";

type EditState = { dirty: boolean; busy: boolean };
type NavigationGuard = {
  register: (readState: () => EditState) => () => void;
  isBlocked: () => boolean;
  requestLeave: (action: () => void) => void;
  runTerminalExit: (action: () => void) => void;
  shouldProtectUnload: () => boolean;
};

const NavigationGuardContext = createContext<NavigationGuard>({
  register: () => () => {},
  isBlocked: () => false,
  requestLeave: (action) => action(),
  runTerminalExit: (action) => action(),
  shouldProtectUnload: () => true,
});

export function EditNavigationProvider({ children }: { children: ReactNode }) {
  const editorRef = useRef<(() => EditState) | null>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const terminalExitRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const register = useCallback((readState: () => EditState) => {
    terminalExitRef.current = false;
    editorRef.current = readState;
    return () => {
      if (editorRef.current !== readState) return;
      editorRef.current = null;
      terminalExitRef.current = false;
      pendingActionRef.current = null;
      setConfirmOpen(false);
    };
  }, []);

  const isBlocked = useCallback(() => {
    const state = editorRef.current?.();
    return Boolean(state?.dirty || state?.busy);
  }, []);

  const requestLeave = useCallback((action: () => void) => {
    const state = editorRef.current?.();
    if (state?.busy || pendingActionRef.current) return;
    if (!state?.dirty) { action(); return; }
    pendingActionRef.current = action;
    setConfirmOpen(true);
  }, []);

  const shouldProtectUnload = useCallback(() => !terminalExitRef.current, []);
  const runTerminalExit = useCallback((action: () => void) => {
    terminalExitRef.current = true;
    try { action(); }
    catch (cause) { terminalExitRef.current = false; throw cause; }
  }, []);
  const value = useMemo(() => ({ register, isBlocked, requestLeave, runTerminalExit, shouldProtectUnload }), [register, isBlocked, requestLeave, runTerminalExit, shouldProtectUnload]);

  function stay() {
    pendingActionRef.current = null;
    setConfirmOpen(false);
  }

  function leave() {
    if (editorRef.current?.().busy) return;
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setConfirmOpen(false);
    action?.();
  }

  return <NavigationGuardContext.Provider value={value}>
    {children}
    <UnsavedChangesDialog open={confirmOpen} onStay={stay} onLeave={leave} />
  </NavigationGuardContext.Provider>;
}

export function useEditNavigation() {
  return useContext(NavigationGuardContext);
}

export function useUnsavedChangesGuard({ dirty, busy }: EditState) {
  const navigation = useEditNavigation();
  const stateRef = useRef({ dirty, busy });
  const readState = useCallback(() => stateRef.current, []);

  useLayoutEffect(() => { stateRef.current = { dirty, busy }; }, [dirty, busy]);
  useLayoutEffect(() => navigation.register(readState), [navigation, readState]);

  useEffect(() => {
    if (!dirty) return;
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!navigation.shouldProtectUnload()) return;
      event.preventDefault(); event.returnValue = "";
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty, navigation]);

  return navigation;
}
