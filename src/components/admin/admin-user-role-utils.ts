const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeUserId(value: string) {
  return value.trim().toLowerCase();
}

export function validateUserId(value: string) {
  return UUID_PATTERN.test(normalizeUserId(value));
}

export function compactUserId(value: string) {
  const normalized = normalizeUserId(value);
  return normalized.length > 12
    ? `${normalized.slice(0, 8)}...${normalized.slice(-4)}`
    : normalized;
}
