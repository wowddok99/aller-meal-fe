/** A confirmed account-state response requires account UI to re-read its data. */
export const ACCOUNT_STATUS_CHANGED_EVENT = "allermeal:account-status-changed";

export function notifyAccountStatusChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(ACCOUNT_STATUS_CHANGED_EVENT));
}
