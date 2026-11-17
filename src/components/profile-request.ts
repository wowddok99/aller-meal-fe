import { ApiClientError } from "@/shared/api/api-client-error";

export type ProfileFailureState = "error" | "withdrawal-pending";

export function getProfileFailureState(error: unknown): ProfileFailureState {
  return error instanceof ApiClientError && error.status === 403 && error.code === "ACCOUNT_WITHDRAWAL_PENDING"
    ? "withdrawal-pending"
    : "error";
}

/** Only commit a profile response while the session request that started it remains current. */
export async function loadCurrentProfile<T>(
  request: () => Promise<T>,
  isCurrent: () => boolean,
  onSuccess: (value: T) => void,
  onError: (error: unknown) => void,
  onReady: () => void = () => {},
) {
  if (!isCurrent()) return;
  onReady();
  try {
    const result = await request();
    if (isCurrent()) onSuccess(result);
  } catch (error) {
    if (isCurrent()) onError(error);
  }
}
