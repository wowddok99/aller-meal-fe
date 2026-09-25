const fallbackRefreshSeconds = 3;

export function getCollectionRefreshDelay(retryAfterSeconds?: number) {
  const refreshSeconds =
    typeof retryAfterSeconds === "number" && retryAfterSeconds > 0
      ? retryAfterSeconds
      : fallbackRefreshSeconds;

  return refreshSeconds * 1_000;
}
