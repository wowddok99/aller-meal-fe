/** Result acknowledgement can only close and refresh; it never replays the mutation. */
export async function runMutationDialogAction(
  { busy, hasResult }: { busy: boolean; hasResult: boolean },
  submit: () => Promise<unknown>,
  close: () => void,
  refresh: () => Promise<unknown>,
) {
  if (busy) return;
  if (hasResult) { close(); await refresh(); }
  else await submit();
}
