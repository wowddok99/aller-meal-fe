export function isCollectionOperationForSelection(selectedId: string | undefined, sourceId: string | undefined) {
  return Boolean(selectedId && sourceId && selectedId.toLowerCase() === sourceId.toLowerCase());
}

/** Recheck the live URL as well as rendered selection before dispatching an old operation. */
export function runForCollectionSelection(
  sourceId: string | undefined,
  renderedSelection: string | undefined,
  currentSelection: string | undefined,
  action: () => void,
) {
  if (!isCollectionOperationForSelection(renderedSelection, sourceId) || !isCollectionOperationForSelection(currentSelection, sourceId)) return false;
  action();
  return true;
}

/** An accepted request is unresolved until its result is terminal, even if polling paused. */
export function isCollectionRequestUnresolved(hasRetryIntent: boolean, trackingCurrent: boolean, trackedStatus: string | null | undefined) {
  return hasRetryIntent || (trackingCurrent && trackedStatus !== "SUCCEEDED" && trackedStatus !== "FAILED");
}
